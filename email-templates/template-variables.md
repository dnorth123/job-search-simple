w# Template Variables Reference

This document lists all available template variables that you can use in your email templates. These variables will be automatically replaced with actual data when emails are sent.

## 📧 **Recipient Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{recipientEmail}}` | The invitee's email address | `john@example.com` |
| `{{recipientName}}` | The invitee's name (if available) | `John Doe` |
| `{{recipientFirstName}}` | The invitee's first name | `John` |

## 🎯 **Invite Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{inviteId}}` | Unique invite identifier | `abc123-def456-ghi789` |
| `{{invitedBy}}` | Admin who sent the invite | `dan.northington@gmail.com` |
| `{{invitedByName}}` | Admin's display name | `Dan Northington` |
| `{{expiresAt}}` | Invite expiration date | `2024-01-15T23:59:59Z` |
| `{{expiresAtFormatted}}` | Formatted expiration date | `January 15, 2024` |
| `{{createdAt}}` | When the invite was created | `2024-01-01T10:00:00Z` |
| `{{createdAtFormatted}}` | Formatted creation date | `January 1, 2024` |

## 🔗 **URL Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{signupUrl}}` | Direct signup link with invite | `https://yourapp.com/signup?invite=abc123` |
| `{{appUrl}}` | Your app's main URL | `https://yourapp.com` |
| `{{dashboardUrl}}` | User dashboard URL | `https://yourapp.com/dashboard` |
| `{{unsubscribeUrl}}` | Unsubscribe link | `https://yourapp.com/unsubscribe?email=john@example.com` |

## 🏢 **App Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{appName}}` | Your app name | `Job Search Tracker` |
| `{{appDescription}}` | App description | `A powerful tool for managing job applications` |
| `{{appLogo}}` | App logo URL | `https://yourapp.com/logo.png` |
| `{{appVersion}}` | Current app version | `1.0.0` |

## 📅 **Date & Time Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{currentDate}}` | Current date | `2024-01-01` |
| `{{currentDateFormatted}}` | Formatted current date | `January 1, 2024` |
| `{{currentTime}}` | Current time | `10:30 AM` |
| `{{timezone}}` | User's timezone | `America/New_York` |

## 🎨 **Styling Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{primaryColor}}` | Primary brand color | `#3B82F6` |
| `{{secondaryColor}}` | Secondary brand color | `#1F2937` |
| `{{accentColor}}` | Accent color | `#10B981` |
| `{{backgroundColor}}` | Background color | `#F8FAFC` |
| `{{textColor}}` | Text color | `#1F2937` |

## 📊 **Analytics Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{utmSource}}` | UTM source parameter | `email` |
| `{{utmMedium}}` | UTM medium parameter | `beta-invite` |
| `{{utmCampaign}}` | UTM campaign parameter | `beta-launch` |
| `{{trackingId}}` | Unique tracking ID | `track_abc123` |

## 🔧 **System Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{emailId}}` | Unique email ID | `email_xyz789` |
| `{{templateVersion}}` | Template version | `1.0.0` |
| `{{environment}}` | Environment (dev/prod) | `production` |
| `{{locale}}` | User's locale | `en-US` |

## 📝 **Usage Examples**

### **Basic Email Template**
```markdown
Hello {{recipientFirstName}},

You've been invited to join {{appName}}!

**Invite Details:**
- Invited by: {{invitedByName}}
- Expires: {{expiresAtFormatted}}
- Sign up here: {{signupUrl}}

Best regards,
The {{appName}} Team
```

### **HTML Email Template**
```html
<div style="color: {{textColor}}; background-color: {{backgroundColor}};">
  <h1 style="color: {{primaryColor}};">Welcome to {{appName}}!</h1>
  
  <p>Hello {{recipientFirstName}},</p>
  
  <p>You've been invited by {{invitedByName}} to join our exclusive beta program.</p>
  
  <a href="{{signupUrl}}" 
     style="background-color: {{primaryColor}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    Join Beta Now
  </a>
  
  <p><small>This invite expires on {{expiresAtFormatted}}</small></p>
</div>
```

### **Conditional Content**
```markdown
{{#if expiresAt}}
This invite expires on {{expiresAtFormatted}}.
{{else}}
This invite has no expiration date.
{{/if}}

{{#if invitedByName}}
Invited by: {{invitedByName}}
{{else}}
Invited by: our admin team
{{/if}}
```

## 🎯 **Custom Variables**

You can also create custom variables by editing the email service configuration:

### **Add Custom Variables**
```typescript
// In emailService.ts
const customVariables = {
  '{{companyName}}': 'Your Company Inc.',
  '{{supportEmail}}': 'support@yourdomain.com',
  '{{phoneNumber}}': '+1 (555) 123-4567'
};
```

### **Dynamic Variables**
```typescript
// Variables that change based on context
const dynamicVariables = {
  '{{inviteCount}}': userInviteCount,
  '{{daysUntilExpiry}}': daysUntilExpiry,
  '{{inviteType}}': inviteType
};
```

## 🔍 **Testing Variables**

### **Test Variable Replacement**
```bash
# Test with sample data
npm run test:email -- --variables
```

### **Preview Template**
```bash
# Preview email with variables
npm run preview:email -- --template=beta-invite --email=test@example.com
```

## 📚 **Best Practices**

### **Variable Usage**
- **Always provide fallbacks**: `{{invitedByName || 'our admin team'}}`
- **Use descriptive names**: `{{appName}}` instead of `{{name}}`
- **Keep it simple**: Avoid complex nested variables
- **Test thoroughly**: Verify all variables work correctly

### **Performance**
- **Cache templates**: Reduce variable replacement overhead
- **Minimize variables**: Only use what you need
- **Optimize queries**: Fetch data efficiently

### **Security**
- **Sanitize input**: Prevent XSS attacks
- **Validate data**: Ensure variables contain expected values
- **Log usage**: Track variable usage for debugging

## 🚨 **Common Issues**

### **Variable Not Replaced**
- Check spelling and case sensitivity
- Verify variable exists in the data
- Check template syntax

### **Undefined Variables**
- Provide default values
- Use conditional rendering
- Handle missing data gracefully

### **Performance Issues**
- Limit the number of variables
- Cache template rendering
- Optimize data fetching

## 📖 **Reference Links**

- **Template Engine**: [Handlebars.js](https://handlebarsjs.com/)
- **Email Variables**: [Campaign Monitor](https://www.campaignmonitor.com/resources/guides/personalization/)
- **Best Practices**: [Mailchimp](https://mailchimp.com/resources/email-marketing-best-practices/)

Use these variables to create dynamic, personalized email content! 