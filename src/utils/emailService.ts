// Email service for sending beta invite notifications
// This service can be configured to work with various email providers

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'nodemailer' | 'supabase';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  baseUrl?: string;
}

export interface BetaInviteEmailData {
  toEmail: string;
  inviteId: string;
  invitedBy?: string;
  expiresAt?: string;
  signupUrl: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private config: EmailConfig | null = null;
  private isInitialized = false;

  initialize(config: EmailConfig): void {
    this.config = config;
    this.isInitialized = true;
    console.log('Email service initialized with provider:', config.provider);
  }

  private validateConfig(): boolean {
    if (!this.isInitialized || !this.config) {
      console.error('Email service not initialized');
      return false;
    }
    return true;
  }

  private async sendViaResend(data: BetaInviteEmailData): Promise<EmailResult> {
    if (!this.config?.apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }

    try {
      // For now, send to verified email with forwarding info
      const verifiedEmail = 'dan.northington@gmail.com';
      const subject = `[BETA INVITE] Forward to: ${data.toEmail} - You're invited to join our beta! 🚀`;
      
      console.log('Generating beta invite HTML template...');
      const betaInviteHtml = this.generateBetaInviteEmailHTML(data);
      console.log('Beta invite HTML template length:', betaInviteHtml.length);
      
      // Create a simpler, more deliverable version
      const simpleHtml = `
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin: 20px 0; font-size: 14px; color: #6c757d;">
          <strong>📧 Forwarding Instructions:</strong><br>
          Beta invite recipient: <strong>${data.toEmail}</strong><br>
          Invite ID: ${data.inviteId}
        </div>
        <div style="background: #3B82F6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="margin: 0; font-size: 24px;">🚀 You are Invited!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to our exclusive beta program</p>
        </div>
        <div style="padding: 20px; background: white;">
          <h2 style="color: #1E293B; margin-bottom: 16px;">Hello!</h2>
          <p style="color: #64748B; margin-bottom: 24px; line-height: 1.6;">
            You have been invited to join our exclusive beta program for the <strong>Job Search Tracker</strong> - 
            a powerful tool designed to help knowledge workers manage their job applications effectively.
          </p>
          <div style="background: #FEF3C7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <strong style="color: #92400E; display: block; margin-bottom: 16px;">What you will get:</strong>
            <ul style="color: #92400E; margin: 0; padding: 0; list-style: none;">
              <li style="margin-bottom: 8px;">📊 Track all your job applications in one place</li>
              <li style="margin-bottom: 8px;">🏢 Organize applications by company and position</li>
              <li style="margin-bottom: 8px;">📈 Monitor application status and progress</li>
              <li style="margin-bottom: 8px;">💼 Professional profile management</li>
              <li style="margin-bottom: 8px;">🔍 Advanced search and filtering</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.signupUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 999px; font-weight: 500; font-size: 16px; box-shadow: 0 1px 4px rgba(30,41,59,0.08);">
              Join Beta Now
            </a>
          </div>
          <p style="text-align: center; color: #94A3B8; font-size: 14px; margin-top: 30px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #F8FAFC; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 14px;">
          <p style="margin: 4px 0;">This invite was sent by ${data.invitedBy || 'our admin team'}</p>
          <p style="margin: 4px 0;">Job Search Tracker Beta Program</p>
        </div>
      `;

      console.log('Final HTML length:', simpleHtml.length);
      console.log('HTML preview (first 200 chars):', simpleHtml.substring(0, 200));

      const forwardingText = `
📧 FORWARDING INSTRUCTIONS:
Beta invite recipient: ${data.toEmail}
Invite ID: ${data.inviteId}

${this.generateBetaInviteEmailText(data)}
      `;

      // Use a server-side proxy to avoid CORS issues
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'resend',
          apiKey: this.config.apiKey,
          fromEmail: this.config.fromEmail,
          fromName: this.config.fromName,
          toEmail: verifiedEmail,
          subject,
          html: simpleHtml,
          text: forwardingText,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Email service error: ${error}` };
      }

      const result = await response.json();
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return {
        success: false,
        error: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async sendViaSendGrid(data: BetaInviteEmailData): Promise<EmailResult> {
    if (!this.config?.apiKey) {
      return { success: false, error: 'SendGrid API key not configured' };
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'sendgrid',
          apiKey: this.config.apiKey,
          fromEmail: this.config.fromEmail,
          fromName: this.config.fromName,
          toEmail: data.toEmail,
          subject: 'You\'re invited to join our beta! 🚀',
          html: this.generateBetaInviteEmailHTML(data),
          text: this.generateBetaInviteEmailText(data),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Email service error: ${error}` };
      }

