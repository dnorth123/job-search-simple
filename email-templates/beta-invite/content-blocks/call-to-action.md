# Beta Invite Email Call-to-Action

This is the call-to-action section that encourages recipients to join your beta program. It includes the signup button and supporting text.

## 🎯 **Current Call-to-Action Content**

### **HTML Version**
```html
<div style="text-align: center; margin: 30px 0;">
  <a href="{{signupUrl}}" 
     style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
    Join Beta Now
  </a>
  <p style="margin-top: 15px; font-size: 14px; color: #666;">
    {{#if expiresAt}}
    This invite expires on {{expiresAtFormatted}}.
    {{else}}
    This invite has no expiration date.
    {{/if}}
  </p>
</div>
```

### **Text Version**
```
Join Beta Now: {{signupUrl}}

{{#if expiresAt}}
This invite expires on {{expiresAtFormatted}}.
{{else}}
This invite has no expiration date.
{{/if}}
```

## 📝 **Customization Options**

### **Change Button Text**
```html
<div style="text-align: center; margin: 30px 0;">
  <a href="{{signupUrl}}" 
     style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
    Get Started Now
  </a>
</div>
```

### **Add Urgency**
```html
<div style="text-align: center; margin: 30px 0;">
  <a href="{{signupUrl}}" 
     style="display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
    🚨 Limited Time - Join Now!
  </a>
  <p style="margin-top: 15px; font-size: 14px; color: #666;">
    Only {{remainingSpots}} spots left in this beta round!
  </p>
</div>
```

### **Add Social Proof**
```html
<div style="text-align: center; margin: 30px 0;">
  <a href="{{signupUrl}}" 
     style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
    Join 500+ Professionals
  </a>
  <p style="margin-top: 15px; font-size: 14px; color: #666;">
    Join the {{totalUsers}}+ professionals already using our beta
  </p>
</div>
```

### **Add Personalization**
```html
<div style="text-align: center; margin: 30px 0;">
  <p style="margin-bottom: 15px; font-size: 16px; color: #333;">
    Ready to get organized, {{recipientFirstName}}?
  </p>
  <a href="{{signupUrl}}" 
     style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
    Start Your Free Trial
  </a>
</div>
```

## 🎨 **Styling Options**

### **Different Button Colors**

#### **Blue (Current)**
```css
background: #007bff; color: white;
```

#### **Green**
```css
background: #28a745; color: white;
```

#### **Purple**
```css
background: #6f42c1; color: white;
```

#### **Orange**
```css
background: #fd7e14; color: white;
```

#### **Red (Urgency)**
```css
background: #dc3545; color: white;
```

### **Different Button Styles**

#### **Rounded Button**
```css
border-radius: 25px; padding: 15px 30px;
```

#### **Sharp Button**
```css
border-radius: 0; padding: 12px 24px;
```

#### **Outlined Button**
```css
background: transparent; color: #007bff; border: 2px solid #007bff;
```

#### **Gradient Button**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;
```

### **Different Layouts**

#### **Centered with Description**
```html
<div style="text-align: center; margin: 30px 0;">
  <h3 style="margin-bottom: 15px; color: #333;">Ready to get started?</h3>
  <p style="margin-bottom: 20px; color: #666;">Join our exclusive beta and start organizing your job search today.</p>
  <a href="{{signupUrl}}" 
     style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
    Join Beta Now
  </a>
</div>
```

#### **Two-Button Layout**
```html
<div style="text-align: center; margin: 30px 0;">
  <a href="{{signupUrl}}" 
     style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px;">
    Join Beta Now
  </a>
  <a href="{{appUrl}}/demo" 
     style="display: inline-block; background: transparent; color: #007bff; padding: 12px 24px; text-decoration: none; border: 2px solid #007bff; border-radius: 6px; font-weight: 600; margin: 0 10px;">
    Watch Demo
  </a>
</div>
```

#### **With Countdown**
```html
<div style="text-align: center; margin: 30px 0;">
  <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
    <strong>⏰ Limited Time Offer</strong>
    <p style="margin: 5px 0 0 0; font-size: 14px;">This invite expires in {{daysUntilExpiry}} days</p>
  </div>
  <a href="{{signupUrl}}" 
     style="display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
    Join Now - Limited Time!
  </a>
</div>
```

## 📊 **A/B Testing Ideas**

### **Test 1: Button Text**
- A: "Join Beta Now"
- B: "Get Started Free"

### **Test 2: Button Color**
- A: Blue button
- B: Green button

### **Test 3: Urgency**
- A: Standard CTA
- B: "Limited Time - Join Now!"

### **Test 4: Social Proof**
- A: "Join Beta Now"
- B: "Join 500+ Professionals"

### **Test 5: Personalization**
- A: "Join Beta Now"
- B: "Ready to get organized, {{recipientFirstName}}?"

## 📈 **Best Practices**

### **Button Design**
- **Clear action**: Use action words like "Join", "Start", "Get"
- **Contrasting color**: Make it stand out
- **Adequate size**: At least 44px height for mobile
- **Clear text**: Avoid generic terms like "Click here"

### **Supporting Text**
- **Add context**: Why should they click?
- **Include benefits**: What will they get?
- **Create urgency**: Limited time, spots available
- **Reduce friction**: "Free", "No credit card required"

### **Mobile Optimization**
- **Touch-friendly**: Large button size
- **Readable text**: 16px+ font size
- **Adequate spacing**: 20px+ margins
- **Responsive design**: Adapts to screen size

## 🔍 **Testing**

### **Preview Your CTA**
```bash
# Test the call-to-action
npm run test:email -- --preview=cta
```

### **Track Performance**
- **Click-through rates**: Monitor button clicks
- **Conversion rates**: Track signup completions
- **A/B test results**: Compare different versions

## 📚 **Resources**

- **CTA Best Practices**: [HubSpot](https://blog.hubspot.com/blog/tabid/6307/bid/23454/the-ultimate-guide-to-call-to-action-buttons.aspx)
- **Button Design**: [Smashing Magazine](https://www.smashingmagazine.com/2016/11/a-comprehensive-guide-to-cta-design/)
- **Email CTAs**: [Campaign Monitor](https://www.campaignmonitor.com/resources/guides/email-call-to-action-buttons/)

## 🎨 **Quick Customization**

To change the call-to-action, edit this file and save. The new CTA will be used for all future beta invite emails.

**Current CTA:**
```html
<a href="{{signupUrl}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
  Join Beta Now
</a>
```

**Your custom CTA:**
```html
[Edit this section with your preferred call-to-action]
```

Remember to test your new CTA with `npm run test:email` before sending to real users! 