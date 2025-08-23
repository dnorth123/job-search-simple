import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: boolean;
    braveApi: boolean;
    environment: boolean;
    edgeRuntime: boolean;
  };
  metrics: {
    responseTime: number;
    memoryUsage?: number;
    uptime: number;
  };
  version: string;
  environment: string;
  errors?: string[];
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const checks = {
      database: false,
      braveApi: false,
      environment: false,
      edgeRuntime: true // We're running, so this is true
    };

    const errors: string[] = [];

    // Check environment variables
    try {
      const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'BRAVE_SEARCH_API_KEY'];
      const missingVars = requiredEnvVars.filter(varName => !Deno.env.get(varName));
      
      if (missingVars.length === 0) {
        checks.environment = true;
      } else {
        errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
      }
    } catch (error) {
      errors.push(`Environment check failed: ${error.message}`);
    }

    // Check database connectivity
    try {
      const { data, error } = await supabaseClient
        .from('linkedin_search_cache')
        .select('count')
        .limit(1);
      
      if (!error) {
        checks.database = true;
      } else {
        errors.push(`Database check failed: ${error.message}`);
      }
    } catch (error) {
      errors.push(`Database connection failed: ${error.message}`);
    }

    // Check Brave API
    try {
      const braveApiKey = Deno.env.get('BRAVE_SEARCH_API_KEY');
      if (braveApiKey) {
        const response = await fetch('https://api.search.brave.com/res/v1/web/search?q=health&count=1', {
          headers: {
            'X-Subscription-Token': braveApiKey,
            'Accept': 'application/json',
            'User-Agent': 'LinkedIn-Discovery-HealthCheck/1.0'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (response.ok) {
          checks.braveApi = true;
        } else if (response.status === 429) {
          errors.push('Brave API rate limit exceeded');
        } else {
          errors.push(`Brave API returned status: ${response.status}`);
        }
      } else {
        errors.push('Brave API key not configured');
      }
    } catch (error) {
      errors.push(`Brave API check failed: ${error.message}`);
    }

    const responseTime = Date.now() - startTime;

    // Determine overall health status
    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.5) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    // Get memory usage if available
    let memoryUsage: number | undefined;
    try {
      if (Deno.memoryUsage) {
        const memory = Deno.memoryUsage();
        memoryUsage = memory.rss / 1024 / 1024; // Convert to MB
      }
    } catch {
      // Memory usage not available
    }

    const healthResult: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      checks,
      metrics: {
        responseTime,
        memoryUsage,
        uptime: Date.now() // Simple uptime measurement
      },
      version: '1.0.0',
      environment: Deno.env.get('DENO_DEPLOYMENT_ID') ? 'production' : 'development',
      errors: errors.length > 0 ? errors : undefined
    };

    // Log health check result in development
    if (Deno.env.get('DENO_DEPLOYMENT_ID') === undefined) {
      console.log('Health Check Result:', JSON.stringify(healthResult, null, 2));
    }

    return new Response(
      JSON.stringify(healthResult),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503
      }
    );

  } catch (error) {
    console.error('Health check error:', error);

    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: false,
        braveApi: false,
        environment: false,
        edgeRuntime: true
      },
      metrics: {
        responseTime: Date.now() - startTime,
        uptime: 0
      },
      version: '1.0.0',
      environment: Deno.env.get('DENO_DEPLOYMENT_ID') ? 'production' : 'development',
      errors: [`Health check failed: ${error.message}`]
    };

    return new Response(
      JSON.stringify(errorResult),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 503
      }
    );
  }
});