      const result = await response.json();
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return {
        success: false,
        error: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async sendViaSupabase(): Promise<EmailResult> {
    // This would use Supabase's built-in email service if available
    // For now, we'll return an error indicating it's not implemented
    return {
      success: false,
      error: 'Supabase email service not implemented yet. Please use Resend or SendGrid.'
    };
  }

  private async sendViaNodemailer(): Promise<EmailResult> {
    // This would be implemented on the server side
    // For now, we'll return an error indicating it's not implemented
    return {
      success: false,
      error: 'Nodemailer requires server-side implementation. Please use Resend or SendGrid.'
    };
  }

  async sendBetaInviteEmail(data: BetaInviteEmailData): Promise<EmailResult> {
    if (!this.validateConfig()) {
      return { success: false, error: 'Email service not properly configured' };
    }

    const provider = this.config!.provider;

    switch (provider) {
      case 'resend':
        return await this.sendViaResend(data);
      case 'sendgrid':
        return await this.sendViaSendGrid(data);
      case 'supabase':
        return await this.sendViaSupabase();
      case 'nodemailer':
        return await this.sendViaNodemailer();
      default:
        return { success: false, error: `Unsupported email provider: ${provider}` };
    }
  }

  private generateBetaInviteEmailHTML(data: BetaInviteEmailData): string {
    const expiryText = data.expiresAt
      ? `This invite expires on ${new Date(data.expiresAt).toLocaleDateString()}.`
      : 'This invite has no expiration date.';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Beta Invite - Job Search Tracker</title>
        <style>
          /* Reset and base styles */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #1E293B; 
            background-color: #F3F4F6;
            margin: 0;
            padding: 0;
          }
          
          /* Container */
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #FFF;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.10);
          }
          
          /* Header */
          .header { 
            background: linear-gradient(135deg, #3B82F6 0%, #2563eb 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #FFF;
          }
          
          .header p {
            font-size: 16px;
            opacity: 0.9;
            color: #FFF;
          }
          
          /* Content */
          .content { 
            background: #FFF; 
            padding: 40px 30px; 
          }
          
          .content h2 {
            font-size: 24px;
            font-weight: 600;
            color: #1E293B;
            margin-bottom: 16px;
          }
          
          .content p {
            font-size: 16px;
            color: #64748B;
            margin-bottom: 24px;
            line-height: 1.6;
          }
          
          /* Feature highlight box */
          .highlight { 
            background: #FEF3C7; 
            padding: 24px; 
            border-radius: 6px; 
            margin: 24px 0; 
            border-left: 4px solid #F59E0B;
          }
          
          .highlight strong {
            color: #92400E;
            font-weight: 600;
            font-size: 18px;
            display: block;
            margin-bottom: 16px;
          }
          
          .highlight ul {
            list-style: none;
            padding: 0;
          }
          
          .highlight li {
            color: #92400E;
            font-size: 16px;
            margin-bottom: 12px;
            padding-left: 0;
          }
          
          /* Button */
          .button { 
            display: inline-block; 
            background: #3B82F6; 
            color: #FFF !important; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 999px; 
            font-weight: 500; 
            font-size: 16px;
            margin: 24px 0; 
            box-shadow: 0 1px 4px rgba(30,41,59,0.08);
            transition: background 0.2s, box-shadow 0.2s;
          }
          
          .button:hover {
            background: #2563eb !important;
            box-shadow: 0 2px 8px rgba(59,130,246,0.16);
          }
          
          /* Expiry text */
          .expiry-text {
            background: #F1F5F9;
            padding: 16px;
            border-radius: 6px;
            margin: 24px 0;
            text-align: center;
            color: #64748B;
            font-size: 14px;
            font-weight: 500;
          }
          
          /* Support text */
          .support-text {
            margin-top: 32px;
            font-size: 14px;
            color: #94A3B8;
            text-align: center;
          }
          
          /* Footer */
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding: 24px 30px;
            background: #F8FAFC;
            border-top: 1px solid #E2E8F0;
            color: #64748B; 
            font-size: 14px; 
          }
          
