import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('Environment variables check:', {
  VITE_SUPABASE_URL: supabaseUrl ? 'SET' : 'NOT SET',
  VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'NOT SET',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
});

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

if (!supabaseUrl || !supabaseAnonKey) {
  if (isDevelopment) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
  } else {
    console.warn('Supabase environment variables not found. App will run in demo mode.');
  }
}

// Optimized Supabase client configuration for production
export const supabase = createClient(supabaseUrl || 'https://demo.supabase.co', supabaseAnonKey || 'demo-key', {
  // Performance optimizations
  auth: {
    // Reduce auth state change delays
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Faster token refresh
    flowType: 'pkce',
  },
  // Optimize realtime connections
  realtime: {
    params: {
      eventsPerSecond: 10, // Reduce event frequency for better performance
    },
  },
  // Production-optimized settings
  db: {
    schema: 'public',
  },
  // Better error handling and connection management
  global: {
    headers: {
      'Cache-Control': 'max-age=300', // 5 minute cache for API responses
      'Connection': 'keep-alive', // Keep connections alive
    },
    fetch: (url, options = {}) => {
      // Add timeout to fetch requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
        // Add keep-alive for better connection reuse
        keepalive: true,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  },
});

// Database table names
export const TABLES = {
  USERS: 'users',
  COMPANIES: 'companies',
  APPLICATIONS: 'applications',
  APPLICATION_TIMELINE: 'application_timeline',
  LINKEDIN_SEARCH_CACHE: 'linkedin_search_cache',
  LINKEDIN_SEARCH_METRICS: 'linkedin_search_metrics',
} as const; 