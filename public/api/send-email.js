// Simple API endpoint for sending emails
// This is a basic implementation - in production you'd use a proper email service

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, from, subject, text, html } = req.body;

    // Validate required fields
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    // In a real implementation, you would:
    // 1. Validate the API key against your email service
    // 2. Send the email using a service like SendGrid, Resend, etc.
    // 3. Handle the response and return appropriate status

    // For now, we'll simulate a successful email send
    console.log('Email would be sent:', {
      to,
      from,
      subject,
      text: text.substring(0, 100) + '...',
      html: html ? 'HTML content present' : 'No HTML'
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}