          .footer p {
            margin: 4px 0;
            color: #64748B;
          }
          
          /* Mobile responsiveness */
          @media (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .header, .content { padding: 24px 20px; }
            .header h1 { font-size: 24px; }
            .content h2 { font-size: 20px; }
            .button { padding: 14px 28px; font-size: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 You're Invited!</h1>
            <p>Welcome to our exclusive beta program</p>
          </div>

          <div class="content">
            <h2>Hello!</h2>
            <p>You've been invited to join our exclusive beta program for the <strong>Job Search Tracker</strong> - a powerful tool designed to help knowledge workers manage their job applications effectively.</p>

            <div class="highlight">
              <strong>What you'll get:</strong>
              <ul>
                <li>📊 Track all your job applications in one place</li>
                <li>🏢 Organize applications by company and position</li>
                <li>📈 Monitor application status and progress</li>
                <li>💼 Professional profile management</li>
                <li>🔍 Advanced search and filtering</li>
              </ul>
            </div>

            <div class="expiry-text">
              <strong>${expiryText}</strong>
            </div>

            <div style="text-align: center;">
              <a href="${data.signupUrl}" class="button">Join Beta Now</a>
            </div>

            <p class="support-text">
              If you have any questions, feel free to reach out to our support team.
            </p>
          </div>

          <div class="footer">
            <p>This invite was sent by ${data.invitedBy || 'our admin team'}</p>
            <p>Job Search Tracker Beta Program</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateBetaInviteEmailText(data: BetaInviteEmailData): string {
    const expiryText = data.expiresAt
      ? `This invite expires on ${new Date(data.expiresAt).toLocaleDateString()}.`
      : 'This invite has no expiration date.';

    return `
🚀 You're Invited to Join Our Beta!

Hello!

You've been invited to join our exclusive beta program for the Job Search Tracker - a powerful tool designed to help knowledge workers manage their job applications effectively.

What you'll get:
- Track all your job applications in one place
- Organize applications by company and position
- Monitor application status and progress
- Professional profile management
- Advanced search and filtering

${expiryText}

Join Beta Now: ${data.signupUrl}

If you have any questions, feel free to reach out to our support team.

This invite was sent by ${data.invitedBy || 'our admin team'}

Job Search Tracker Beta Program
    `.trim();
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Helper function to initialize email service with environment variables
export function initializeEmailService(): void {
  console.log('Initializing email service...');
  
  const provider = (import.meta.env.VITE_EMAIL_PROVIDER as EmailConfig['provider']) || 'resend';
  const apiKey = import.meta.env.VITE_EMAIL_API_KEY;
  const fromEmail = import.meta.env.VITE_EMAIL_FROM || 'noreply@yourdomain.com';
  const fromName = import.meta.env.VITE_EMAIL_FROM_NAME || 'Job Search Tracker';

  console.log('Email service config:', {
    provider,
    apiKey: apiKey ? 'SET' : 'NOT SET',
    fromEmail,
    fromName
  });

  if (!apiKey) {
    console.warn('Email API key not configured. Email notifications will be disabled.');
    return;
  }

  emailService.initialize({
    provider,
    apiKey,
    fromEmail,
    fromName,
  });
  
  console.log('Email service initialized successfully');
}

// Helper function to send beta invite email
export async function sendBetaInviteEmail(
  toEmail: string,
  inviteId: string,
  invitedBy?: string,
  expiresAt?: string
): Promise<EmailResult> {
  console.log('sendBetaInviteEmail called with:', { toEmail, inviteId, invitedBy, expiresAt });
  
  const signupUrl = `${window.location.origin}/signup?invite=${inviteId}`;
  console.log('Generated signup URL:', signupUrl);

  const result = await emailService.sendBetaInviteEmail({
    toEmail,
    inviteId,
    invitedBy,
    expiresAt,
    signupUrl,
  });
  
  console.log('Email service result:', result);
  return result;
} 