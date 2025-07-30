# Email Service Setup Guide for Beta Invites

This guide explains how to set up email notifications for beta invites when an admin adds email addresses via the admin panel.

## Overview

The email service supports multiple email providers and automatically sends beautiful beta invite emails when new invites are added through the admin interface.

## Supported Email Providers

### 1. Resend (Recommended)
- **Pros**: Easy setup, great deliverability, modern API
- **Cons**: Requires API key
- **Setup**: Sign up at [resend.com](https://resend.com)

### 2. SendGrid
- **Pros**: Reliable, enterprise-grade
- **Cons**: More complex setup
- **Setup**: Sign up at [sendgrid.com](https://sendgrid.com)

### 3. Supabase (Future)
- **Pros**: Integrated with existing Supabase setup
- **Cons**: Not yet implemented
- **Setup**: Will be available in future updates

### 4. Nodemailer (Server-side)
- **Pros**: Full control, no external dependencies
- **Cons**: Requires server implementation
- **Setup**: Requires backend server setup

## Quick Setup with Resend

### Step 1: Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your domain or use the provided sandbox domain
4. Get your API key from the dashboard

### Step 2: Configure Environment Variables
Add these variables to your `.env.local` file:

```env
# Email Configuration
VITE_EMAIL_PROVIDER=resend
VITE_EMAIL_API_KEY=re_QgJXbhxc_2RvdgzofYYTCkn68yq96bC7X
VITE_EMAIL_FROM=onboarding@resend.dev
VITE_EMAIL_FROM_NAME=Job Search Tracker
```

### Step 3: Test the Setup
1. Start your development server: `npm run dev`
2. Log in as admin (dan.northington@gmail.com)
3. Go to Admin > Beta Invites
4. Add a test email address
5. Check the "Send email notifications" checkbox
6. Click "Add Invites"
7. Check the email status in the admin panel

## Email Template Features

The beta invite email includes:

- **Professional Design**: Modern, responsive HTML template
- **Clear Call-to-Action**: Direct link to signup page
- **Feature Highlights**: Lists key benefits of the app
- **Expiration Information**: Shows when the invite expires
- **Personalization**: Includes who sent the invite
- **Fallback Text**: Plain text version for email clients

## Email Content Preview

### Subject Line
"You're invited to join our beta! 🚀"

### HTML Content
- Beautiful gradient header
- Feature highlights with icons
- Professional styling
- Mobile-responsive design
- Clear call-to-action button

### Text Content
- Plain text fallback
- All essential information
- Direct signup link

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_EMAIL_PROVIDER` | Email service provider | `resend` | No |
| `VITE_EMAIL_API_KEY` | API key for email service | - | Yes |
| `VITE_EMAIL_FROM` | From email address | `noreply@yourdomain.com` | No |
| `VITE_EMAIL_FROM_NAME` | From name | `Job Search Tracker` | No |

### Email Service Features

- **Automatic Initialization**: Service initializes when admin panel loads
- **Error Handling**: Graceful handling of email failures
- **Status Reporting**: Real-time email delivery status
- **Batch Processing**: Handles multiple emails efficiently
- **Retry Logic**: Built-in error recovery

## Admin Panel Integration

### Email Controls
- **Checkbox**: Enable/disable email notifications per batch
- **Status Display**: Real-time email delivery status
- **Error Reporting**: Detailed error messages for failed emails

### Email Status Indicators
- **Green**: Email sent successfully
- **Red**: Email failed to send
- **Message**: Detailed status or error message

## Troubleshooting

### Common Issues

1. **"Email API key not configured"**
   - Solution: Add `VITE_EMAIL_API_KEY` to your environment variables

2. **"Resend API error: 401 Unauthorized"**
   - Solution: Check your API key is correct and active

3. **"Failed to send email via Resend"**
   - Solution: Verify your domain is verified in Resend dashboard

4. **"Email service not initialized"**
   - Solution: Check that you're logged in as admin and the service initializes

### Testing Email Setup

1. **Test with Resend Sandbox**:
   ```env
   VITE_EMAIL_FROM=onboarding@resend.dev
   ```

2. **Test with Gmail** (if using SendGrid):
   ```env
   VITE_EMAIL_FROM=your-email@gmail.com
   ```

3. **Check Email Logs**:
   - Resend: Dashboard > Logs
   - SendGrid: Dashboard > Activity

## Security Considerations

### API Key Security
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Use least-privilege API keys

### Email Security
- Verify sender domain to prevent spoofing
- Use SPF, DKIM, and DMARC records
- Monitor email delivery rates
- Implement rate limiting if needed

## Production Deployment

### Environment Setup
1. Set production environment variables
2. Verify domain in email provider dashboard
3. Test email delivery in production environment
4. Monitor email metrics and delivery rates

### Monitoring
- Track email delivery success rates
- Monitor bounce rates and spam complaints
- Set up alerts for email service failures
- Log email sending activities

## Advanced Configuration

### Custom Email Templates
You can customize the email template by modifying the `generateBetaInviteEmailHTML` and `generateBetaInviteEmailText` methods in `src/utils/emailService.ts`.

### Multiple Email Providers
The service supports switching between providers by changing the `VITE_EMAIL_PROVIDER` environment variable.

### Rate Limiting
For high-volume email sending, consider implementing rate limiting in the email service.

## Support

If you encounter issues with the email service:

1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Test with a different email provider
4. Check email provider dashboard for delivery status
5. Review the troubleshooting section above

## Future Enhancements

- [ ] Supabase email service integration
- [ ] Email templates customization UI
- [ ] Email delivery analytics
- [ ] Bulk email management
- [ ] Email scheduling
- [ ] A/B testing for email templates 