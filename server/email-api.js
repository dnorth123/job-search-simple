import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load from .env

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

// LinkedIn search endpoint with multiple search providers
app.post('/api/linkedin-search', async (req, res) => {
  try {
    const { companyName } = req.body;

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Invalid company name. Must be at least 2 characters.'
      });
    }

    console.log('LinkedIn search request for:', companyName);

    // Try multiple search providers in order
    const searchProviders = [
      () => searchWithBrave(companyName.trim()),
      () => searchWithSerper(companyName.trim()),
      () => searchWithBing(companyName.trim()),
      () => generateLinkedInGuess(companyName.trim())
    ];

    let results = [];
    let lastError = null;

    for (let i = 0; i < searchProviders.length; i++) {
      try {
        console.log(`Trying search provider ${i + 1}...`);
        results = await searchProviders[i]();
        if (results.length > 0) {
          console.log(`Provider ${i + 1} returned ${results.length} results`);
          break;
        }
      } catch (error) {
        console.log(`Provider ${i + 1} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (results.length === 0 && lastError) {
      throw lastError;
    }

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);
    
    console.log('Final processed results:', results.length);

    res.json({
      success: true,
      results,
      searchTerm: companyName.trim()
    });

  } catch (error) {
    console.error('LinkedIn search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search provider functions
async function searchWithBrave(companyName) {
  const braveApiKey = process.env.VITE_BRAVE_SEARCH_API_KEY;
  if (!braveApiKey) {
    throw new Error('Brave Search API key not configured');
  }

  const searchQuery = `site:linkedin.com/company ${companyName}`;
  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}`, {
    headers: {
      'X-Subscription-Token': braveApiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Brave API rate limit exceeded');
    }
    throw new Error(`Brave API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return processBraveResults(data.web?.results || [], companyName);
}

async function searchWithSerper(companyName) {
  const serperApiKey = process.env.SERPER_API_KEY;
  if (!serperApiKey) {
    throw new Error('Serper API key not configured');
  }

  const searchQuery = `site:linkedin.com/company ${companyName}`;
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': serperApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: searchQuery,
      num: 5
    })
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return processSerperResults(data.organic || [], companyName);
}

async function searchWithBing(companyName) {
  const bingApiKey = process.env.BING_SEARCH_API_KEY;
  if (!bingApiKey) {
    throw new Error('Bing Search API key not configured');
  }

  const searchQuery = `site:linkedin.com/company ${companyName}`;
  const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(searchQuery)}&count=10`, {
    headers: {
      'Ocp-Apim-Subscription-Key': bingApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Bing API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return processBingResults(data.webPages?.value || [], companyName);
}

// Result processors for different APIs
function processBraveResults(webResults, companyName) {
  const results = [];
  
  for (let i = 0; i < Math.min(webResults.length, 3); i++) {
    const result = webResults[i];
    
    if (!result.url.includes('linkedin.com/company/')) {
      continue;
    }
    
    const extractedCompanyName = extractCompanyName(result.title, result.description);
    const vanityName = extractVanityName(result.url);
    const confidence = calculateConfidence(result, companyName, i === 0);
    
    results.push({
      url: result.url,
      companyName: extractedCompanyName,
      vanityName,
      description: decodeHtmlEntities(result.description.substring(0, 200)),
      confidence: Math.round(confidence * 100) / 100,
    });
  }
  
  return results;
}

function processSerperResults(webResults, companyName) {
  const results = [];
  
  for (let i = 0; i < Math.min(webResults.length, 3); i++) {
    const result = webResults[i];
    
    if (!result.link || !result.link.includes('linkedin.com/company/')) {
      continue;
    }
    
    const extractedCompanyName = extractCompanyName(result.title || '', result.snippet || '');
    const vanityName = extractVanityName(result.link);
    const confidence = calculateConfidence({
      title: result.title || '',
      description: result.snippet || '',
      url: result.link
    }, companyName, i === 0);
    
    results.push({
      url: result.link,
      companyName: extractedCompanyName,
      vanityName,
      description: decodeHtmlEntities((result.snippet || '').substring(0, 200)),
      confidence: Math.round(confidence * 100) / 100,
    });
  }
  
  return results;
}

function processBingResults(webResults, companyName) {
  const results = [];
  
  for (let i = 0; i < Math.min(webResults.length, 3); i++) {
    const result = webResults[i];
    
    if (!result.url.includes('linkedin.com/company/')) {
      continue;
    }
    
    const extractedCompanyName = extractCompanyName(result.name, result.snippet);
    const vanityName = extractVanityName(result.url);
    const confidence = calculateConfidence({
      title: result.name,
      description: result.snippet,
      url: result.url
    }, companyName, i === 0);
    
    results.push({
      url: result.url,
      companyName: extractedCompanyName,
      vanityName,
      description: decodeHtmlEntities(result.snippet.substring(0, 200)),
      confidence: Math.round(confidence * 100) / 100,
    });
  }
  
  return results;
}

async function generateLinkedInGuess(companyName) {
  // Generate educated guesses for LinkedIn company URLs
  const cleanName = companyName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  const variations = [
    cleanName,
    cleanName.replace(/-/g, ''), // Remove all hyphens
    companyName.toLowerCase().replace(/\s+/g, ''), // Remove all spaces, keep original
    companyName.toLowerCase().split(' ')[0] // Just first word
  ];

  const results = [];
  
  variations.forEach((variation, index) => {
    if (variation && variation.length > 1) {
      results.push({
        url: `https://www.linkedin.com/company/${variation}`,
        companyName: companyName,
        vanityName: variation,
        description: `Suggested LinkedIn page for ${companyName}`,
        confidence: Math.max(0.3 - (index * 0.05), 0.15) // Decreasing confidence for each variation
      });
    }
  });

  return results.slice(0, 2); // Return top 2 guesses
}

// Helper functions for LinkedIn search
function extractVanityName(url) {
  try {
    const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/i);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

function decodeHtmlEntities(text) {
  const entityMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#x27;': "'",
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  // First decode HTML entities
  let decoded = text.replace(/&[#\w]+;/g, (entity) => entityMap[entity] || entity);
  
  // Then remove HTML tags
  decoded = decoded.replace(/<[^>]*>/g, '');
  
  // Clean up extra spaces
  decoded = decoded.replace(/\s+/g, ' ').trim();
  
  return decoded;
}

function extractCompanyName(title, description) {
  // Decode HTML entities first
  const cleanTitle = decodeHtmlEntities(title);
  const cleanDescription = decodeHtmlEntities(description);
  
  // Try to extract company name from title (usually comes before " | LinkedIn")
  const titleMatch = cleanTitle.match(/^([^|]+)(?:\s*\|\s*LinkedIn)?/);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Fallback to first words of description
  const descWords = cleanDescription.split(' ').slice(0, 3).join(' ');
  return descWords.length > 0 ? descWords : 'Unknown Company';
}

function calculateConfidence(result, searchTerm, isFirstResult) {
  let confidence = 0.6; // Base confidence for valid LinkedIn company URL
  
  const companyName = extractCompanyName(result.title, result.description);
  const vanityName = extractVanityName(result.url);
  
  // +0.25 if company name matches search term (case insensitive)
  if (companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchTerm.toLowerCase().includes(companyName.toLowerCase().split(' ')[0])) {
    confidence += 0.25;
  }
  
  // +0.10 if first result
  if (isFirstResult) {
    confidence += 0.10;
  }
  
  // +0.05 if URL contains search term as slug
  if (vanityName.toLowerCase().includes(searchTerm.toLowerCase().replace(/\s+/g, ''))) {
    confidence += 0.05;
  }
  
  // Cap at 0.95 maximum
  return Math.min(confidence, 0.95);
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