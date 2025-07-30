#!/usr/bin/env node

/**
 * Test script for email service functionality
 * Run with: node scripts/test-email.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Email service test function
async function testEmailService() {
  console.log('🧪 Testing Email Service');
  console.log('');

  // Check environment variables
  const emailProvider = process.env.VITE_EMAIL_PROVIDER || 'resend';
  const emailApiKey = process.env.VITE_EMAIL_API_KEY;
  const emailFrom = process.env.VITE_EMAIL_FROM || 'noreply@yourdomain.com';
  const emailFromName = process.env.VITE_EMAIL_FROM_NAME || 'Job Search Tracker';

  console.log('📧 Email Configuration:');
  console.log(`  Provider: ${emailProvider}`);
  console.log(`  API Key: ${emailApiKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`  From Email: ${emailFrom}`);
  console.log(`  From Name: ${emailFromName}`);
  console.log('');

  if (!emailApiKey) {
    console.log('❌ Email API key not configured');
    console.log('Please set VITE_EMAIL_API_KEY in your environment variables');
    console.log('');
      console.log('Example:');
  console.log('export VITE_EMAIL_API_KEY=re_QgJXbhxc_2RvdgzofYYTCkn68yq96bC7X');
    console.log('');
    return;
  }

  // Test email sending (if API key is available)
  console.log('🚀 Testing email sending...');
  
  try {
    const testEmail = process.env.TEST_EMAIL || 'dan.northington@gmail.com';
    
    // Simple email test using fetch
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${emailFromName} <${emailFrom}>`,
        to: [testEmail],
        subject: '🧪 Email Service Test',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Email Service Test</title>
          </head>
          <body>
            <h1>🧪 Email Service Test</h1>
            <p>This is a test email to verify the email service is working correctly.</p>
            <p><strong>Provider:</strong> ${emailProvider}</p>
            <p><strong>From:</strong> ${emailFromName} &lt;${emailFrom}&gt;</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              This is an automated test email. Please ignore if received unexpectedly.
            </p>
          </body>
          </html>
        `,
        text: `
🧪 Email Service Test

This is a test email to verify the email service is working correctly.

Provider: ${emailProvider}
From: ${emailFromName} <${emailFrom}>
Timestamp: ${new Date().toISOString()}

This is an automated test email. Please ignore if received unexpectedly.
        `.trim(),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email sent successfully!');
      console.log(`  Message ID: ${result.id}`);
      console.log(`  To: ${testEmail}`);
  console.log(`  From: ${emailFromName} <${emailFrom}>`);
      console.log('');
      console.log('📧 Check your email inbox for the test message');
    } else {
      const error = await response.text();
      console.log('❌ Email sending failed');
      console.log(`  Status: ${response.status}`);
      console.log(`  Error: ${error}`);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('  1. Check your API key is correct');
      console.log('  2. Verify your domain is verified in Resend dashboard');
      console.log('  3. Check the Resend dashboard for detailed error logs');
    }
  } catch (error) {
    console.log('❌ Email test failed');
    console.log(`  Error: ${error.message}`);
    console.log('');
    console.log('🔧 Possible issues:');
    console.log('  1. Network connectivity');
    console.log('  2. Invalid API key');
    console.log('  3. Rate limiting');
  }

  console.log('');
  console.log('📋 Next Steps:');
  console.log('  1. If email sent successfully, the service is working');
  console.log('  2. Test the admin panel to add beta invites with email notifications');
  console.log('  3. Check the email template customization in src/utils/emailService.ts');
  console.log('');
}

// Supabase connection test
async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase Connection');
  console.log('');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase environment variables not configured');
    console.log('Please set:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL');
    console.log('  SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
    console.log('');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by querying beta_invites table
    const { data, error } = await supabase
      .from('beta_invites')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Supabase connection failed');
      console.log(`  Error: ${error.message}`);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('  1. Check your Supabase URL and key');
      console.log('  2. Verify the beta_invites table exists');
      console.log('  3. Check your database permissions');
    } else {
      console.log('✅ Supabase connection successful');
      console.log('  Database is accessible');
      console.log('  beta_invites table is available');
    }
  } catch (error) {
    console.log('❌ Supabase test failed');
    console.log(`  Error: ${error.message}`);
  }

  console.log('');
}

// Main test function
async function runTests() {
  console.log('🚀 Email Service Test Suite');
  console.log('============================');
  console.log('');

  await testSupabaseConnection();
  console.log('');
  await testEmailService();
  console.log('');
  
  console.log('✨ Test suite completed');
  console.log('');
  console.log('📚 Documentation:');
  console.log('  - Email setup guide: EMAIL_SETUP_GUIDE.md');
  console.log('  - Admin panel: Log in as admin and go to Beta Invites');
  console.log('  - Email service: src/utils/emailService.ts');
}

// Run tests
runTests().catch(console.error); 