# Beta Invite Email Header

This is the header section of the beta invite email. It includes the welcome message, branding, and introduction.

## 🎨 **Current Header Content**

### **HTML Version**
```html
<div class="header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
  <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🚀 You're Invited!</h1>
  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to our exclusive beta program</p>
</div>
```

### **Text Version**
```
🚀 You're Invited!

Welcome to our exclusive beta program
```

## 📝 **Customization Options**

### **Change Welcome Message**
```html
<h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎯 Join Our Beta!</h1>
<p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been selected for exclusive access</p>
```

### **Add Personalization**
```html
<h1 style="margin: 0; font-size: 28px; font-weight: 700;">Hello {{recipientFirstName}}! 🚀</h1>
<p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You're invited to join our exclusive beta program</p>
```

### **Include App Name**
```html
<h1 style="margin: 0; font-size: 28px; font-weight: 700;">Welcome to {{appName}}! 🚀</h1>
<p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been invited to our exclusive beta program</p>
```

### **Add Inviter Information**
```html
<h1 style="margin: 0; font-size: 28px; font-weight: 700;">You're Invited! 🚀</h1>
<p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">{{invitedByName}} invited you to join our beta</p>
```

## 🎨 **Styling Options**

### **Different Color Schemes**

#### **Blue Gradient (Current)**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

#### **Green Gradient**
```css
background: linear-gradient(135deg, #10B981 0%, #059669 100%);
```

#### **Purple Gradient**
```css
background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
```

#### **Orange Gradient**
```css
background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
```

### **Different Layouts**

#### **Centered Layout (Current)**
```html
<div style="text-align: center;">
  <h1>🚀 You're Invited!</h1>
  <p>Welcome to our exclusive beta program</p>
</div>
```

#### **Left-Aligned Layout**
```html
<div style="text-align: left;">
  <h1>🚀 You're Invited!</h1>
  <p>Welcome to our exclusive beta program</p>
</div>
```

#### **With Logo**
```html
<div style="text-align: center;">
  <img src="{{appLogo}}" alt="{{appName}}" style="width: 60px; height: 60px; margin-bottom: 15px;">
  <h1>🚀 You're Invited!</h1>
  <p>Welcome to our exclusive beta program</p>
</div>
```

## 📱 **Mobile Responsive**

### **Mobile-Optimized Header**
```html
<div class="header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
  <h1 style="margin: 0; font-size: 24px; font-weight: 700; line-height: 1.2;">🚀 You're Invited!</h1>
  <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; line-height: 1.4;">Welcome to our exclusive beta program</p>
</div>
```

## 🎯 **A/B Testing Ideas**

### **Test 1: Emoji vs No Emoji**
- A: "🚀 You're Invited!"
- B: "You're Invited!"

### **Test 2: Personalization**
- A: "🚀 You're Invited!"
- B: "Hello {{recipientFirstName}}! 🚀"

### **Test 3: Message Tone**
- A: "Welcome to our exclusive beta program"
- B: "You've been selected for exclusive access"

### **Test 4: Color Schemes**
- A: Blue gradient
- B: Green gradient

## 📊 **Performance Tips**

### **Engagement**
- **Use emojis**: Make it visually appealing
- **Keep it short**: Don't overwhelm with text
- **Clear hierarchy**: Main message first, details second

### **Branding**
- **Consistent colors**: Match your brand
- **Professional tone**: Build trust
- **Clear value proposition**: What will they get?

### **Mobile Optimization**
- **Readable font sizes**: 24px+ for headers
- **Adequate spacing**: 20px+ padding
- **Touch-friendly**: Large click targets

## 🔍 **Testing**

### **Preview Your Header**
```bash
# Test the header in different email clients
npm run test:email -- --preview=header
```

### **Check Mobile Rendering**
- Test on iPhone Mail
- Test on Gmail mobile
- Test on Outlook mobile

## 📚 **Resources**

- **Email Header Best Practices**: [Campaign Monitor](https://www.campaignmonitor.com/resources/guides/email-header-design/)
- **Mobile Email Design**: [Email Framework](https://emailframework.com/)
- **Color Psychology**: [Color Theory](https://www.colormatters.com/color-and-design/basic-color-theory)

## 🎨 **Quick Customization**

To change the header, edit this file and save. The new header will be used for all future beta invite emails.

**Current header:**
```html
<h1>🚀 You're Invited!</h1>
<p>Welcome to our exclusive beta program</p>
```

**Your custom header:**
```html
[Edit this section with your preferred header content]
```

Remember to test your new header with `npm run test:email` before sending to real users! 