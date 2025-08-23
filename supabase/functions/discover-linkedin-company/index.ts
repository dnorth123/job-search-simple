import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface LinkedInResult {
  url: string;                // Full LinkedIn URL
  companyName: string;        // Extracted company name
  vanityName: string;         // URL slug (e.g., "microsoft")
  description: string;        // First 200 chars of description
  confidence: number;         // 0.0 to 1.0 confidence score
}

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

interface BraveSearchResponse {
  web: {
    results: BraveSearchResult[];
  };
}

function extractVanityName(url: string): string {
  try {
    const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/i);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

function extractCompanyName(title: string, description: string): string {
  // Try to extract company name from title (usually comes before " | LinkedIn")
  const titleMatch = title.match(/^([^|]+)(?:\s*\|\s*LinkedIn)?/);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Fallback to first words of description
  const descWords = description.split(' ').slice(0, 3).join(' ');
  return descWords.length > 0 ? descWords : 'Unknown Company';
}

function calculateConfidence(
  result: BraveSearchResult, 
  searchTerm: string, 
  isFirstResult: boolean
): number {
  let confidence = 0.6; // Base confidence for valid LinkedIn company URL
  
  const companyName = extractCompanyName(result.title, result.description);
  const vanityName = extractVanityName(result.url);
  
  // +0.25 if company name matches search term (case insensitive)
  if (companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchTerm.toLowerCase().includes(companyName.toLowerCase().split(' ')[0])) {
    confidence += 0.25;
  }
  
  // +0.10 if first result
  if (isFirstResult) {
    confidence += 0.10;
  }
  
  // +0.05 if URL contains search term as slug
  if (vanityName.toLowerCase().includes(searchTerm.toLowerCase().replace(/\s+/g, ''))) {
    confidence += 0.05;
  }
  
  // Cap at 0.95 maximum
  return Math.min(confidence, 0.95);
}

async function searchBraveAPI(companyName: string, apiKey: string): Promise<LinkedInResult[]> {
  const searchQuery = `site:linkedin.com/company ${companyName}`;
  const url = 'https://api.search.brave.com/res/v1/web/search';
  
  const response = await fetch(url, {
    headers: {
      'X-Subscription-Token': apiKey,
      'Accept': 'application/json',
    },
    method: 'GET',
    body: null,
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(`Brave API error: ${response.status} ${response.statusText}`);
  }

  const data: BraveSearchResponse = await response.json();
  
  if (!data.web || !data.web.results) {
    return [];
  }

  const results: LinkedInResult[] = [];
  
  for (let i = 0; i < Math.min(data.web.results.length, 3); i++) {
    const result = data.web.results[i];
    
    // Only process LinkedIn company URLs
    if (!result.url.includes('linkedin.com/company/')) {
      continue;
    }
    
    const extractedCompanyName = extractCompanyName(result.title, result.description);
    const vanityName = extractVanityName(result.url);
    const confidence = calculateConfidence(result, companyName, i === 0);
    
    results.push({
      url: result.url,
      companyName: extractedCompanyName,
      vanityName,
      description: result.description.substring(0, 200),
      confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
    });
  }
  
  return results.sort((a, b) => b.confidence - a.confidence);
}

async function getCachedResults(
  supabase: any,
  searchTerm: string
): Promise<LinkedInResult[] | null> {
  try {
    const { data, error } = await supabase
      .from('linkedin_search_cache')
      .select('results, expires_at')
      .eq('search_term', searchTerm.toLowerCase().trim())
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    // Update search count
    await supabase
      .from('linkedin_search_cache')
      .update({ search_count: supabase.sql`search_count + 1` })
      .eq('search_term', searchTerm.toLowerCase().trim());

    return data.results;
  } catch {
    return null;
  }
}

async function setCachedResults(
  supabase: any,
  searchTerm: string,
  results: LinkedInResult[]
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Cache for 7 days

    await supabase
      .from('linkedin_search_cache')
      .upsert({
        search_term: searchTerm.toLowerCase().trim(),
        results,
        expires_at: expiresAt.toISOString(),
        search_count: 1
      });
  } catch (error) {
    console.error('Failed to cache results:', error);
    // Don't throw - caching failure shouldn't break the main functionality
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const braveApiKey = Deno.env.get('BRAVE_SEARCH_API_KEY');

    if (!braveApiKey) {
      return new Response(
        JSON.stringify({ error: 'Brave Search API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { companyName } = await req.json();

    // Validate input
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid company name. Must be at least 2 characters.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const trimmedCompanyName = companyName.trim();

    // Server-side rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `rate_limit:${clientIP}`;
    
    // Check if this is a health check request
    const requestBody = await req.clone().json();
    const isHealthCheck = requestBody?.healthCheck === true;
    
    if (!isHealthCheck) {
      try {
        // Check current rate limit for this IP
        const { data: rateLimitData } = await supabase
          .from('linkedin_search_cache')
          .select('search_count, created_at')
          .eq('search_term', rateLimitKey)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
          .single();

        if (rateLimitData && rateLimitData.search_count >= 20) { // 20 requests per hour per IP
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded. Maximum 20 requests per hour per IP.',
              retryAfter: 3600 // 1 hour in seconds
            }),
            { 
              status: 429, 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'Retry-After': '3600'
              } 
            }
          );
        }

        // Update or create rate limit entry
        await supabase
          .from('linkedin_search_cache')
          .upsert({
            search_term: rateLimitKey,
            search_count: (rateLimitData?.search_count || 0) + 1,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Expire in 1 hour
            results: [] // Empty results for rate limit entries
          }, { 
            onConflict: 'search_term' 
          });
      } catch (rateLimitError) {
        // Log but don't fail the request if rate limiting fails
        console.warn('Rate limiting check failed:', rateLimitError);
      }
    }

    // Check cache first
    const cachedResults = await getCachedResults(supabase, trimmedCompanyName);
    if (cachedResults) {
      return new Response(
        JSON.stringify({ 
          results: cachedResults,
          cached: true,
          searchTerm: trimmedCompanyName
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Search using Brave API
    const results = await searchBraveAPI(trimmedCompanyName, braveApiKey);

    // Cache the results for future use
    await setCachedResults(supabase, trimmedCompanyName, results);

    // Track analytics
    try {
      const authHeader = req.headers.get('Authorization');
      let userId = null;
      
      if (authHeader) {
        const jwt = authHeader.replace('Bearer ', '');
        const { data: user } = await supabase.auth.getUser(jwt);
        userId = user.user?.id || null;
      }

      await supabase
        .from('linkedin_search_metrics')
        .insert({
          user_id: userId,
          search_term: trimmedCompanyName,
          results_count: results.length,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to track analytics:', error);
      // Don't fail the request if analytics tracking fails
    }

    return new Response(
      JSON.stringify({ 
        results,
        cached: false,
        searchTerm: trimmedCompanyName
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('LinkedIn discovery error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        searchTerm: '' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})