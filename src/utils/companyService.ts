import { supabase, TABLES } from './supabase';
import type { Company } from '../jobTypes';

export interface LinkedInCompanyData {
  url: string;
  confidence: number;
  method: 'auto' | 'manual';
}

export interface CompanyWithLinkedInData extends Omit<Company, 'id' | 'created_at' | 'updated_at'> {
  linkedin_url?: string;
  linkedin_confidence?: number;
  linkedin_discovery_method?: 'auto' | 'manual' | 'none';
  linkedin_last_verified?: string;
}

/**
 * Check if a company exists with the given LinkedIn URL
 */
export async function findCompanyByLinkedIn(linkedinUrl: string): Promise<Company | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.COMPANIES)
      .select('*')
      .eq('linkedin_url', linkedinUrl)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error finding company by LinkedIn URL:', error);
    return null;
  }
}

/**
 * Update a company's LinkedIn data
 */
export async function updateCompanyLinkedIn(
  companyId: string,
  linkedinData: LinkedInCompanyData
): Promise<Company> {
  try {
    const updateData = {
      linkedin_url: linkedinData.url,
      linkedin_confidence: linkedinData.confidence,
      linkedin_discovery_method: linkedinData.method,
      linkedin_last_verified: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLES.COMPANIES)
      .update(updateData)
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating company LinkedIn data:', error);
    throw error;
  }
}

/**
 * Create a new company with LinkedIn data
 */
export async function createCompanyWithLinkedIn(
  companyData: CompanyWithLinkedInData
): Promise<Company> {
  try {
    const { data, error } = await supabase
      .from(TABLES.COMPANIES)
      .insert([{
        ...companyData,
        linkedin_last_verified: companyData.linkedin_url ? new Date().toISOString() : undefined
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating company with LinkedIn data:', error);
    throw error;
  }
}

/**
 * Get companies with their LinkedIn discovery status
 */
export async function getCompaniesWithLinkedInStatus(
  userId?: string
): Promise<Company[]> {
  try {
    let query = supabase
      .from(TABLES.COMPANIES)
      .select('*')
      .order('created_at', { ascending: false });

    // If userId is provided, we could filter by companies the user has applications for
    // This is optional - depends on your business logic
    if (userId) {
      query = query.or(`id.in.(${await getCompanyIdsForUser(userId)})`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting companies with LinkedIn status:', error);
    return [];
  }
}

/**
 * Helper function to get company IDs for a specific user
 */
async function getCompanyIdsForUser(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from(TABLES.APPLICATIONS)
      .select('company_id')
      .eq('user_id', userId)
      .not('company_id', 'is', null);

    if (error) throw error;
    
    const companyIds = [...new Set(data?.map(app => app.company_id).filter(Boolean))];
    return companyIds.join(',') || '';
  } catch (error) {
    console.error('Error getting company IDs for user:', error);
    return '';
  }
}

/**
 * Bulk update multiple companies with LinkedIn data
 */
export async function bulkUpdateCompaniesLinkedIn(
  updates: Array<{
    companyId: string;
    linkedinData: LinkedInCompanyData;
  }>
): Promise<Company[]> {
  try {
    const updatedCompanies: Company[] = [];
    
    // Process updates in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const batchPromises = batch.map(update =>
        updateCompanyLinkedIn(update.companyId, update.linkedinData)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          updatedCompanies.push(result.value);
        } else {
          console.error(`Failed to update company ${batch[index].companyId}:`, result.reason);
        }
      });
    }
    
    return updatedCompanies;
  } catch (error) {
    console.error('Error bulk updating companies LinkedIn data:', error);
    throw error;
  }
}

/**
 * Get LinkedIn discovery analytics for a user or globally
 */
export async function getLinkedInDiscoveryAnalytics(userId?: string) {
  try {
    let query = supabase
      .from(TABLES.LINKEDIN_SEARCH_METRICS)
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const metrics = data || [];
    
    return {
      totalSearches: metrics.length,
      successfulSearches: metrics.filter(m => (m.results_count || 0) > 0).length,
      averageResultsPerSearch: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + (m.results_count || 0), 0) / metrics.length 
        : 0,
      autoSelections: metrics.filter(m => m.user_action === 'selected').length,
      manualEntries: metrics.filter(m => m.user_action === 'manual_entry').length,
      skippedSearches: metrics.filter(m => m.user_action === 'skipped').length,
      averageConfidence: (() => {
        const withConfidence = metrics.filter(m => m.selection_confidence != null);
        return withConfidence.length > 0
          ? withConfidence.reduce((sum, m) => sum + (m.selection_confidence || 0), 0) / withConfidence.length
          : 0;
      })()
    };
  } catch (error) {
    console.error('Error getting LinkedIn discovery analytics:', error);
    return {
      totalSearches: 0,
      successfulSearches: 0,
      averageResultsPerSearch: 0,
      autoSelections: 0,
      manualEntries: 0,
      skippedSearches: 0,
      averageConfidence: 0
    };
  }
}

/**
 * Clean up expired LinkedIn search cache entries
 * This function can be called periodically to maintain database performance
 */
export async function cleanupExpiredLinkedInCache(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from(TABLES.LINKEDIN_SEARCH_CACHE)
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) throw error;
    
    const deletedCount = data?.length || 0;
    console.log(`Cleaned up ${deletedCount} expired LinkedIn cache entries`);
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired LinkedIn cache:', error);
    return 0;
  }
}

/**
 * Validate LinkedIn company URL format
 */
export function validateLinkedInUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9\-_]+\/?$/;
  return linkedinPattern.test(url.trim());
}

/**
 * Extract company vanity name from LinkedIn URL
 */
export function extractLinkedInVanityName(url: string): string {
  try {
    const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/i);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}