# LinkedIn Company Discovery Feature - Claude Code Implementation Prompts

## Project Context (Include in Each Prompt)
```
Project: KWJT (Knowledge Worker Job Tracker)
Stack: React 19, TypeScript, Tailwind CSS, Supabase
Current State: 85% complete MVP with job application tracking
File Structure: Standard React with /components, /lib, /types directories
```

---

## PROMPT 1: Backend Infrastructure & Database Setup

```markdown
I'm building a LinkedIn company discovery feature for my React/TypeScript/Supabase job tracking application (KWJT). The app helps knowledge workers track job applications with company information.

**Project Context:**
- Stack: React 19, TypeScript, Supabase, Tailwind CSS
- Current: 85% complete MVP with existing company management system
- Need: Automatically discover LinkedIn company URLs using Brave Search API

**Please implement the backend infrastructure:**

## 1. Supabase Edge Function
Create `supabase/functions/discover-linkedin-company/index.ts` with:

### Requirements:
- Accept company name as input
- Use Brave Search API to search for "site:linkedin.com/company {companyName}"
- Parse results to extract LinkedIn company URLs
- Calculate confidence scores based on match quality
- Cache results for 7 days to minimize API calls
- Handle CORS properly for browser requests
- Return top 3 matches with confidence scores

### API Details:
- Brave Search endpoint: https://api.search.brave.com/res/v1/web/search
- Auth header: X-Subscription-Token: {BRAVE_SEARCH_API_KEY}
- Free tier: 2,000 queries/month

### Expected Response Format:
```typescript
interface LinkedInResult {
  url: string;                // Full LinkedIn URL
  companyName: string;        // Extracted company name
  vanityName: string;         // URL slug (e.g., "microsoft")
  description: string;        // First 200 chars of description
  confidence: number;         // 0.0 to 1.0 confidence score
}
```

### Confidence Scoring Logic:
- Base: 0.6 for valid LinkedIn company URL
- +0.25 if company name matches search term
- +0.10 if first result
- +0.05 if URL contains search term as slug
- Cap at 0.95 maximum

### Error Handling:
- Invalid/missing company name: 400 error
- Brave API failure: 500 error with graceful message
- No results: Return empty array, not error

## 2. Database Schema Updates
Create migration file `supabase/migrations/[timestamp]_linkedin_discovery.sql`:

### Cache Table:
```sql
CREATE TABLE linkedin_search_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_term TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  search_count INTEGER DEFAULT 1
);

