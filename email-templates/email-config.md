# Email Configuration

This file contains all configurable settings for email templates. Edit these values to customize your email appearance and content.

## 🎨 **Branding & Colors**

```yaml
appName: "Job Search Tracker"
appUrl: "https://your-app-domain.com"
primaryColor: "#3B82F6"      # Blue
secondaryColor: "#1F2937"    # Dark gray
accentColor: "#10B981"       # Green
backgroundColor: "#F8FAFC"    # Light gray
textColor: "#1F2937"         # Dark gray
```

## 📧 **Email Settings**

```yaml
fromName: "Job Search Tracker"
fromEmail: "onboarding@resend.dev"
replyTo: "support@yourdomain.com"
```

## 📝 **Content Settings**

```yaml
# Beta Invite Email
betaInviteSubject: "You're invited to join our beta! 🚀"
betaInviteGreeting: "Hello!"
betaInviteIntro: "You've been invited to join our exclusive beta program for the Job Search Tracker - a powerful tool designed to help knowledge workers manage their job applications effectively."

# Call to Action
ctaText: "Join Beta Now"
ctaButtonColor: "#3B82F6"
ctaTextColor: "#FFFFFF"

# Footer
footerText: "This invite was sent by our admin team"
companyName: "Job Search Tracker Beta Program"
supportEmail: "support@yourdomain.com"
```

## 🎯 **Feature Highlights**

```yaml
# These will be displayed in the email
features:
  - icon: "📊"
    title: "Track all your job applications in one place"
  - icon: "🏢"
    title: "Organize applications by company and position"
  - icon: "📈"
    title: "Monitor application status and progress"
  - icon: "💼"
    title: "Professional profile management"
  - icon: "🔍"
    title: "Advanced search and filtering"
```

## 📱 **Responsive Design**

```yaml
# Mobile breakpoint
mobileBreakpoint: "600px"

# Container width
containerWidth: "600px"

# Spacing
padding: "20px"
sectionSpacing: "30px"
```

## 🔧 **Technical Settings**

```yaml
# Template engine
templateEngine: "markdown"

# Email format
supportHtml: true
supportText: true

# Character encoding
encoding: "UTF-8"

# Line breaks
lineBreakStyle: "CRLF"
```

## 🎨 **Styling Options**

```yaml
# Typography
fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
fontSize: "16px"
lineHeight: "1.6"

# Headers
h1FontSize: "24px"
h2FontSize: "20px"
h3FontSize: "18px"

# Buttons
buttonPadding: "12px 24px"
buttonBorderRadius: "6px"
buttonFontWeight: "600"
```

## 📊 **Analytics Settings**

```yaml
# Track opens
trackOpens: true

# Track clicks
trackClicks: true

# UTM parameters
addUtmParams: true
utmSource: "email"
utmMedium: "beta-invite"
utmCampaign: "beta-launch"
```

## 🔒 **Security Settings**

```yaml
# Unsubscribe link
includeUnsubscribe: false

# Privacy policy link
privacyPolicyUrl: "https://yourdomain.com/privacy"

# Terms of service link
termsUrl: "https://yourdomain.com/terms"
```

## 🚀 **Advanced Settings**

```yaml
# Template caching
cacheTemplates: true
cacheDuration: "3600"  # 1 hour

# Error handling
retryAttempts: 3
retryDelay: "1000ms"

# Rate limiting
maxEmailsPerMinute: 60
maxEmailsPerHour: 1000
```

## 📝 **Customization Notes**

### **How to Use These Settings**

1. **Edit the values** in this file
2. **Save the file** - changes are applied immediately
3. **Test the emails** with `npm run test:email`
4. **Deploy** - no additional steps needed

### **Color Format**
- Use hex colors: `#3B82F6`
- Use RGB: `rgb(59, 130, 246)`
- Use named colors: `blue`, `red`, etc.

### **Font Options**
- System fonts: `-apple-system, BlinkMacSystemFont`
- Web fonts: `'Inter', sans-serif`
- Fallback fonts: `Arial, sans-serif`

### **Responsive Design**
- Mobile-first approach
- Breakpoints for different screen sizes
- Optimized for email clients

## 🔍 **Testing**

### **Test Your Changes**
```bash
# Test email service
npm run test:email

# Test in admin panel
# Add beta invites with email notifications
```

### **Email Client Testing**
- Gmail (desktop & mobile)
- Outlook (desktop & mobile)
- Apple Mail
- Thunderbird

### **Device Testing**
- iPhone
- Android
- Desktop browsers
- Tablet devices

## 📚 **Resources**

- **Color Palette**: [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- **Email Best Practices**: [Campaign Monitor](https://www.campaignmonitor.com/resources/guides/email-marketing-best-practices/)
- **Responsive Email**: [Email Framework](https://emailframework.com/)

Edit these settings to match your brand and requirements! 