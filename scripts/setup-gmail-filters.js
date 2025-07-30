#!/usr/bin/env node

import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎯 Gmail Filter Setup for Beta Invites');
console.log('=====================================\n');

console.log('This script will help you create Gmail filters for auto-forwarding beta invites.\n');

// Function to generate filter instructions
function generateFilterInstructions(email) {
  return `
📧 Filter for: ${email}
=====================

Step 1: Create Gmail Filter
1. Go to Gmail → Settings → Filters and Blocked Addresses
2. Click "Create a new filter"
3. Enter these criteria:
   - From: onboarding@resend.dev
   - Subject: [BETA INVITE] Forward to: ${email}
4. Click "Next Step"

Step 2: Set Actions
Check these boxes:
   ✅ Forward it to: ${email}
   ✅ Never send it to Spam
   ✅ Apply the label: Beta Invites
   ✅ Mark it as read (optional)

Step 3: Create Filter
Click "Create filter"

✅ Filter created for ${email}
`;
}

// Function to generate all filters
function generateAllFilters(emails) {
  let output = `
🎯 Complete Gmail Filter Setup
==============================

📋 Total emails to set up: ${emails.length}

Step 1: Create Base Label
1. Go to Gmail → Settings → Labels
2. Click "Create new label"
3. Name it: Beta Invites
4. Click "Create"

Step 2: Create Base Filter
1. Go to "Filters and Blocked Addresses"
2. Click "Create a new filter"
3. Enter:
   - From: onboarding@resend.dev
   - Subject: [BETA INVITE]
4. Click "Next Step"
5. Check:
   ✅ Apply the label: Beta Invites
   ✅ Never send it to Spam
6. Click "Create filter"

Step 3: Create Individual Forwarding Filters
`;

  emails.forEach((email, index) => {
    output += `
${index + 1}. Filter for ${email}:
   - From: onboarding@resend.dev
   - Subject: [BETA INVITE] Forward to: ${email}
   - Actions:
     ✅ Forward it to: ${email}
     ✅ Apply the label: Beta Invites
     ✅ Never send it to Spam
`;
  });

  output += `

Step 4: Test Your Setup
1. Add a test beta invite through your admin panel
2. Use one of these test emails: ${emails.join(', ')}
3. Check if the email was forwarded correctly

🎉 Setup Complete!
`;

  return output;
}

// Main function
async function main() {
  console.log('Enter the email addresses you want to set up forwarding for:');
  console.log('(Press Enter twice when done)\n');

  const emails = [];
  
  while (true) {
    const email = await new Promise(resolve => {
      rl.question(`Email ${emails.length + 1}: `, resolve);
    });

    if (email.trim() === '') {
      if (emails.length === 0) {
        console.log('\n❌ No emails entered. Please try again.\n');
        continue;
      }
      break;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.log('❌ Invalid email format. Please enter a valid email address.\n');
      continue;
    }

    emails.push(email.trim());
  }

  rl.close();

  console.log('\n📧 Emails to set up:');
  emails.forEach((email, index) => {
    console.log(`${index + 1}. ${email}`);
  });

  console.log('\n🎯 Generating filter instructions...\n');

  // Generate individual instructions
  emails.forEach(email => {
    console.log(generateFilterInstructions(email));
  });

  // Generate complete setup guide
  const completeSetup = generateAllFilters(emails);
  
  // Save to file
  const filename = `gmail-filters-setup-${new Date().toISOString().split('T')[0]}.md`;
  fs.writeFileSync(filename, completeSetup);
  
  console.log(`\n📄 Complete setup guide saved to: ${filename}`);
  console.log('\n🚀 Next Steps:');
  console.log('1. Follow the instructions in the generated file');
  console.log('2. Test with one email first');
  console.log('3. Add more filters as needed');
  console.log('\n✨ Happy forwarding!');
}

main().catch(console.error); 