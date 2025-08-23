# LinkedIn Connections Import - Implementation Guide
*KWJT Platform Feature Implementation*

## Overview
This guide provides step-by-step implementation instructions for adding LinkedIn connections import functionality to the KWJT platform. Save this file as `/docs/features/connections-import-guide.md` in your codebase.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface Layer                   │
├─────────────────────────────────────────────────────────┤
│  ConnectionsImporter │ NetworkAnalytics │ ConnectionList │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                         │
├─────────────────────────────────────────────────────────┤
│  ConnectionsService │ NetworkAnalyzer │ EnrichmentService│
├─────────────────────────────────────────────────────────┤
│                    Data Layer (Supabase)                 │
├─────────────────────────────────────────────────────────┤
│     connections    │  company_network_stats  │           │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### 1. Connections Table

```sql
-- Migration: 001_create_connections_table.sql
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Core fields from LinkedIn export
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  full_name VARCHAR(512) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  linkedin_url VARCHAR(512),
  email VARCHAR(255),
  company VARCHAR(255),
  position VARCHAR(512),
  connected_date DATE,
  
  -- Enhanced fields for intelligence
  network_strength DECIMAL(3,2) DEFAULT 0.50,
  is_warm_contact BOOLEAN DEFAULT false,
  last_interaction DATE,
  interaction_count INTEGER DEFAULT 0,
  notes TEXT,
  tags TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, linkedin_url),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL)
);

-- Indexes for performance
CREATE INDEX idx_connections_user_id ON public.connections(user_id);
CREATE INDEX idx_connections_company ON public.connections(user_id, lower(company));
CREATE INDEX idx_connections_full_text ON public.connections 
  USING gin(to_tsvector('english', 
    full_name || ' ' || COALESCE(company, '') || ' ' || COALESCE(position, '')
  ));
CREATE INDEX idx_connections_connected_date ON public.connections(connected_date DESC);

-- RLS Policies
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON public.connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON public.connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" ON public.connections
  FOR DELETE USING (auth.uid() = user_id);
```

### 2. Company Network Stats Table

```sql
-- Migration: 002_create_company_network_stats.sql
CREATE TABLE IF NOT EXISTS public.company_network_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  
  -- Network metrics
  connection_count INTEGER DEFAULT 0,
  email_available_count INTEGER DEFAULT 0,
  senior_connection_count INTEGER DEFAULT 0,
  departments TEXT[],
  
  -- Strength indicators
  avg_network_strength DECIMAL(3,2) DEFAULT 0.50,
  has_hiring_manager BOOLEAN DEFAULT false,
  has_recruiter BOOLEAN DEFAULT false,
  referral_potential_score DECIMAL(3,2) DEFAULT 0.00,
  
  -- Metadata
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, company_name)
);

-- Indexes
CREATE INDEX idx_company_stats_user ON public.company_network_stats(user_id);
CREATE INDEX idx_company_stats_company ON public.company_network_stats(lower(company_name));
CREATE INDEX idx_company_stats_count ON public.company_network_stats(connection_count DESC);

-- RLS Policies
ALTER TABLE public.company_network_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company stats" ON public.company_network_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own company stats" ON public.company_network_stats
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Database Functions

```sql
-- Migration: 003_create_network_functions.sql

-- Function to calculate network strength
CREATE OR REPLACE FUNCTION calculate_network_strength()
RETURNS TRIGGER AS $$
BEGIN
  NEW.network_strength = LEAST(1.0, (
    CASE WHEN NEW.email IS NOT NULL THEN 0.25 ELSE 0 END +
    CASE 
      WHEN NEW.position ILIKE '%ceo%' OR NEW.position ILIKE '%cto%' 
           OR NEW.position ILIKE '%cfo%' OR NEW.position ILIKE '%founder%' THEN 0.35
      WHEN NEW.position ILIKE '%director%' OR NEW.position ILIKE '%vp%' 
           OR NEW.position ILIKE '%vice president%' THEN 0.30
      WHEN NEW.position ILIKE '%manager%' OR NEW.position ILIKE '%lead%' THEN 0.20
      ELSE 0.10
    END +
    CASE 
      WHEN NEW.connected_date < NOW() - INTERVAL '3 years' THEN 0.20
      WHEN NEW.connected_date < NOW() - INTERVAL '1 year' THEN 0.15
      ELSE 0.10
    END +
    CASE WHEN NEW.interaction_count > 5 THEN 0.20
         WHEN NEW.interaction_count > 0 THEN 0.10
         ELSE 0
    END
  ));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_network_strength
  BEFORE INSERT OR UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION calculate_network_strength();

