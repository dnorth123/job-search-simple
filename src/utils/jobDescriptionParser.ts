import type { RemotePolicy, ApplicationSource } from '../jobTypes';

export interface ParsedJobData {
  position?: string;
  company?: string;
  location?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  remote_policy?: RemotePolicy;
  application_source?: ApplicationSource;
  job_req_id?: string;
  benefits_mentioned?: string;
  equity_offered?: boolean;
  equity_details?: string;
  notes?: string;
}

export function parseJobDescription(text: string): ParsedJobData {
  const data: ParsedJobData = {};
  
  // Convert to lowercase for easier matching
  const lowerText = text.toLowerCase();
  
  // Extract position title (usually at the beginning)
  const positionPatterns = [
    /^#\s*(.*?)(?:\s*$|\n)/m, // Markdown heading
    /^(.*?)(?:at|@|job|position|role|opportunity)/i,
    /(?:position|role|title):\s*(.*?)(?:\n|$)/i,
    // New patterns for different formats
    /^([A-Z][A-Za-z\s-]+(?:Director|Manager|Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Lead|Senior|Junior|Associate|Assistant|Intern))(?:\s*$|\n)/m,
    /([A-Z][A-Za-z\s-]+(?:Director|Manager|Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Lead|Senior|Junior|Associate|Assistant|Intern))(?:\s*Apply\s*$|\n)/m,
    // Look for job titles in the first few lines
    /^([A-Z][A-Za-z\s-]+(?:Director|Manager|Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Lead|Senior|Junior|Associate|Assistant|Intern))/m,
    // Look for job titles anywhere in the text (for Home Depot format)
    /([A-Z][A-Za-z\s-]+(?:Director|Manager|Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Lead|Senior|Junior|Associate|Assistant|Intern)(?:\s*-\s*[A-Za-z\s,]+)*)/g
  ];
  
  for (const pattern of positionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      // Filter out very short titles or common words
      if (title.length > 5 && !title.toLowerCase().includes('skip to content')) {
        data.position = title;
        break;
      }
    }
  }
  
  // If no position found with patterns, try to find it in the text
  if (!data.position) {
    // Look for common job title patterns in the entire text
    const titleMatch = text.match(/([A-Z][A-Za-z\s-]+(?:Director|Manager|Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Lead|Senior|Junior|Associate|Assistant|Intern)(?:\s*-\s*[A-Za-z\s,]+)*)/);
    if (titleMatch && titleMatch[1]) {
      const title = titleMatch[1].trim();
      if (title.length > 10 && !title.toLowerCase().includes('skip to content')) {
        data.position = title;
      }
    }
  }
  
  // Special handling for Home Depot format
  if (!data.position || data.position.includes('About the company')) {
    // Look for the pattern: Sign In\n[Job Title]\nApply
    const homeDepotMatch = text.match(/Sign In\s*\n\s*([A-Z][A-Za-z\s-]+(?:Director|Manager|Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Lead|Senior|Junior|Associate|Assistant|Intern)(?:\s*-\s*[A-Za-z\s,]+)*)\s*\n\s*Apply/);
    if (homeDepotMatch && homeDepotMatch[1]) {
      const title = homeDepotMatch[1].trim();
      if (title.length > 10) {
        data.position = title;
      }
    }
  }
  
  // Special handling for company extraction
  if (!data.company || data.company.includes('About the company')) {
    if (text.includes('The Home Depot')) {
      data.company = 'The Home Depot';
    } else if (text.includes('Home Depot')) {
      data.company = 'Home Depot';
    }
  }
  
  // Extract company (if not already found)
  if (!data.company) {
    const companyPatterns = [
      /(?:company|employer|organization):\s*([A-Za-z\s&.,]+?)(?:\n|$|\.)/gi,
      /(?:at|with|for)\s+([A-Za-z\s&.,]+?)(?:\s+we|$|\.)/gi,
      /(?:join|work at|work for)\s+([A-Za-z\s&.,]+?)(?:\s+as|$|\.)/gi,
      /(?:position at|role at)\s+([A-Za-z\s&.,]+?)(?:\s+in|$|\.)/gi,
      /(?:careers at|jobs at)\s+([A-Za-z\s&.,]+?)(?:\s+in|$|\.)/gi,
      /(?:The Home Depot|Home Depot)/gi
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        // Filter out very short company names or common words
        if (company.length > 3 && !company.toLowerCase().includes('skip to content')) {
          data.company = company;
          break;
        }
      }
    }
  }
  
  // Extract Job Req ID (improved patterns)
  if (!data.job_req_id) {
    const reqIdPatterns = [
      /Job ID –\s*(Req\d+)/gi,
      /Job ID –\s*(Req\d+)/gi,
      /req id:\s*(\d+)/gi,
      /requisition id:\s*(\d+)/gi,
      /job id:\s*(\d+)/gi,
      /position id:\s*(\d+)/gi,
      /req #:\s*(\d+)/gi,
      /requisition #:\s*(\d+)/gi,
      /job #:\s*(\d+)/gi
    ];

    for (const pattern of reqIdPatterns) {
      const match = text.match(pattern);
      if (match) {
        // For patterns with capture groups, use match[1]
        if (match[1]) {
          data.job_req_id = match[1];
        } else {
          // For patterns without capture groups, extract the Req number
          const reqMatch = match[0].match(/Req\d+/);
          if (reqMatch) {
            data.job_req_id = reqMatch[0];
          }
        }
        break;
      }
    }
  }
  
  // Extract location (if not already found)
  if (!data.location) {
    const locationPatterns = [
      /Location –\s*([A-Za-z\s,]+?)(?:\n|$)/gi,
      /(?:location|based in|headquartered in|office in):\s*([A-Za-z\s,]+?)(?:\s|$|,|\.)/gi,
      /(?:remote|hybrid|on-site|in-office).*?([A-Za-z\s,]+?)(?:\s|$|,|\.)/gi,
      /(?:work from|work in|office located in):\s*([A-Za-z\s,]+?)(?:\s|$|,|\.)/gi,
      /(?:location|remote opportunities):\s*\*\*([^*]+)\*\*/gi, // Markdown bold
      /(?:location|remote opportunities):\s*([A-Za-z\s,]+?)(?:\n|$)/gi,
      // New patterns for different formats
      /Store Location\s*\n\s*(\d+)\s*\n\s*([A-Za-z\s,]+?)(?:\n|$)/gi,
      /([A-Za-z\s,]+?),\s*([A-Z]{2})(?:\s|$|,|\.)/g,
      /Atlanta,\s*GA/gi
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        // Filter out common non-location words and very short locations
        const invalidWords = ['hybrid', 'remote', 'on-site', 'skip to content', 'apply', 'overview', 'benefits', 'store location', 'work location'];
        const isInvalid = invalidWords.some(word => location.toLowerCase().includes(word));
        
        if (location.length > 3 && location.length < 50 && !isInvalid) {
          data.location = location;
          break;
        }
      }
    }
  }
  
    // Extract salary information
  const salaryPatterns = [
    /salary range:\s*\*\*\$?([0-9,]+\.?[0-9]*)(?:\s*to\s*\$?([0-9,]+\.?[0-9]*))?\*\*/gi, // Markdown bold with "to"
    /salary range:\s*\*\*\$?([0-9,]+\.?[0-9]*)(?:\s*-\s*\$?([0-9,]+\.?[0-9]*))?\*\*/gi, // Markdown bold with "-"
    /salary range:\s*\$?([0-9,]+\.?[0-9]*)(?:\s*to\s*\$?([0-9,]+\.?[0-9]*))?/gi, // Plain text with "to"
    /salary range:\s*\$?([0-9,]+\.?[0-9]*)(?:\s*-\s*\$?([0-9,]+\.?[0-9]*))?/gi, // Plain text with "-"
    /(?:salary|compensation|pay|base salary):\s*\$?([0-9,]+\.?[0-9]*)(?:\s*-\s*\$?([0-9,]+\.?[0-9]*))?/gi,
    /\$([0-9,]+\.?[0-9]*)(?:\s*-\s*\$([0-9,]+\.?[0-9]*))?\s*(?:per year|annually|yearly)/gi,
    /(?:range|salary range):\s*\$?([0-9,]+\.?[0-9]*)(?:\s*-\s*\$?([0-9,]+\.?[0-9]*))?/gi
  ];

  for (const pattern of salaryPatterns) {
    const match = text.match(pattern);
    if (match) {
      const min = parseInt(match[1].replace(/,/g, ''));
      const max = match[2] ? parseInt(match[2].replace(/,/g, '')) : 
                  match[3] ? parseInt(match[3].replace(/,/g, '')) : min;
      if (min) {
        data.salary_range_min = min;
        data.salary_range_max = max;
        break;
      }
    }
  }
  
  // Extract remote policy
  if (lowerText.includes('remote') || lowerText.includes('work from home')) {
    if (lowerText.includes('hybrid') || lowerText.includes('partially remote')) {
      data.remote_policy = 'Hybrid';
    } else if (lowerText.includes('on-site') || lowerText.includes('in-office') || lowerText.includes('in person')) {
      data.remote_policy = 'On-site';
    } else {
      data.remote_policy = 'Remote';
    }
  }
  
  // Extract benefits
  const benefitsPatterns = [
    /(?:benefits|perks|compensation package):\s*([^.]*)/gi,
    // Look for specific benefit mentions in context
    /(?:health|dental|vision)\s+(?:insurance|benefits|coverage)/gi,
    /(?:401k|retirement)\s+(?:plan|benefits|matching)/gi,
    /(?:pto|vacation|holiday)\s+(?:time|benefits|policy)/gi,
    // Look for benefits sections
    /(?:benefits|perks|compensation)\s+(?:include|offered|provided)/gi,
    // Home Depot specific benefits
    /Paid parental leave/gi,
    /401\(K\) savings plan/gi,
    /Merit increases/gi,
    /performance bonuses/gi,
    /Bonus Eligible/gi,
    /401\(k\) Company Matching/gi,
    /Employee Stock Purchase Program/gi,
    /On-the-spot recognition/gi
  ];
  
  const benefits: string[] = [];
  for (const pattern of benefitsPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      // Filter out matches that are too generic
      const filteredMatches = matches.filter(match => {
        const lowerMatch = match.toLowerCase();
        // Avoid matching single words that might appear in other contexts
        if (lowerMatch === 'vision' || lowerMatch === 'health' || lowerMatch === 'dental') {
          return false;
        }
        return true;
      });
      benefits.push(...filteredMatches);
    }
  }
  
  if (benefits.length > 0) {
    data.benefits_mentioned = benefits.join(', ');
  }
  
  // Extract equity information
  if (lowerText.includes('equity') || lowerText.includes('stock options') || lowerText.includes('rsu')) {
    data.equity_offered = true;
    
    const equityMatch = text.match(/(?:equity|stock options|rsu):\s*([^.]*)/gi);
    if (equityMatch) {
      data.equity_details = equityMatch.join(', ');
    }
  }
  
  // Extract application source hints
  const sourcePatterns = [
    /(?:apply|application|source):\s*(linkedin|indeed|glassdoor|company website|careers page)/gi,
    /(?:found|posted|sourced)\s+(?:on|via|through)\s+(linkedin|indeed|glassdoor|company website)/gi
  ];

  for (const pattern of sourcePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const source = match[1].toLowerCase();
      if (source.includes('linkedin')) {
        data.application_source = 'LinkedIn';
      } else if (source.includes('indeed')) {
        data.application_source = 'Indeed';
      } else if (source.includes('glassdoor')) {
        data.application_source = 'Glassdoor';
      } else if (source.includes('company website') || source.includes('careers page')) {
        data.application_source = 'Company Website';
      }
      break;
    }
  }

  // Fallback to simple text search
  if (!data.application_source) {
    if (lowerText.includes('linkedin')) {
      data.application_source = 'LinkedIn';
    } else if (lowerText.includes('indeed')) {
      data.application_source = 'Indeed';
    } else if (lowerText.includes('glassdoor')) {
      data.application_source = 'Glassdoor';
    } else if (lowerText.includes('company website') || lowerText.includes('careers page')) {
      data.application_source = 'Company Website';
    }
  }
  
    // Extract Job Req ID
  const reqIdPatterns = [
    /req id:\s*(\d+)/gi,
    /requisition id:\s*(\d+)/gi,
    /job id:\s*(\d+)/gi,
    /position id:\s*(\d+)/gi,
    /req #:\s*(\d+)/gi,
    /requisition #:\s*(\d+)/gi,
    /job #:\s*(\d+)/gi
  ];

  for (const pattern of reqIdPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.job_req_id = match[1];
      break;
    }
  }

  // Auto-set location to "Remote" if work policy is remote
  if (data.remote_policy === 'Remote' && !data.location) {
    data.location = 'Remote';
  }

  // Store original text as notes for reference
  data.notes = `Parsed from job description:\n\n${text}`;

  return data;
}

