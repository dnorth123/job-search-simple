# Beta Invite Email Footer

This is the footer section of the beta invite email. It includes contact information, legal text, and any additional links.

## 🎯 **Current Footer Content**

### **HTML Version**
```html
<div class="footer" style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
  <p style="margin: 5px 0;">This invite was sent by {{invitedBy || 'our admin team'}}</p>
  <p style="margin: 5px 0;">Job Search Tracker Beta Program</p>
  <p style="margin: 15px 0; font-size: 12px; color: #999;">
    If you have any questions, feel free to reach out to our support team.
  </p>
</div>
```

### **Text Version**
```
This invite was sent by {{invitedBy || 'our admin team'}}

Job Search Tracker Beta Program

If you have any questions, feel free to reach out to our support team.
```

## 📝 **Customization Options**

### **Add Contact Information**
```html
<div class="footer" style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
  <p style="margin: 5px 0;">This invite was sent by {{invitedBy || 'our admin team'}}</p>
  <p style="margin: 5px 0;">Job Search Tracker Beta Program</p>
  <p style="margin: 15px 0; font-size: 12px; color: #999;">
    Questions? Contact us at <a href="mailto:support@yourdomain.com" style="color: #007bff;">support@yourdomain.com</a>
  </p>
  <p style="margin: 5px 0; font-size: 12px; color: #999;">
    📧 support@yourdomain.com | 📱 +1 (555) 123-4567
  </p>
</div>
```

### **Add Social Links**
```html
<div class="footer" style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
  <p style="margin: 5px 0;">This invite was sent by {{invitedBy || 'our admin team'}}</p>
  <p style="margin: 5px 0;">Job Search Tracker Beta Program</p>
  <div style="margin: 15px 0;">
    <a href="https://twitter.com/yourapp" style="color: #007bff; text-decoration: none; margin: 0 10px;">Twitter</a>
    <a href="https://linkedin.com/company/yourapp" style="color: #007bff; text-decoration: none; margin: 0 10px;">LinkedIn</a>
    <a href="https://github.com/yourapp" style="color: #007bff; text-decoration: none; margin: 0 10px;">GitHub</a>
  </div>
</div>
```

### **Add Legal Text**
```html
<div class="footer" style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
  <p style="margin: 5px 0;">This invite was sent by {{invitedBy || 'our admin team'}}</p>
  <p style="margin: 5px 0;">Job Search Tracker Beta Program</p>
  <p style="margin: 15px 0; font-size: 12px; color: #999;">
    If you have any questions, feel free to reach out to our support team.
  </p>
  <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 11px; color: #999;">
    <p style="margin: 5px 0;">
      <a href="{{appUrl}}/privacy" style="color: #999;">Privacy Policy</a> | 
      <a href="{{appUrl}}/terms" style="color: #999;">Terms of Service</a> | 
      <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
    </p>
    <p style="margin: 5px 0;">© 2024 Job Search Tracker. All rights reserved.</p>
  </div>
</div>
```

### **Add Company Information**
```html
<div class="footer" style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
  <p style="margin: 5px 0;">This invite was sent by {{invitedBy || 'our admin team'}}</p>
  <p style="margin: 5px 0;">Job Search Tracker Beta Program</p>
  <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 6px;">
    <p style="margin: 5px 0; font-weight: 600;">Your Company Inc.</p>
    <p style="margin: 5px 0; font-size: 12px;">123 Main Street, Suite 100</p>
    <p style="margin: 5px 0; font-size: 12px;">San Francisco, CA 94105</p>
    <p style="margin: 5px 0; font-size: 12px;">📧 hello@yourcompany.com | 📱 +1 (555) 123-4567</p>
  </div>
</div>
```

## 🎨 **Styling Options**

### **Different Layouts**

#### **Simple Footer**
```html
<div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
  <p>This invite was sent by {{invitedBy || 'our admin team'}}</p>
  <p>Job Search Tracker Beta Program</p>
</div>
```

