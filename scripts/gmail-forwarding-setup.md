# Gmail Auto-Forwarding Setup for Beta Invites

## 🎯 **Overview**
This guide helps you set up automatic forwarding of beta invite emails from your verified email to the intended recipients.

## 📧 **Current Email Format**
Your beta invites are sent to: `dan.northington@gmail.com`
Subject format: `[BETA INVITE] Forward to: recipient@example.com - You're invited to join our beta! 🚀`

## 🔧 **Setup Options**

### **Option 1: Manual Gmail Filters (Recommended)**

#### **Step 1: Create Base Filter**
1. Go to Gmail → Settings → Filters and Blocked Addresses
2. Click "Create a new filter"
3. Set criteria:
   - **From**: `onboarding@resend.dev`
   - **Subject**: `[BETA INVITE]`
4. Click "Create filter"

#### **Step 2: Set Up Individual Forwarding Rules**
For each person you want to auto-forward to:

1. **Create a new filter** with these criteria:
   - **From**: `onboarding@resend.dev`
   - **Subject**: `[BETA INVITE] Forward to: their-email@example.com`
   - **Has the words**: `Forward to: their-email@example.com`

2. **Set actions**:
   - ✅ **Forward it to**: `their-email@example.com`
   - ✅ **Never send it to Spam**
   - ✅ **Mark it as read** (optional)
   - ✅ **Apply the label**: `Beta Invites` (create this label first)

3. **Click "Create filter"**

#### **Example Filters to Create**

```
Filter 1:
- From: onboarding@resend.dev
- Subject: [BETA INVITE] Forward to: friend1@example.com
- Action: Forward to friend1@example.com

Filter 2:
- From: onboarding@resend.dev
- Subject: [BETA INVITE] Forward to: friend2@example.com
- Action: Forward to friend2@example.com
```

### **Option 2: Gmail Labels for Organization**

1. **Create a label**: `Beta Invites`
2. **Create a filter**:
   - **From**: `onboarding@resend.dev`
   - **Subject**: `[BETA INVITE]`
   - **Actions**:
     - ✅ **Apply the label**: `Beta Invites`
     - ✅ **Never send it to Spam`

### **Option 3: Advanced Filter with Multiple Recipients**

If you have a small, fixed list of recipients:

1. **Create one filter**:
   - **From**: `onboarding@resend.dev`
   - **Subject**: `[BETA INVITE]`
   - **Has the words**: `Forward to:`

2. **Set actions**:
   - ✅ **Forward it to**: `your-forwarding-email@example.com`
   - ✅ **Apply the label**: `Beta Invites`

3. **Set up forwarding from the forwarding email** to distribute to your list

## 🚀 **Quick Setup Script**

### **Step 1: Create Gmail Labels**
1. In Gmail, click the gear icon → Settings
2. Go to "Labels" tab
3. Click "Create new label"
4. Name it: `Beta Invites`
5. Click "Create"

### **Step 2: Create Base Filter**
1. Go to "Filters and Blocked Addresses"
2. Click "Create a new filter"
3. Enter:
   - **From**: `onboarding@resend.dev`
   - **Subject**: `[BETA INVITE]`
4. Click "Next Step"
5. Check:
   - ✅ **Apply the label**: `Beta Invites`
   - ✅ **Never send it to Spam`
6. Click "Create filter"

### **Step 3: Add Individual Forwarding Rules**

For each person you want to auto-forward to:

1. **Create new filter**
2. **Criteria**:
   - **From**: `onboarding@resend.dev`
   - **Subject**: `[BETA INVITE] Forward to: their-email@example.com`
3. **Actions**:
   - ✅ **Forward it to**: `their-email@example.com`
   - ✅ **Apply the label**: `Beta Invites`
4. **Click "Create filter"**

## 📋 **Example: Setting Up for 3 People**

### **Person 1: John**
```
Filter Criteria:
- From: onboarding@resend.dev
- Subject: [BETA INVITE] Forward to: john@example.com

Actions:
- Forward to: john@example.com
- Apply label: Beta Invites
```

### **Person 2: Sarah**
```
Filter Criteria:
- From: onboarding@resend.dev
- Subject: [BETA INVITE] Forward to: sarah@example.com

Actions:
- Forward to: sarah@example.com
- Apply label: Beta Invites
```

### **Person 3: Mike**
```
Filter Criteria:
- From: onboarding@resend.dev
- Subject: [BETA INVITE] Forward to: mike@example.com

Actions:
- Forward to: mike@example.com
- Apply label: Beta Invites
```

## 🔍 **Testing Your Filters**

1. **Add a test beta invite** through your admin panel
2. **Use a test email** like `test@example.com`
3. **Check your Gmail** for the forwarded email
4. **Verify the forwarding** worked correctly

## ⚙️ **Advanced: Gmail API Automation**

For more advanced automation, you could use Gmail's API to:
- Parse email content automatically
- Extract recipient from email body
- Forward programmatically

This would require setting up a Gmail API integration, but it's more complex.

## 📝 **Troubleshooting**

### **Filter Not Working?**
1. **Check filter criteria** - make sure spelling is exact
2. **Test with a simple filter** first
3. **Check Gmail's filter order** - filters are processed in order
4. **Verify forwarding is enabled** in Gmail settings

### **Emails Going to Spam?**
1. **Add "Never send it to Spam"** action to your filters
2. **Mark emails as "Not Spam"** if they end up there
3. **Add sender to contacts** if needed

### **Forwarding Not Working?**
1. **Check Gmail forwarding settings** in Settings → Forwarding and POP/IMAP
2. **Verify recipient email** is correct
3. **Test with a simple email** first

## 🎯 **Recommended Setup**

1. **Create the base filter** to organize emails
2. **Add individual forwarding rules** for each person
3. **Test with one person** first
4. **Add more people** as needed

This approach gives you:
- ✅ **Automatic forwarding** to intended recipients
- ✅ **Organized inbox** with labels
- ✅ **Easy to manage** individual rules
- ✅ **Reliable delivery** with spam protection 