export function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

export function validateFile(file: File): boolean {
  const allowedTypes = [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const allowedExtensions = ['.txt', '.md', '.pdf', '.doc', '.docx'];

  const maxSize = 5 * 1024 * 1024; // 5MB

  // Debug logging to help identify the issue
  console.log('File validation:', {
    name: file.name,
    type: file.type,
    size: file.size,
    allowedTypes,
    allowedExtensions,
    isTypeAllowed: allowedTypes.includes(file.type),
    isSizeValid: file.size <= maxSize
  });

  // Check if file type is allowed OR if file extension is allowed (fallback)
  const isTypeValid = allowedTypes.includes(file.type) || 
    allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

  return isTypeValid && file.size <= maxSize;
}

export async function extractTextFromUrl(url: string): Promise<string> {
  try {
    // Validate URL format
    const urlObj = new URL(url);
    
    // For security, only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported');
    }

    // Try multiple approaches to fetch content
    let text = '';
    
    // Approach 1: Direct fetch (works for CORS-enabled sites)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobSearchBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      text = extractTextFromHtml(html);
      
      if (text.trim()) {
        return text;
      }
    } catch (fetchError) {
      console.warn('Direct fetch failed, trying alternative approach:', fetchError);
    }

    // Approach 2: Try with a CORS proxy (if available)
    // Note: In a production environment, you'd want to use a proper backend service
    // or CORS proxy service. For now, we'll provide a helpful error message.
    
    throw new Error(
      'Unable to fetch content from this URL due to CORS restrictions. ' +
      'Please try copying the job description text and pasting it directly, ' +
      'or upload the job description as a file. ' +
      'Alternatively, you can use browser extensions or tools that can bypass CORS restrictions.'
    );
    
  } catch (error) {
    console.error('Error fetching URL:', error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('CORS')) {
        throw new Error(
          'This website blocks external requests. Please copy the job description text and paste it directly, or upload the job description as a file.'
        );
      } else if (error.message.includes('404')) {
        throw new Error('The URL could not be found. Please check the URL and try again.');
      } else if (error.message.includes('403')) {
        throw new Error('Access to this URL is forbidden. Please copy the job description text and paste it directly.');
      } else {
        throw new Error(`Failed to fetch content from URL: ${error.message}`);
      }
    }
    
    throw new Error('Failed to fetch content from URL. Please try copying the text and pasting it directly.');
  }
}

