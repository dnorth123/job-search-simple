# Email Notification Setup Guide

This guide will help you set up email notifications so you receive emails when new beta users are added to your application.

## Overview

The email notification system will send you an email whenever new beta users are added through the admin interface. The email will include:
- Number of new beta users added
- List of email addresses added
- Total count of beta users
- Timestamp of the action

## Setup Options

### Option 1: Resend (Recommended)

[Resend](https://resend.com) is a modern email API that's easy to set up and has a generous free tier.

#### Step 1: Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your domain or use their test domain

#### Step 2: Get API Key
1. Go to your Resend dashboard
2. Navigate to API Keys section
3. Create a new API key
4. Copy the API key (starts with `re_`)

#### Step 3: Configure Environment Variables
Add these to your `.env` file:

```env
VITE_EMAIL_API_KEY=re_your_api_key_here
VITE_FROM_EMAIL=noreply@yourdomain.com
```

### Option 2: SendGrid

[SendGrid](https://sendgrid.com) is another popular email service.

#### Step 1: Create SendGrid Account
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for a free account
3. Verify your sender identity

#### Step 2: Get API Key
1. Go to Settings > API Keys
2. Create a new API key
3. Copy the API key

#### Step 3: Configure Environment Variables
```env
VITE_EMAIL_API_KEY=SG.your_api_key_here
VITE_FROM_EMAIL=noreply@yourdomain.com
```

### Option 3: Custom Email Service

If you want to use a different email service, you can modify the `emailService.ts` file to integrate with your preferred provider.

## Implementation Details

### Email Service Configuration

The email service is configured in `src/utils/emailService.ts` and includes:

- **Environment Variables**: Uses `VITE_EMAIL_API_KEY` and `VITE_FROM_EMAIL`
- **Error Handling**: Graceful fallback if email service is not configured
- **HTML Templates**: Professional-looking email templates
- **Logging**: Console logs for debugging

### Integration Points

The email notification is triggered in `src/components/AdminBetaInvites.tsx` when:
1. New beta users are added through the admin interface
2. The `addInvites` function successfully inserts new records
3. The email service is properly configured

### Email Template

The notification email includes:
- **Header**: "New Beta Users Added"
- **Statistics**: Date, total users, new users count
- **User List**: All newly added email addresses
- **Footer**: Link to admin interface

## Testing

### Test Email Configuration
You can test the email configuration by:

1. Adding the environment variables
2. Going to the admin interface
3. Adding a test beta user
4. Checking your email for the notification

### Debug Mode
The email service logs configuration status. Check the browser console for:
- Email service configuration status
- Success/failure messages
- Error details if sending fails

## Troubleshooting

### Common Issues

1. **"Email service not configured"**
   - Check that `VITE_EMAIL_API_KEY` and `VITE_FROM_EMAIL` are set
   - Restart your development server after adding environment variables

2. **"Email notification failed to send"**
   - Verify your API key is correct
   - Check your email service dashboard for any errors
   - Ensure your sender email is verified

3. **No emails received**
   - Check spam/junk folder
   - Verify the recipient email address
   - Check email service logs

### Environment Variable Setup

For different environments:

#### Development (.env.local)
```env
VITE_EMAIL_API_KEY=your_dev_api_key
VITE_FROM_EMAIL=noreply@yourdomain.com
```

#### Production (Netlify/other hosting)
Set these in your hosting platform's environment variables section.

## Security Considerations

1. **API Key Security**: Never commit API keys to version control
2. **Rate Limiting**: Email services have rate limits
3. **Domain Verification**: Verify your sending domain with your email service
4. **Error Handling**: The system gracefully handles email failures

## Cost Considerations

- **Resend**: 3,000 emails/month free
- **SendGrid**: 100 emails/day free
- **Other services**: Check their pricing pages

## Next Steps

1. Choose an email service (Resend recommended)
2. Set up your account and get API keys
3. Add environment variables
4. Test the notification system
5. Monitor email delivery and adjust as needed

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your email service configuration
3. Test with a simple email first
4. Check your email service's documentation