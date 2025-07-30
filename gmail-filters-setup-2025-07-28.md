
🎯 Complete Gmail Filter Setup
==============================

📋 Total emails to set up: 1

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

1. Filter for northingtongroup+beta-forward@gmail.com:
   - From: onboarding@resend.dev
   - Subject: [BETA INVITE] Forward to: northingtongroup+beta-forward@gmail.com
   - Actions:
     ✅ Forward it to: northingtongroup+beta-forward@gmail.com
     ✅ Apply the label: Beta Invites
     ✅ Never send it to Spam


Step 4: Test Your Setup
1. Add a test beta invite through your admin panel
2. Use one of these test emails: northingtongroup+beta-forward@gmail.com
3. Check if the email was forwarded correctly

🎉 Setup Complete!
