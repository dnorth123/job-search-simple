import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

if (!supabaseUrl || !supabaseAnonKey) {
  if (isDevelopment) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
  } else {
    console.warn('Supabase environment variables not found. App will run in demo mode.');
  }
}

export const supabase = createClient(supabaseUrl || 'https://demo.supabase.co', supabaseAnonKey || 'demo-key');

// Database table names
export const TABLES = {
  USERS: 'users',
  COMPANIES: 'companies',
  APPLICATIONS: 'applications',
  APPLICATION_TIMELINE: 'application_timeline',
} as const; 