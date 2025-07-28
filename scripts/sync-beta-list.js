#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BETA_LIST_FILE = join(__dirname, '..', 'beta-list.txt');
const BATCH_SIZE = 50; // Process emails in batches for better performance

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logProgress(message) {
  log(`🔄 ${message}`, 'cyan');
}

// Validate environment variables
function validateEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return { supabaseUrl, serviceRoleKey };
}

// Parse email addresses from file content
function parseEmails(content) {
  const lines = content.split('\n');
  const emails = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(line)) {
      logWarning(`Invalid email format on line ${i + 1}: ${line}`);
      continue;
    }

    // Convert to lowercase for consistency
    const normalizedEmail = line.toLowerCase();
    emails.add(normalizedEmail);
  }

  return Array.from(emails);
}

// Read and parse the beta list file
async function readBetaListFile() {
  try {
    logProgress('Reading beta-list.txt...');
    const content = await readFile(BETA_LIST_FILE, 'utf8');
    const emails = parseEmails(content);
    
    logSuccess(`Found ${emails.length} valid email addresses`);
    return emails;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Beta list file not found: ${BETA_LIST_FILE}`);
    }
    throw new Error(`Failed to read beta list file: ${error.message}`);
  }
}

// Check for existing emails in the database
async function getExistingEmails(supabase, emails) {
  logProgress('Checking for existing emails in database...');
  
  const existingEmails = new Set();
  
  // Process in batches to avoid query size limits
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    
    const { data, error } = await supabase
      .from('beta_invites')
      .select('email')
      .in('email', batch);

    if (error) {
      throw new Error(`Failed to check existing emails: ${error.message}`);
    }

    data.forEach(row => existingEmails.add(row.email));
  }

  logInfo(`Found ${existingEmails.size} existing emails in database`);
  return existingEmails;
}

// Insert new emails into the database
async function insertNewEmails(supabase, emails, existingEmails) {
  const newEmails = emails.filter(email => !existingEmails.has(email));
  
  if (newEmails.length === 0) {
    logSuccess('No new emails to insert - all emails already exist in database');
    return 0;
  }

  logProgress(`Inserting ${newEmails.length} new emails...`);
  
  let insertedCount = 0;
  let errorCount = 0;

  // Process in batches
  for (let i = 0; i < newEmails.length; i += BATCH_SIZE) {
    const batch = newEmails.slice(i, i + BATCH_SIZE);
    
    const { data, error } = await supabase
      .from('beta_invites')
      .insert(
        batch.map(email => ({
          email,
          created_at: new Date().toISOString()
        }))
      )
      .select('email');

    if (error) {
      logError(`Batch insert failed: ${error.message}`);
      errorCount += batch.length;
    } else {
      insertedCount += data.length;
      logProgress(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(newEmails.length / BATCH_SIZE)}`);
    }
  }

  return { insertedCount, errorCount };
}

// Main sync function
async function syncBetaList() {
  try {
    log('🚀 Starting Beta List Sync', 'bright');
    log('');

    // Validate environment
    const { supabaseUrl, serviceRoleKey } = validateEnvironment();
    logSuccess('Environment variables validated');

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    logSuccess('Supabase client initialized');

    // Read and parse emails
    const emails = await readBetaListFile();
    
    if (emails.length === 0) {
      logWarning('No valid emails found in beta-list.txt');
      return;
    }

    // Check for existing emails
    const existingEmails = await getExistingEmails(supabase, emails);

    // Insert new emails
    const { insertedCount, errorCount } = await insertNewEmails(supabase, emails, existingEmails);

    // Summary
    log('');
    log('📊 Sync Summary', 'bright');
    log(`Total emails in file: ${emails.length}`);
    log(`Existing emails: ${existingEmails.size}`);
    log(`New emails inserted: ${insertedCount}`);
    
    if (errorCount > 0) {
      logError(`Failed to insert: ${errorCount} emails`);
    }

    if (insertedCount > 0) {
      logSuccess(`Successfully synced ${insertedCount} new beta invites`);
    } else {
      logSuccess('No new emails to sync');
    }

  } catch (error) {
    logError(`Sync failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the sync
if (import.meta.url === `file://${process.argv[1]}`) {
  syncBetaList();
} 