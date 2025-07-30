import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const {
      provider,
      apiKey,
      fromEmail,
      fromName,
      toEmail,
      subject,
      html,
      text
    } = req.body;

    console.log('Email request received:', {
      provider,
      fromEmail,
      toEmail,
      subject
    });

    if (!provider || !apiKey || !fromEmail || !toEmail || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    let result;

    if (provider === 'resend') {
      result = await sendViaResend({
        apiKey,
        fromEmail,
        fromName,
        toEmail,
        subject,
        html,
        text
      });
    } else if (provider === 'sendgrid') {
      result = await sendViaSendGrid({
        apiKey,
        fromEmail,
        fromName,
        toEmail,
        subject,
        html,
        text
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported provider: ${provider}`
      });
    }

    if (result.success) {
      console.log('Email sent successfully:', result.messageId);
      res.json({
        success: true,
        messageId: result.messageId
      });
    } else {
      console.error('Email sending failed:', result.error);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Email API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

async function sendViaResend({ apiKey, fromEmail, fromName, toEmail, subject, html, text }) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [toEmail],
        subject: subject,
        html: html,
        text: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Resend API error: ${error}` };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send email via Resend: ${error.message}`
    };
  }
}

async function sendViaSendGrid({ apiKey, fromEmail, fromName, toEmail, subject, html, text }) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: toEmail }],
          },
        ],
        from: { email: fromEmail, name: fromName },
        subject: subject,
        content: [
          {
            type: 'text/html',
            value: html,
          },
          {
            type: 'text/plain',
            value: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `SendGrid API error: ${error}` };
    }

    return { success: true, messageId: `sg_${Date.now()}` };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send email via SendGrid: ${error.message}`
    };
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Email API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Email endpoint: http://localhost:${PORT}/api/send-email`);
});

export default app; 