CREATE INDEX idx_linkedin_cache_search ON linkedin_search_cache(search_term);
CREATE INDEX idx_linkedin_cache_expires ON linkedin_search_cache(expires_at);
```

### Companies Table Updates:
```sql
ALTER TABLE companies 
ADD COLUMN linkedin_url TEXT,
ADD COLUMN linkedin_discovery_method TEXT CHECK (linkedin_discovery_method IN ('auto', 'manual', 'none')),
ADD COLUMN linkedin_confidence DECIMAL(3,2),
ADD COLUMN linkedin_last_verified TIMESTAMP;
```

### Analytics Table:
```sql
CREATE TABLE linkedin_search_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  search_term TEXT NOT NULL,
  results_count INTEGER,
  selected_url TEXT,
  selection_confidence DECIMAL(3,2),
  user_action TEXT CHECK (user_action IN ('selected', 'manual_entry', 'skipped')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 3. Environment Configuration
Add to `.env.local` and Supabase dashboard secrets:
```
BRAVE_SEARCH_API_KEY=your_api_key_here
```

## 4. Testing Instructions
Provide:
1. cURL command to test the edge function locally
2. SQL queries to verify database tables were created
3. Example test with "Microsoft" as company name

Please implement all files with proper TypeScript types, error handling, and include comments for complex logic.
```

---

## PROMPT 2: React Component Implementation

```markdown
Now let's implement the React component for LinkedIn company discovery. This component will use the Supabase edge function we just created.

**Context:**
- We have a working edge function at 'discover-linkedin-company'
- Database tables are set up for caching and storing LinkedIn data
- Using existing Supabase client from @/lib/supabase

**Please create the LinkedInCompanyDiscovery component:**

## File: components/LinkedInCompanyDiscovery.tsx

### Component Requirements:

#### Props Interface:
```typescript
interface LinkedInCompanyDiscoveryProps {
  companyName: string;                    // Current company name from form
  currentLinkedInUrl?: string;            // Existing LinkedIn URL if any
  onLinkedInSelect: (url: string | null, confidence?: number) => void;
  required?: boolean;                     // Whether LinkedIn URL is required
}
```

#### Features to Implement:
1. **Auto-search Trigger:**
   - Debounce search by 500ms after typing stops
   - Only search if company name is 3+ characters
   - Show loading spinner during search

2. **Results Display:**
   - Show up to 3 LinkedIn company suggestions
   - Display confidence score with color coding:
     - Green (≥80%): High confidence
     - Yellow (60-79%): Medium confidence  
     - Gray (<60%): Low confidence
   - Include company name, vanity URL, and description preview
   - Auto-select if single result with ≥90% confidence

3. **User Interactions:**
   - Click to select a suggested company
   - "None of these" option to enter manually
   - Manual URL entry with validation
   - Clear selection button
   - External link to view LinkedIn page

4. **State Management:**
   - Track: searching, suggestions, selected URL, manual mode, errors
   - Persist selection to parent form
   - Track metrics for analytics

5. **Error Handling:**
   - Network failures: Show user-friendly message
   - No results: Offer manual entry option
   - Invalid manual URLs: Show validation error

6. **Visual Design (Tailwind CSS):**
   - Match existing app's executive design system
   - Use shadows for depth (shadow-sm, shadow-md)
   - Smooth transitions on hover
   - Mobile-responsive layout
   - Loading states with Loader2 icon from lucide-react

#### Component Structure:
```typescript
// Import requirements
import React, { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Loader2, Building2, ExternalLink, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// LinkedInResult interface (matching edge function response)
// Component implementation
// URL validation function
// Confidence color helper
// Analytics tracking
```

#### Specific UI States to Handle:
1. **Initial**: Empty, waiting for company name
2. **Searching**: Show spinner and "Searching LinkedIn..." message
3. **Results Found**: Display suggestions with confidence
4. **No Results**: Show warning with manual entry option
5. **Selected**: Show confirmed selection with link
6. **Manual Mode**: Show URL input field with validation
7. **Error**: Display error message with retry option

## File: hooks/useDebounce.ts (if not existing)

Create a simple debounce hook:
```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
```

## Testing Component in Isolation

Also create a test file to verify the component works:

File: components/__tests__/LinkedInCompanyDiscovery.test.tsx
- Test debounced search triggers
- Test confidence score calculations
- Test manual entry validation
- Test error states

Provide the complete implementation with all states handled and proper TypeScript types throughout.
```

---

## PROMPT 3: Form Integration & State Management

```markdown
Now let's integrate the LinkedInCompanyDiscovery component into the existing job application form and ensure proper state management.

**Context:**
- LinkedInCompanyDiscovery component is complete
- Need to integrate with existing JobApplicationForm
- Must preserve existing form functionality while adding LinkedIn discovery

**Please implement the integration:**

## 1. Update JobApplicationForm Component

File to modify: components/JobApplicationForm.tsx (or similar)

### Integration Requirements:

#### Form State Updates:
```typescript
// Add to existing form state interface
interface JobApplicationFormData {
  // ... existing fields ...
  companyName: string;
  linkedinUrl?: string;
  linkedinConfidence?: number;
  linkedinDiscoveryMethod?: 'auto' | 'manual' | 'none';
}
```

#### Component Integration:
1. Import LinkedInCompanyDiscovery component
2. Add it below the company name input field
3. Only show when companyName has a value
4. Pass company name and handle URL selection
5. Update both linkedinUrl and linkedinConfidence in form state

#### Database Integration:
When saving the job application:
1. If LinkedIn URL was auto-discovered, save with confidence score
2. Track the discovery method (auto/manual/none)
3. Update or create company record with LinkedIn data
4. Log metrics for analytics

### Example Integration Pattern:
```tsx
import { LinkedInCompanyDiscovery } from './LinkedInCompanyDiscovery';

const JobApplicationForm = () => {
  const [formData, setFormData] = useState<JobApplicationFormData>({
    companyName: '',
    linkedinUrl: '',
    linkedinConfidence: null,
    linkedinDiscoveryMethod: 'none',
    // ... other existing fields
  });

  const handleLinkedInSelect = (url: string | null, confidence?: number) => {
    setFormData(prev => ({
      ...prev,
      linkedinUrl: url || '',
      linkedinConfidence: confidence || null,
      linkedinDiscoveryMethod: url ? (confidence ? 'auto' : 'manual') : 'none'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save company with LinkedIn data
    const { data: company } = await supabase
      .from('companies')
      .upsert({
        name: formData.companyName,
        linkedin_url: formData.linkedinUrl,
        linkedin_confidence: formData.linkedinConfidence,
        linkedin_discovery_method: formData.linkedinDiscoveryMethod,
        linkedin_last_verified: new Date().toISOString()
      })
      .select()
      .single();

    // Save job application with company reference
    // ... existing save logic
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Existing company name input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Company Name *
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>

      {/* LinkedIn Discovery Component */}
      {formData.companyName && (
        <div className="mt-4">
          <LinkedInCompanyDiscovery
            companyName={formData.companyName}
            currentLinkedInUrl={formData.linkedinUrl}
            onLinkedInSelect={handleLinkedInSelect}
          />
        </div>
      )}

      {/* Rest of form fields */}
      {/* ... */}
    </form>
  );
};
```

## 2. Update Company Management Logic

File: lib/companies.ts (or services/companyService.ts)

### Add Functions:
```typescript
// Check if company exists with LinkedIn URL
export async function findCompanyByLinkedIn(linkedinUrl: string) {
  return supabase
    .from('companies')
    .select('*')
    .eq('linkedin_url', linkedinUrl)
    .single();
}

// Update company LinkedIn data
export async function updateCompanyLinkedIn(
  companyId: string,
  linkedinData: {
    url: string;
    confidence: number;
    method: 'auto' | 'manual';
  }
) {
  return supabase
    .from('companies')
    .update({
      linkedin_url: linkedinData.url,
      linkedin_confidence: linkedinData.confidence,
      linkedin_discovery_method: linkedinData.method,
      linkedin_last_verified: new Date().toISOString()
    })
    .eq('id', companyId);
}
```

## 3. Add Types

File: types/company.ts

```typescript
export interface Company {
  id: string;
  name: string;
  linkedin_url?: string;
  linkedin_confidence?: number;
  linkedin_discovery_method?: 'auto' | 'manual' | 'none';
  linkedin_last_verified?: string;
  // ... other existing fields
}

export interface LinkedInSearchResult {
  url: string;
  companyName: string;
  vanityName: string;
  description: string;
  confidence: number;
}
```

Please implement these integrations ensuring:
1. Smooth data flow between components
2. Proper error handling throughout
3. No disruption to existing form functionality
4. Clean separation of concerns
```

---

## PROMPT 4: Testing & Optimization

```markdown
Let's add comprehensive testing and performance optimizations for the LinkedIn discovery feature.

**Context:**
- Backend edge function is complete
- React component is implemented
- Integration with job application form is done
- Need testing coverage and performance optimization

**Please implement testing and optimizations:**

## 1. Component Tests

File: components/__tests__/LinkedInCompanyDiscovery.test.tsx

### Test Cases to Implement:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LinkedInCompanyDiscovery } from '../LinkedInCompanyDiscovery';

describe('LinkedInCompanyDiscovery', () => {
  // Mock supabase
  jest.mock('@/lib/supabase', () => ({
    supabase: {
      functions: {
        invoke: jest.fn()
      },
      from: jest.fn(() => ({
        insert: jest.fn()
      }))
    }
  }));

  test('should trigger search after debounced input');
  test('should display loading state during search');
  test('should show suggestions with confidence scores');
  test('should auto-select high confidence single result');
  test('should handle no results found');
  test('should validate manual LinkedIn URLs');
  test('should track analytics on selection');
  test('should handle API errors gracefully');
  test('should respect debounce timing');
  test('should clear selection when X clicked');
});
```

## 2. Edge Function Tests

File: supabase/functions/discover-linkedin-company/index.test.ts

### Test Cases:
```typescript
describe('LinkedIn Discovery Edge Function', () => {
  test('should return cached results when available');
  test('should search Brave API when no cache');
  test('should calculate confidence scores correctly');
  test('should handle company name variations');
  test('should extract vanity names from URLs');
  test('should limit results to top 3');
  test('should handle Brave API errors');
  test('should validate input parameters');
  test('should update cache after successful search');
});
```

## 3. Integration Tests

File: __tests__/integration/linkedinDiscovery.test.ts

### End-to-End Test Scenarios:
```typescript
describe('LinkedIn Discovery Integration', () => {
  test('Complete flow: Search → Select → Save', async () => {
    // 1. Enter company name in form
    // 2. Wait for LinkedIn search
    // 3. Select a suggestion
    // 4. Submit form
    // 5. Verify database updates
  });

  test('Manual entry flow', async () => {
    // 1. Enter company name
    // 2. Click "None of these"
    // 3. Enter manual URL
    // 4. Submit and verify
  });

  test('Cache behavior', async () => {
    // 1. Search for company
    // 2. Clear and search again
    // 3. Verify cache hit (faster response)
  });
});
```

## 4. Performance Optimizations

### A. Implement Caching Strategy

File: lib/linkedinCache.ts
```typescript
export class LinkedInCache {
  private memoryCache: Map<string, CachedResult>;
  
  async get(companyName: string): Promise<LinkedInResult[] | null>;
  async set(companyName: string, results: LinkedInResult[]): Promise<void>;
  async preload(commonCompanies: string[]): Promise<void>;
}
```

### B. Add Request Queuing

File: lib/linkedinQueue.ts
```typescript
// Implement queue to batch requests and respect rate limits
export class LinkedInSearchQueue {
  private queue: SearchRequest[];
  private processing: boolean;
  
  async add(companyName: string): Promise<LinkedInResult[]>;
  private async processQueue(): Promise<void>;
  private async batchSearch(companies: string[]): Promise<Map<string, LinkedInResult[]>>;
}
```

### C. Optimize Component Rendering

Update: components/LinkedInCompanyDiscovery.tsx
- Add React.memo for suggestion items
- Use useCallback for event handlers
- Implement virtual scrolling for large result sets

## 5. Monitoring & Analytics

File: lib/analytics/linkedinMetrics.ts

```typescript
export class LinkedInMetrics {
  static async trackSearch(companyName: string, resultCount: number): Promise<void>;
  static async trackSelection(url: string, confidence: number, method: string): Promise<void>;
  static async getSuccessRate(): Promise<number>;
  static async getAverageConfidence(): Promise<number>;
  static async getCacheHitRate(): Promise<number>;
}
```

## 6. Error Boundary

File: components/LinkedInDiscoveryErrorBoundary.tsx

```typescript
export class LinkedInDiscoveryErrorBoundary extends React.Component {
  // Gracefully handle component errors
  // Log to error tracking service
  // Show fallback UI for manual entry
}
```

## 7. Performance Test Script

File: scripts/testLinkedInPerformance.ts

```typescript
// Script to test performance with various company names
async function testPerformance() {
  const testCompanies = [
    'Microsoft', 'Apple', 'Google', // Well-known
    'Acme Corp', 'Test Company', // Generic
    'スターバックス', '阿里巴巴', // International
  ];
  
  // Measure response times
  // Test cache effectiveness
  // Check confidence accuracy
  // Generate performance report
}
```

Please implement these tests and optimizations with:
1. Proper mocking strategies
2. Realistic test data
3. Performance benchmarks
4. Error tracking
5. Analytics dashboard queries
```

---

## PROMPT 5: Production Deployment & Monitoring

```markdown
Let's prepare the LinkedIn discovery feature for production deployment with proper monitoring and configuration.

**Context:**
- Feature is fully implemented and tested
- Need production configuration and monitoring
- Must handle scale and edge cases

**Please implement production readiness:**

## 1. Environment Configuration

File: .env.example
```
# LinkedIn Discovery
BRAVE_SEARCH_API_KEY=
BRAVE_API_RATE_LIMIT=2000
LINKEDIN_CACHE_TTL_DAYS=7
LINKEDIN_CONFIDENCE_THRESHOLD=0.7
```

File: lib/config/linkedinConfig.ts
```typescript
export const linkedInConfig = {
  api: {
    braveKey: process.env.BRAVE_SEARCH_API_KEY,
    rateLimit: parseInt(process.env.BRAVE_API_RATE_LIMIT || '2000'),
    timeout: 5000,
    retries: 3
  },
  cache: {
    ttlDays: parseInt(process.env.LINKEDIN_CACHE_TTL_DAYS || '7'),
    maxMemoryItems: 1000,
    compressionEnabled: true
  },
  confidence: {
    threshold: parseFloat(process.env.LINKEDIN_CONFIDENCE_THRESHOLD || '0.7'),
    autoSelectThreshold: 0.9
  },
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    sampleRate: 0.1
  }
};
```

## 2. Monitoring Setup

File: lib/monitoring/linkedinMonitor.ts
```typescript
import { createClient } from '@supabase/supabase-js';