-- Function to update company network stats
CREATE OR REPLACE FUNCTION update_company_network_stats(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Clear existing stats
  DELETE FROM public.company_network_stats WHERE user_id = p_user_id;
  
  -- Insert new stats
  INSERT INTO public.company_network_stats (
    user_id,
    company_name,
    connection_count,
    email_available_count,
    senior_connection_count,
    departments,
    avg_network_strength,
    has_hiring_manager,
    has_recruiter
  )
  SELECT 
    p_user_id,
    company,
    COUNT(*),
    COUNT(email),
    COUNT(*) FILTER (WHERE position ILIKE ANY(ARRAY['%director%', '%vp%', '%vice president%', '%manager%', '%head%'])),
    ARRAY_AGG(DISTINCT 
      CASE 
        WHEN position ILIKE '%engineering%' OR position ILIKE '%developer%' THEN 'Engineering'
        WHEN position ILIKE '%sales%' THEN 'Sales'
        WHEN position ILIKE '%marketing%' THEN 'Marketing'
        WHEN position ILIKE '%product%' THEN 'Product'
        WHEN position ILIKE '%design%' THEN 'Design'
        WHEN position ILIKE '%hr%' OR position ILIKE '%human%' OR position ILIKE '%people%' THEN 'HR'
        WHEN position ILIKE '%finance%' OR position ILIKE '%accounting%' THEN 'Finance'
        ELSE 'Other'
      END
    ),
    AVG(network_strength),
    BOOL_OR(position ILIKE '%hiring manager%' OR position ILIKE '%talent acquisition%'),
    BOOL_OR(position ILIKE '%recruiter%' OR position ILIKE '%recruitment%')
  FROM public.connections
  WHERE user_id = p_user_id 
    AND company IS NOT NULL 
    AND company != ''
  GROUP BY company
  HAVING COUNT(*) >= 2;  -- Only track companies with 2+ connections
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Component Structure

### 1. File Structure
```
src/
├── components/
│   └── connections/
│       ├── ConnectionsImporter.tsx
│       ├── ConnectionsList.tsx
│       ├── NetworkAnalytics.tsx
│       ├── ConnectionCard.tsx
│       └── CompanyNetworkCard.tsx
├── hooks/
│   └── useConnections.ts
├── services/
│   └── connectionsService.ts
├── types/
│   └── connections.ts
└── utils/
    └── connectionsParsing.ts
```

### 2. Type Definitions

```typescript
// src/types/connections.ts

export interface Connection {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  linkedin_url?: string;
  email?: string;
  company?: string;
  position?: string;
  connected_date?: string;
  network_strength: number;
  is_warm_contact: boolean;
  last_interaction?: string;
  interaction_count: number;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CompanyNetworkStats {
  id: string;
  user_id: string;
  company_name: string;
  connection_count: number;
  email_available_count: number;
  senior_connection_count: number;
  departments: string[];
  avg_network_strength: number;
  has_hiring_manager: boolean;
  has_recruiter: boolean;
  referral_potential_score: number;
  last_calculated: string;
}

export interface LinkedInCSVRow {
  'First Name': string;
  'Last Name': string;
  'URL': string;
  'Email Address'?: string;
  'Company'?: string;
  'Position'?: string;
  'Connected On': string;
}

export interface ImportProgress {
  status: 'idle' | 'parsing' | 'validating' | 'importing' | 'analyzing' | 'complete' | 'error';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  message: string;
}

export interface NetworkAnalytics {
  totalConnections: number;
  companiesCount: number;
  emailCoverage: number;
  topCompanies: CompanyNetworkStats[];
  networkGrowth: {
    month: string;
    count: number;
  }[];
  departmentDistribution: {
    department: string;
    count: number;
  }[];
}
```

### 3. Service Implementation

```typescript
// src/services/connectionsService.ts

import { supabase } from '@/lib/supabase';
import type { Connection, CompanyNetworkStats, LinkedInCSVRow, ImportProgress } from '@/types/connections';

export class ConnectionsService {
  private batchSize = 100;

  async importConnections(
    csvData: LinkedInCSVRow[], 
    onProgress: (progress: ImportProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Initial progress
      onProgress({
        status: 'validating',
        totalRows: csvData.length,
        processedRows: 0,
        successCount: 0,
        errorCount: 0,
        duplicateCount: 0,
        message: 'Validating connections data...'
      });

      // Filter and format connections
      const validConnections = csvData
        .filter(row => row['First Name'] && row['Last Name'])
        .map(row => this.formatConnection(row, userId));

      // Import in batches
      let processedCount = 0;
      let successCount = 0;
      let errorCount = 0;
      let duplicateCount = 0;

      for (let i = 0; i < validConnections.length; i += this.batchSize) {
        const batch = validConnections.slice(i, i + this.batchSize);
        
        onProgress({
          status: 'importing',
          totalRows: csvData.length,
          processedRows: processedCount,
          successCount,
          errorCount,
          duplicateCount,
          message: `Importing connections ${i + 1} to ${Math.min(i + this.batchSize, validConnections.length)}...`
        });

        const { data, error } = await supabase
          .from('connections')
          .upsert(batch, {
            onConflict: 'user_id,linkedin_url',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          errorCount += batch.length;
          console.error('Batch import error:', error);
        } else {
          successCount += data?.length || 0;
          duplicateCount += batch.length - (data?.length || 0);
        }

        processedCount += batch.length;
      }

      // Update network stats
      onProgress({
        status: 'analyzing',
        totalRows: csvData.length,
        processedRows: processedCount,
        successCount,
        errorCount,
        duplicateCount,
        message: 'Analyzing network statistics...'
      });

      await this.updateNetworkStats(userId);

      onProgress({
        status: 'complete',
        totalRows: csvData.length,
        processedRows: processedCount,
        successCount,
        errorCount,
        duplicateCount,
        message: 'Import completed successfully!'
      });

      return { success: true };

    } catch (error) {
      console.error('Import error:', error);
      onProgress({
        status: 'error',
        totalRows: csvData.length,
        processedRows: 0,
        successCount: 0,
        errorCount: csvData.length,
        duplicateCount: 0,
        message: error instanceof Error ? error.message : 'Import failed'
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed' 
      };
    }
  }

  private formatConnection(row: LinkedInCSVRow, userId: string): Partial<Connection> {
    return {
      user_id: userId,
      first_name: row['First Name'].trim(),
      last_name: row['Last Name'].trim(),
      linkedin_url: row['URL'] || undefined,
      email: row['Email Address']?.trim() || undefined,
      company: row['Company']?.trim() || undefined,
      position: row['Position']?.trim() || undefined,
      connected_date: this.parseLinkedInDate(row['Connected On'])
    };
  }

  private parseLinkedInDate(dateStr: string): string | undefined {
    if (!dateStr) return undefined;
    
    try {
      // LinkedIn format: "17 Aug 2025"
      const parts = dateStr.trim().split(' ');
      if (parts.length !== 3) return undefined;
      
      const [day, monthStr, year] = parts;
      const months: Record<string, string> = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
      const month = months[monthStr];
      if (!month) return undefined;
      
      return `${year}-${month}-${day.padStart(2, '0')}`;
    } catch {
      return undefined;
    }
  }

  private async updateNetworkStats(userId: string): Promise<void> {
    await supabase.rpc('update_company_network_stats', { p_user_id: userId });
  }

  async getConnections(filters?: {
    search?: string;
    company?: string;
    hasEmail?: boolean;
  }): Promise<Connection[]> {
    let query = supabase
      .from('connections')
      .select('*')
      .order('network_strength', { ascending: false });

    if (filters?.search) {
      query = query.textSearch('full_name', filters.search);
    }

    if (filters?.company) {
      query = query.ilike('company', `%${filters.company}%`);
    }

    if (filters?.hasEmail) {
      query = query.not('email', 'is', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getCompanyNetworkStats(): Promise<CompanyNetworkStats[]> {
    const { data, error } = await supabase
      .from('company_network_stats')
      .select('*')
      .order('connection_count', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  async getNetworkAnalytics(): Promise<NetworkAnalytics> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Get total connections
    const { count: totalConnections } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get company stats
    const { data: topCompanies } = await supabase
      .from('company_network_stats')
      .select('*')
      .eq('user_id', userId)
      .order('connection_count', { ascending: false })
      .limit(10);

    // Get email coverage
    const { count: withEmail } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('email', 'is', null);

    const emailCoverage = totalConnections ? (withEmail || 0) / totalConnections : 0;

    return {
      totalConnections: totalConnections || 0,
      companiesCount: topCompanies?.length || 0,
      emailCoverage,
      topCompanies: topCompanies || [],
      networkGrowth: [], // TODO: Implement growth calculation
      departmentDistribution: [] // TODO: Implement department analysis
    };
  }

  async searchConnectionsForCompany(companyName: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .ilike('company', `%${companyName}%`)
      .order('network_strength', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  async enhanceJobApplication(jobId: string, companyName: string) {
    // Find connections at this company
    const connections = await this.searchConnectionsForCompany(companyName);
    
    // Update job application with network insights
    const { error } = await supabase
      .from('job_applications')
      .update({
        network_connections: connections.length,
        has_referral_path: connections.length > 0,
        strongest_connection_id: connections[0]?.id
      })
      .eq('id', jobId);

    if (error) throw error;
    
    return {
      connectionCount: connections.length,
      topConnections: connections.slice(0, 3),
      hasHiringManager: connections.some(c => 
        c.position?.toLowerCase().includes('hiring') || 
        c.position?.toLowerCase().includes('talent')
      )
    };
  }
}

export const connectionsService = new ConnectionsService();
```

## Implementation Prompts for Claude Code

### Phase 1: Database Setup (5 minutes)
```bash
# Prompt 1: Create database migrations
"Create Supabase migrations for LinkedIn connections import feature. Need two tables: 'connections' for storing imported LinkedIn connections with fields for name, email, company, position, linkedin_url, and network_strength. Second table 'company_network_stats' for aggregated company statistics. Include RLS policies for user data isolation, indexes for performance, and a trigger function to calculate network_strength based on seniority and connection age."
```

### Phase 2: Core Import Component (10 minutes)
```bash
# Prompt 2: Build the importer component
"Create a React component 'ConnectionsImporter.tsx' that handles LinkedIn CSV file upload using the existing KWJT design system. Parse CSV with PapaParse, handle LinkedIn's special header format, validate data, and batch import to Supabase. Show real-time progress with status messages. Use the existing Card components with shadow-premium-md styling. Include error handling for malformed CSV files and duplicate connections."
```

### Phase 3: Network Analytics Dashboard (10 minutes)
```bash
# Prompt 3: Create analytics visualization
"Build a 'NetworkAnalytics.tsx' component that displays connection statistics from the company_network_stats table. Show total connections, top 10 companies by connection count, email coverage percentage, and network strength distribution. Use the existing KWJT chart components and card design system. Include a company detail view that lists all connections at a specific company with their positions and network strength scores."
```

### Phase 4: Connections List View (8 minutes)
```bash
# Prompt 4: Build connections management interface
"Create a 'ConnectionsList.tsx' component with search, filter, and sort capabilities for managing imported connections. Include filters for company, has email, and connection strength. Display connections in a responsive grid using the existing KWJT card components. Add inline editing for notes and tags. Include bulk actions for tagging and deleting connections."
```

### Phase 5: Job Application Enhancement (8 minutes)
```bash
# Prompt 5: Integrate with job applications
"Enhance the existing job application components to show network insights. When viewing or creating a job application, automatically search for connections at that company and display them. Show connection count badge, top 3 connections with their positions, and a 'Request Referral' action button. Update the applications list to show a network indicator icon when connections exist at the company."
```

### Phase 6: Service Layer & Hooks (7 minutes)
```bash
# Prompt 6: Create service layer and React hooks
"Create a TypeScript service class 'connectionsService.ts' with methods for importing connections, calculating network stats, searching connections by company, and enhancing job applications with network data. Then create a custom React hook 'useConnections.ts' that wraps the service methods with proper error handling, loading states, and SWR or React Query for caching."
```

### Phase 7: Testing & Error Handling (5 minutes)
```bash
# Prompt 7: Add comprehensive error handling
"Add error boundary components and comprehensive error handling to the connections import feature. Handle edge cases like: CSV files over 10MB, malformed data, network interruptions during import, duplicate detection, and missing required fields. Show user-friendly error messages using the existing KWJT toast notification system. Include retry mechanisms for failed batch imports."
```

## Testing Checklist

- [ ] CSV Import Testing
  - [ ] Standard LinkedIn export format
  - [ ] Files with 1000+ connections
  - [ ] Files with special characters in names
  - [ ] Files missing optional fields
  - [ ] Duplicate connection handling

- [ ] Performance Testing
  - [ ] Import 5000+ connections
  - [ ] Search performance with large datasets
  - [ ] Page load time with analytics

- [ ] User Experience Testing
  - [ ] Progress indicators accuracy
  - [ ] Error message clarity
  - [ ] Mobile responsiveness
  - [ ] Accessibility compliance

- [ ] Integration Testing
  - [ ] Job application enhancement
  - [ ] Network stats calculation
  - [ ] RLS policy verification
  - [ ] Data export functionality

## Deployment Checklist

1. **Database Migration**
   - [ ] Run migrations in staging
   - [ ] Verify indexes created
   - [ ] Test RLS policies
   - [ ] Backup existing data

2. **Feature Flags**
   - [ ] Create feature flag for connections import
   - [ ] Enable for beta users first
   - [ ] Monitor error rates

3. **Monitoring**
   - [ ] Set up error tracking for import failures
   - [ ] Monitor import performance metrics
   - [ ] Track feature adoption rate

4. **Documentation**
   - [ ] Update user documentation
   - [ ] Create video tutorial
   - [ ] Add to feature changelog

## Success Metrics

### Week 1 Post-Launch
- Import success rate > 95%
- Average import time < 30 seconds for 2000 connections
- Zero critical errors reported

### Week 2 Post-Launch
- 40% of active users have imported connections
- 25% of new job applications use network insights
- User satisfaction score > 4.5/5

### Month 1 Post-Launch
- 60% feature adoption rate
- 15% increase in user engagement
- 2x higher interview rate for network-enhanced applications

## Troubleshooting Guide

### Common Issues

1. **Import Fails Silently**
   - Check Supabase RLS policies
   - Verify user authentication
   - Check browser console for CORS errors

2. **Slow Import Performance**
   - Reduce batch size to 50
   - Implement Web Worker for parsing
   - Add database connection pooling

3. **Duplicate Connections**
   - Verify unique constraint on linkedin_url
   - Check upsert conflict resolution
   - Clear cache after import

4. **Missing Company Stats**
   - Verify trigger function execution
   - Check for company name normalization
   - Run manual stats recalculation

## Next Features (Phase 2)

1. **Email Integration**
   - Match connections with Gmail contacts
   - Track last email interaction
   - Auto-update contact information

2. **Intelligence Layer**
   - AI-powered referral path detection
   - Optimal outreach timing prediction
   - Connection strength ML model

3. **Network Growth**
   - Strategic connection recommendations
   - Industry network analysis
   - Competitor employee tracking

---

*End of Implementation Guide - Save as `/docs/features/connections-import-guide.md`*