#### **Two-Column Footer**
```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; color: #666; font-size: 14px;">
  <div style="text-align: left;">
    <p style="margin: 5px 0;"><strong>Contact Us</strong></p>
    <p style="margin: 5px 0;">📧 support@yourdomain.com</p>
    <p style="margin: 5px 0;">📱 +1 (555) 123-4567</p>
  </div>
  <div style="text-align: right;">
    <p style="margin: 5px 0;"><strong>Follow Us</strong></p>
    <p style="margin: 5px 0;">🐦 Twitter</p>
    <p style="margin: 5px 0;">💼 LinkedIn</p>
  </div>
</div>
```

#### **Card-Style Footer**
```html
<div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
  <p style="margin: 5px 0;">This invite was sent by {{invitedBy || 'our admin team'}}</p>
  <p style="margin: 5px 0;">Job Search Tracker Beta Program</p>
  <div style="margin-top: 15px;">
    <a href="mailto:support@yourdomain.com" style="color: #007bff; text-decoration: none; margin: 0 10px;">Contact Support</a>
    <a href="{{appUrl}}/help" style="color: #007bff; text-decoration: none; margin: 0 10px;">Help Center</a>
  </div>
</div>
```

### **Different Color Schemes**

#### **Gray Theme (Current)**
```css
color: #666; font-size: 14px;
```

#### **Blue Theme**
```css
color: #3b82f6; font-size: 14px;
```

#### **Dark Theme**
```css
color: #1f2937; font-size: 14px;
```

#### **Muted Theme**
```css
color: #9ca3af; font-size: 14px;
```

## 📊 **Footer Components**

### **Essential Information**
- **Sender attribution**: Who sent the invite
- **Company name**: Your app/brand name
- **Contact info**: How to reach support

### **Optional Components**
- **Social links**: Twitter, LinkedIn, GitHub
- **Legal links**: Privacy, Terms, Unsubscribe
- **Company address**: Physical location
- **Support links**: Help center, FAQ

### **Mobile Considerations**
- **Readable text**: 12px+ font size
- **Touch-friendly links**: Adequate spacing
- **Responsive layout**: Adapts to screen size

## 🎯 **A/B Testing Ideas**

### **Test 1: Contact Information**
- A: Email only
- B: Email + phone number

### **Test 2: Social Links**
- A: No social links
- B: With social links

### **Test 3: Legal Text**
- A: No legal links
- B: With privacy/terms links

### **Test 4: Layout Style**
- A: Simple footer
- B: Card-style footer

## 📈 **Best Practices**

### **Content Guidelines**
- **Keep it concise**: Don't overwhelm with information
- **Include essentials**: Sender, company, contact
- **Professional tone**: Match your brand voice
- **Clear hierarchy**: Most important info first

### **Technical Guidelines**
- **Accessible links**: Use descriptive text
- **Mobile-friendly**: Test on different devices
- **Consistent styling**: Match email theme
- **Legal compliance**: Include required links

### **Branding**
- **Consistent colors**: Match your brand
- **Professional appearance**: Build trust
- **Clear attribution**: Who sent the email
- **Contact options**: Multiple ways to reach you

## 🔍 **Testing**

### **Preview Your Footer**
```bash
# Test the footer section
npm run test:email -- --preview=footer
```

### **Check Mobile Rendering**
- Test on iPhone Mail
- Test on Gmail mobile
- Test on Outlook mobile

## 📚 **Resources**

- **Email Footer Best Practices**: [Campaign Monitor](https://www.campaignmonitor.com/resources/guides/email-footer-design/)
- **Legal Requirements**: [Email Compliance](https://www.ftc.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business)
- **Mobile Email Design**: [Email Framework](https://emailframework.com/)

## 🎨 **Quick Customization**

To change the footer, edit this file and save. The new footer will be used for all future beta invite emails.

**Current footer:**
```html
<p>This invite was sent by {{invitedBy || 'our admin team'}}</p>
<p>Job Search Tracker Beta Program</p>
<p>If you have any questions, feel free to reach out to our support team.</p>
```

**Your custom footer:**
```html
[Edit this section with your preferred footer content]
```

Remember to test your new footer with `npm run test:email` before sending to real users! 