export class LinkedInMonitor {
  // Track API usage against limits
  static async checkApiUsage(): Promise<{ used: number; limit: number; remaining: number }>;
  
  // Monitor search performance
  static async trackSearchMetrics(metrics: {
    searchTerm: string;
    responseTime: number;
    resultCount: number;
    cacheHit: boolean;
    error?: string;
  }): Promise<void>;
  
  // Alert on issues
  static async checkHealthStatus(): Promise<HealthStatus>;
  
  // Daily summary report
  static async generateDailyReport(): Promise<DailyReport>;
}
```

## 3. Rate Limiting Implementation

File: lib/rateLimiter/braveApiLimiter.ts
```typescript
export class BraveApiRateLimiter {
  private monthlyLimit: number;
  private dailyLimit: number;
  private requestLog: Map<string, number>;
  
  async canMakeRequest(): Promise<boolean>;
  async logRequest(companyName: string): Promise<void>;
  async getRemainingQuota(): Promise<{ daily: number; monthly: number }>;
  async resetDailyLimit(): Promise<void>;
}
```

## 4. Feature Flags

File: lib/features/linkedinFeatures.ts
```typescript
export const linkedInFeatures = {
  // Enable/disable feature entirely
  enabled: process.env.NEXT_PUBLIC_LINKEDIN_DISCOVERY_ENABLED === 'true',
  
  // Feature variations
  autoSearch: true,
  manualEntry: true,
  showConfidence: true,
  
  // A/B testing
  experimentGroup: process.env.NEXT_PUBLIC_LINKEDIN_EXPERIMENT_GROUP || 'control',
  
  // Gradual rollout
  rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_LINKEDIN_ROLLOUT || '100')
};
```

## 5. Database Indexes & Optimization

File: supabase/migrations/[timestamp]_linkedin_performance.sql
```sql
-- Add indexes for performance
CREATE INDEX CONCURRENTLY idx_companies_linkedin_url ON companies(linkedin_url) WHERE linkedin_url IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_companies_name_lower ON companies(LOWER(name));
CREATE INDEX CONCURRENTLY idx_cache_created ON linkedin_search_cache(created_at);

