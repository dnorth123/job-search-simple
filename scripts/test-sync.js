#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BETA_LIST_FILE = join(__dirname, '..', 'beta-list.txt');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

// Parse email addresses from file content (same logic as sync script)
function parseEmails(content) {
  const lines = content.split('\n');
  const emails = new Set();
  const invalidEmails = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(line)) {
      invalidEmails.push({ line: i + 1, email: line });
      continue;
    }

    // Convert to lowercase for consistency
    const normalizedEmail = line.toLowerCase();
    emails.add(normalizedEmail);
  }

  return { emails: Array.from(emails), invalidEmails };
}

// Test the parsing functionality
async function testParsing() {
  try {
    log('🧪 Testing Beta List Parsing', 'bright');
    log('');

    // Read the beta list file
    logInfo('Reading beta-list.txt...');
    const content = await readFile(BETA_LIST_FILE, 'utf8');
    
    // Parse emails
    const { emails, invalidEmails } = parseEmails(content);
    
    // Display results
    logSuccess(`Found ${emails.length} valid email addresses`);
    
    if (emails.length > 0) {
      logInfo('Valid emails:');
      emails.forEach((email, index) => {
        log(`  ${index + 1}. ${email}`, 'cyan');
      });
    }
    
    if (invalidEmails.length > 0) {
      logWarning(`Found ${invalidEmails.length} invalid email formats:`);
      invalidEmails.forEach(({ line, email }) => {
        log(`  Line ${line}: ${email}`, 'yellow');
      });
    }
    
    // Test environment variables
    log('');
    logInfo('Testing environment variables...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl) {
      logSuccess('NEXT_PUBLIC_SUPABASE_URL is set');
    } else {
      logError('NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    
    if (serviceRoleKey) {
      logSuccess('SUPABASE_SERVICE_ROLE_KEY is set');
    } else {
      logError('SUPABASE_SERVICE_ROLE_KEY is not set');
    }
    
    // Summary
    log('');
    log('📊 Test Summary', 'bright');
    log(`Total valid emails: ${emails.length}`);
    log(`Invalid email formats: ${invalidEmails.length}`);
    log(`Environment configured: ${supabaseUrl && serviceRoleKey ? 'Yes' : 'No'}`);
    
    if (emails.length === 0) {
      logWarning('No valid emails found in beta-list.txt');
    }
    
    if (!supabaseUrl || !serviceRoleKey) {
      logError('Environment variables not configured - sync will fail');
      logInfo('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run the sync');
    } else {
      logSuccess('Ready to run sync script');
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      logError(`Beta list file not found: ${BETA_LIST_FILE}`);
      logInfo('Create beta-list.txt in the project root with email addresses');
    } else {
      logError(`Test failed: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testParsing();
} 