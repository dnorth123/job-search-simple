# Email Template Management

This directory contains all email templates and content for the beta invite system. You can easily customize the email content by editing these markdown files.

## 📁 **File Structure**

```
email-templates/
├── README.md                    # This file - management guide
├── beta-invite/
│   ├── subject.md              # Email subject line
│   ├── html-template.md        # HTML email template
│   ├── text-template.md        # Plain text email template
│   └── content-blocks/
│       ├── header.md           # Email header content
│       ├── features.md         # Feature highlights
│       ├── call-to-action.md   # Signup button/link
│       └── footer.md           # Email footer
├── email-config.md             # Email configuration settings
└── template-variables.md       # Available template variables
```

## 🎨 **Customization Guide**

### **Quick Start**
1. Edit the content in the markdown files
2. The changes will be automatically applied to your emails
3. Test with `npm run test:email`

### **What You Can Customize**
- **Subject lines**: Make them more engaging
- **Header content**: Welcome messages and branding
- **Feature highlights**: List your app's key benefits
- **Call-to-action**: Signup button text and styling
- **Footer**: Contact info and legal text
- **Styling**: Colors, fonts, and layout

### **Template Variables**
Use these variables in your templates:
- `{{recipientEmail}}` - The invitee's email address
- `{{inviteId}}` - Unique invite identifier
- `{{invitedBy}}` - Admin who sent the invite
- `{{expiresAt}}` - Invite expiration date
- `{{signupUrl}}` - Direct signup link
- `{{appName}}` - Your app name
- `{{appUrl}}` - Your app URL

## 📧 **Email Types**

### **Beta Invite Email**
- **Purpose**: Welcome new beta users
- **Template**: `beta-invite/`
- **Frequency**: Sent when admin adds email addresses
- **Content**: Professional welcome with feature highlights

## 🔧 **Technical Details**

### **How Templates Work**
1. Markdown files are loaded by the email service
2. Template variables are replaced with actual data
3. Content is converted to HTML and plain text
4. Emails are sent via Resend API

### **File Formats**
- **Markdown**: Easy to edit and version control
- **HTML**: Generated automatically from markdown
- **Text**: Plain text fallback for email clients

### **Styling**
- **CSS**: Inline styles for email compatibility
- **Responsive**: Mobile-friendly design
- **Branding**: Customizable colors and fonts

## 🚀 **Deployment**

### **Local Development**
- Edit markdown files
- Test with `npm run test:email`
- Check admin panel for live preview

### **Production**
- Templates are bundled with the app
- No additional deployment steps needed
- Changes take effect immediately

## 📊 **Analytics**

### **Track Performance**
- **Open rates**: Monitor email engagement
- **Click rates**: Track signup conversions
- **Bounce rates**: Identify delivery issues
- **A/B testing**: Test different subject lines

### **Resend Dashboard**
- View detailed analytics at [resend.com](https://resend.com)
- Monitor delivery rates and engagement
- Track email performance over time

## 🎯 **Best Practices**

### **Content Guidelines**
- **Keep it concise**: Focus on key benefits
- **Clear call-to-action**: Make signup obvious
- **Professional tone**: Build trust and credibility
- **Mobile-friendly**: Test on different devices

### **Technical Guidelines**
- **Use template variables**: For dynamic content
- **Test thoroughly**: Before sending to real users
- **Monitor delivery**: Check spam folders
- **Update regularly**: Keep content fresh

## 🔍 **Troubleshooting**

### **Common Issues**
1. **Template not updating**: Restart dev server
2. **Variables not working**: Check syntax
3. **Styling issues**: Test in different email clients
4. **Delivery problems**: Check Resend dashboard

### **Testing**
- **Test script**: `npm run test:email`
- **Admin panel**: Add test beta invites
- **Email clients**: Test in Gmail, Outlook, etc.
- **Mobile devices**: Check responsive design

## 📚 **Resources**

- **Resend Documentation**: [resend.com/docs](https://resend.com/docs)
- **Email Best Practices**: [email-templates/best-practices.md](best-practices.md)
- **Template Examples**: [email-templates/examples/](examples/)
- **Styling Guide**: [email-templates/styling.md](styling.md)

## 🎨 **Customization Examples**

### **Change App Name**
Edit `email-config.md`:
```markdown
appName: "Your Awesome App"
```

### **Update Feature List**
Edit `beta-invite/content-blocks/features.md`:
```markdown
- 🚀 New feature 1
- 💡 New feature 2
- 🔥 New feature 3
```

### **Customize Colors**
Edit `email-config.md`:
```markdown
primaryColor: "#3B82F6"
secondaryColor: "#1F2937"
```

Start customizing your email content by editing the files in this directory! 