-- Partial index for high-confidence results
CREATE INDEX CONCURRENTLY idx_companies_high_confidence 
ON companies(linkedin_confidence) 
WHERE linkedin_confidence >= 0.8;

-- Add table partitioning for metrics (if high volume)
CREATE TABLE linkedin_search_metrics_2024_01 PARTITION OF linkedin_search_metrics
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## 6. Admin Dashboard Component

File: components/admin/LinkedInDiscoveryDashboard.tsx
```typescript
export const LinkedInDiscoveryDashboard: React.FC = () => {
  // Display:
  // - API usage vs limits
  // - Success rate metrics
  // - Average confidence scores
  // - Cache hit rate
  // - Error logs
  // - Top searched companies
  // - Manual override frequency
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard title="API Usage" value={apiUsage} limit={apiLimit} />
      <MetricCard title="Success Rate" value={successRate} target={75} />
      <MetricCard title="Cache Hit Rate" value={cacheHitRate} target={60} />
      {/* More metrics... */}
    </div>
  );
};
```

## 7. Error Recovery & Fallbacks

File: lib/linkedinFallback.ts
```typescript
export class LinkedInFallbackStrategy {
  // When Brave API fails
  async handleApiFailure(companyName: string): Promise<LinkedInResult[]> {
    // 1. Check extended cache (even if expired)
    // 2. Try alternative search method
    // 3. Return manual entry prompt
  }
  
  // When rate limit exceeded
  async handleRateLimitExceeded(): Promise<void> {
    // 1. Switch to cache-only mode
    // 2. Queue for batch processing
    // 3. Notify user of temporary limitation
  }
  
  // Data quality issues
  async validateAndClean(results: LinkedInResult[]): Promise<LinkedInResult[]> {
    // Remove duplicate URLs
    // Validate URL format
    // Normalize company names
    // Filter out suspicious results
  }
}
```