function extractTextFromHtml(html: string): string {
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Remove script and style elements
  const scripts = doc.querySelectorAll('script, style, noscript, iframe, img, video, audio, nav, header, footer, aside');
  scripts.forEach(el => el.remove());
  
  // Try to find job-specific content first
  const jobSelectors = [
    '[class*="job"]',
    '[class*="position"]',
    '[class*="description"]',
    '[class*="posting"]',
    '[id*="job"]',
    '[id*="position"]',
    '[id*="description"]',
    '[id*="posting"]',
    'main',
    'article',
    '.content',
    '#content',
    '.main',
    '#main'
  ];
  
  let contentElement = null;
  for (const selector of jobSelectors) {
    try {
      const element = doc.querySelector(selector);
      if (element && element.textContent && element.textContent.trim().length > 100) {
        contentElement = element;
        break;
      }
    } catch {
      // Invalid selector, continue to next
    }
  }
  
  // If no job-specific content found, use body
  if (!contentElement) {
    contentElement = doc.querySelector('body');
  }
  
  if (!contentElement) {
    return '';
  }
  
  // Get text content and clean it up
  let text = contentElement.textContent || '';
  
  // Clean up whitespace and formatting
  text = text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .trim();
  
  // Remove common web page elements that aren't job content
  const unwantedPatterns = [
    /cookie/i,
    /privacy policy/i,
    /terms of service/i,
    /© \d{4}/i,
    /all rights reserved/i,
    /subscribe to our newsletter/i,
    /follow us on/i,
    /share this page/i,
    /back to top/i,
    /menu/i,
    /navigation/i,
    /search/i,
    /login/i,
    /sign up/i,
    /contact us/i,
    /about us/i,
    /careers/i,
    /home/i,
    /services/i,
    /products/i
  ];
  
  // Split into lines and filter out unwanted content
  const lines = text.split('\n').filter((line: string) => {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 10) return false; // Skip very short lines
    
    // Check if line contains unwanted patterns
    for (const pattern of unwantedPatterns) {
      if (pattern.test(trimmedLine)) {
        return false;
      }
    }
    
    return true;
  });
  
  return lines.join('\n').trim();
}

export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
} 