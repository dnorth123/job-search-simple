interface EmailNotificationData {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

interface BetaUserNotificationData {
  adminEmail: string;
  newBetaUsers: string[];
  totalCount: number;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private isEnabled: boolean;

  constructor() {
    // Get email service configuration from environment variables
    this.apiKey = import.meta.env.VITE_EMAIL_API_KEY || '';
    this.fromEmail = import.meta.env.VITE_FROM_EMAIL || 'noreply@yourdomain.com';
    this.isEnabled = !!this.apiKey && !!this.fromEmail;
    
    if (!this.isEnabled) {
      console.warn('Email service not configured. Set VITE_EMAIL_API_KEY and VITE_FROM_EMAIL environment variables.');
    }
  }

  /**
   * Send email notification about new beta users
   */
  async sendBetaUserNotification(data: BetaUserNotificationData): Promise<boolean> {
    if (!this.isEnabled) {
      console.warn('Email service not enabled, skipping notification');
      return false;
    }

    const subject = `New Beta Users Added - ${data.newBetaUsers.length} new invite(s)`;
    const body = this.generateBetaUserNotificationBody(data);
    const html = this.generateBetaUserNotificationHTML(data);

    return this.sendEmail({
      to: data.adminEmail,
      subject,
      body,
      html
    });
  }

  /**
   * Generate plain text email body for beta user notifications
   */
  private generateBetaUserNotificationBody(data: BetaUserNotificationData): string {
    const date = new Date().toLocaleString();
    const userList = data.newBetaUsers.join('\n- ');
    
    return `New Beta Users Added

Date: ${date}
Total Beta Users: ${data.totalCount}
New Users Added: ${data.newBetaUsers.length}

New Beta Users:
- ${userList}

You can view all beta invites in the admin interface.

Best regards,
Your Application Team`;
  }

  /**
   * Generate HTML email body for beta user notifications
   */
  private generateBetaUserNotificationHTML(data: BetaUserNotificationData): string {
    const date = new Date().toLocaleString();
    const userList = data.newBetaUsers.map(email => `<li>${email}</li>`).join('');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Beta Users Added</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .stats { background-color: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .user-list { background-color: #f8f9fa; padding: 15px; border-radius: 8px; }
            .user-list ul { margin: 0; padding-left: 20px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #495057;">New Beta Users Added</h1>
            </div>
            
            <div class="stats">
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Total Beta Users:</strong> ${data.totalCount}</p>
              <p><strong>New Users Added:</strong> ${data.newBetaUsers.length}</p>
            </div>
            
            <div class="user-list">
              <h3>New Beta Users:</h3>
              <ul>
                ${userList}
              </ul>
            </div>
            
            <div class="footer">
              <p>You can view all beta invites in the admin interface.</p>
              <p>Best regards,<br>Your Application Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send email using the configured email service
   */
  private async sendEmail(data: EmailNotificationData): Promise<boolean> {
    try {
      // Try to use Resend API if available
      if (this.apiKey.startsWith('re_')) {
        return await this.sendWithResend(data);
      }
      
      // Try to use SendGrid API if available
      if (this.apiKey.startsWith('SG.')) {
        return await this.sendWithSendGrid(data);
      }
      
      // Fallback to generic API endpoint
      return await this.sendWithGenericAPI(data);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  /**
   * Send email using Resend API
   */
  private async sendWithResend(data: EmailNotificationData): Promise<boolean> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to: [data.to],
        subject: data.subject,
        text: data.body,
        html: data.html
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Resend API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    console.log('Email notification sent successfully via Resend');
    return true;
  }

  /**
   * Send email using SendGrid API
   */
  private async sendWithSendGrid(data: EmailNotificationData): Promise<boolean> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: data.to }]
          }
        ],
        from: { email: this.fromEmail },
        subject: data.subject,
        content: [
          {
            type: 'text/plain',
            value: data.body
          },
          ...(data.html ? [{
            type: 'text/html',
            value: data.html
          }] : [])
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`SendGrid API error: ${response.status} - ${errorData.errors?.[0]?.message || 'Unknown error'}`);
    }

    console.log('Email notification sent successfully via SendGrid');
    return true;
  }

  /**
   * Send email using generic API endpoint
   */
  private async sendWithGenericAPI(data: EmailNotificationData): Promise<boolean> {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        to: data.to,
        from: this.fromEmail,
        subject: data.subject,
        text: data.body,
        html: data.html
      })
    });

    if (!response.ok) {
      throw new Error(`Email service responded with status: ${response.status}`);
    }

    console.log('Email notification sent successfully via generic API');
    return true;
  }

  /**
   * Check if email service is properly configured
   */
  isConfigured(): boolean {
    return this.isEnabled;
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus(): { enabled: boolean; hasApiKey: boolean; hasFromEmail: boolean } {
    return {
      enabled: this.isEnabled,
      hasApiKey: !!this.apiKey,
      hasFromEmail: !!this.fromEmail
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types for use in other files
export type { EmailNotificationData, BetaUserNotificationData };