## 8. Production Checklist

File: docs/linkedin-discovery-deployment.md
```markdown
# LinkedIn Discovery Production Deployment Checklist

## Pre-deployment
- [ ] Brave API key configured in Supabase secrets
- [ ] Database migrations run successfully
- [ ] Edge function deployed and tested
- [ ] Rate limiting tested under load
- [ ] Error boundaries in place
- [ ] Monitoring dashboard accessible
- [ ] Feature flags configured
- [ ] Cache warming completed for top 500 companies

## Deployment
- [ ] Deploy edge function to production
- [ ] Run database migrations
- [ ] Deploy frontend with feature flag at 10%
- [ ] Monitor error rates for 1 hour
- [ ] Increase rollout to 50%
- [ ] Monitor for 24 hours
- [ ] Full rollout if metrics are healthy

## Post-deployment
- [ ] Monitor API usage daily
- [ ] Review confidence accuracy weekly
- [ ] Optimize cache strategy based on patterns
- [ ] Document common issues and solutions
```

Please implement all production readiness components with proper error handling, monitoring, and scalability considerations.
```

---

## Usage Instructions

### How to Use These Prompts:

1. **Start with Prompt 1** (Backend)
   - Copy the entire Prompt 1 section
   - Paste into Claude Code
   - Test the edge function before proceeding

2. **After Backend Works, Use Prompt 2** (React Component)
   - Verify edge function is working
   - Copy and paste Prompt 2
   - Test component in isolation

3. **Once Component Works, Use Prompt 3** (Integration)
   - Ensure component renders correctly
   - Copy and paste Prompt 3
   - Test full form flow

4. **Add Testing with Prompt 4** (Testing & Optimization)
   - After basic functionality works
   - Copy and paste Prompt 4
   - Run tests to verify coverage

5. **Prepare for Production with Prompt 5** (Deployment)
   - Once all tests pass
   - Copy and paste Prompt 5
   - Follow deployment checklist

### Tips for Success:

1. **Test After Each Phase**
   - Don't move to next prompt until current phase works
   - Use console.log liberally for debugging

2. **Customize as Needed**
   - Adjust company name field names to match your form
   - Modify Tailwind classes to match your design system
   - Update import paths to match your project structure

3. **Handle Errors Gracefully**
   - If Claude Code has issues, provide error messages back
   - Ask for specific fixes rather than regenerating everything

4. **Version Control**
   - Commit after each successful phase
   - Tag versions for easy rollback if needed

### Expected Timeline:
- Prompt 1: 30-45 minutes (including testing)
- Prompt 2: 30-45 minutes
- Prompt 3: 20-30 minutes
- Prompt 4: 45-60 minutes
- Prompt 5: 30-45 minutes
- **Total: 3-4 hours for complete implementation**

### Common Issues & Solutions:

**CORS Issues:**
Add to edge function if needed:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

**Type Errors:**
Ensure all interfaces are properly exported/imported between files

**API Key Issues:**
Double-check key is in both .env.local AND Supabase dashboard secrets

**Component Not Updating:**
Check that useDebounce hook is properly implemented and imported
```