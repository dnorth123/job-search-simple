# Email Server Setup Guide

This guide will help you set up the email server to fix the CORS issue and enable email sending from your admin panel.

## 🚨 **Problem Solved**

The CORS error you encountered happens because browsers don't allow direct API calls to third-party services (like Resend) from different origins. This is a security feature.

**Solution**: We've created a server-side API that handles email sending, avoiding CORS issues entirely.

## 📋 **Setup Steps**

### **Step 1: Install Server Dependencies**

```bash
npm run install-server
```

This will install Express and CORS packages needed for the email server.

### **Step 2: Start the Email Server**

```bash
npm run email-server
```

You should see:
```
Email API server running on port 3001
Health check: http://localhost:3001/api/health
Email endpoint: http://localhost:3001/api/send-email
```

### **Step 3: Start Development Environment**

In a new terminal, start your React app:

```bash
npm run dev
```

### **Step 4: Or Use Combined Command**

For convenience, you can start both servers at once:

```bash
npm run dev:email
```

This runs both the React dev server and email server concurrently.

## 🔧 **How It Works**

### **Before (CORS Error)**
```
Frontend → Direct API call to Resend → ❌ CORS blocked
```

### **After (Working)**
```
Frontend → Your Email Server → Resend API → ✅ Success
```

### **Architecture**
1. **Frontend** sends email request to `/api/send-email`
2. **Vite proxy** forwards request to `http://localhost:3001`
3. **Email server** makes API call to Resend
4. **Response** flows back through the same path

## 🧪 **Testing**

### **Test Email Server**
```bash
# Test the email server directly
curl -X POST http://localhost:3001/api/health
```

### **Test Email Sending**
1. Start both servers (`npm run dev:email`)
2. Go to your admin panel
3. Add a beta invite with email notifications
4. Check the email server console for logs

## 📊 **Expected Results**

### **Email Server Console**
```
Email request received: {
  provider: 'resend',
  fromEmail: 'onboarding@resend.dev',
  toEmail: 'test@example.com',
  subject: "You're invited to join our beta! 🚀"
}
Email sent successfully: abc123...
```

### **Admin Panel**
- ✅ Green success message
- ✅ Email status shows "Sent successfully"
- ✅ Recipients receive professional beta invite emails

## 🔍 **Troubleshooting**

### **Port Already in Use**
If port 3001 is busy, change it in `server/email-api.js`:
```javascript
const PORT = process.env.PORT || 3002; // Change to 3002
```

### **Server Won't Start**
Check if dependencies are installed:
```bash
npm run install-server
```

### **CORS Still Happening**
Make sure the email server is running on port 3001 and the Vite proxy is configured correctly.

### **Email Not Sending**
Check the email server console for error messages. Common issues:
- Invalid API key
- Wrong email address format
- Resend account limitations

## 📁 **Files Created/Modified**

### **New Files**
- `server/email-api.js` - Email server
- `scripts/install-server-deps.js` - Installation script
- `EMAIL_SERVER_SETUP.md` - This guide

### **Modified Files**
- `src/utils/emailService.ts` - Updated to use server API
- `vite.config.ts` - Added proxy configuration
- `package.json` - Added server dependencies and scripts

## 🚀 **Production Deployment**

For production, you'll need to:

1. **Deploy the email server** to your hosting platform
2. **Update the frontend** to use the production email server URL
3. **Configure environment variables** on the server
4. **Set up proper CORS** for your production domain

## 📧 **Email Templates**

The email templates you created are still used! The server will use the same beautiful HTML and text templates from your `email-templates/` directory.

## 🎯 **Next Steps**

1. **Install server dependencies**: `npm run install-server`
2. **Start email server**: `npm run email-server`
3. **Test in admin panel**: Add beta invites with email notifications
4. **Customize templates**: Edit files in `email-templates/` directory

The CORS issue will be completely resolved, and your email system will work perfectly! 