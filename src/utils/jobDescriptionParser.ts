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
    /(?:position|role|title):\s*(.*?)(?:\n|$)/i
  ];
  
  for (const pattern of positionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.position = match[1].trim();
      break;
    }
  }
  
    // Extract company name
  const companyPatterns = [
    /## About ([A-Z][A-Za-z\s&.,]+?)(?:\n|$)/gi, // Markdown section
    /about ([A-Z][A-Za-z\s&.,]+?)(?:\n|$)/gi, // Plain text about
    /(?:at|@|with|for)\s+([A-Z][A-Za-z\s&.,]+?)(?:\s|$|,|\.)/g,
    /(?:company|organization|firm):\s*([A-Z][A-Za-z\s&.,]+?)(?:\s|$|,|\.)/gi,
    /(?:about|about us|who we are).*?([A-Z][A-Za-z\s&.,]+?)(?:\s|$|,|\.)/gi,
    /(?:about|company):\s*([A-Z][A-Za-z\s&.,]+?)(?:\n|$)/gi
  ];

  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.company = match[1].trim();
      break;
    }
  }
  
    // Extract location
  const locationPatterns = [
    /(?:location|based in|headquartered in|office in):\s*([A-Za-z\s,]+?)(?:\s|$|,|\.)/gi,
    /(?:remote|hybrid|on-site|in-office).*?([A-Za-z\s,]+?)(?:\s|$|,|\.)/gi,
    /(?:work from|work in|office located in):\s*([A-Za-z\s,]+?)(?:\s|$|,|\.)/gi,
    /(?:location|remote opportunities):\s*\*\*([^*]+)\*\*/gi, // Markdown bold
    /(?:location|remote opportunities):\s*([A-Za-z\s,]+?)(?:\n|$)/gi
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.location = match[1].trim();
      break;
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
    /(?:health|dental|vision|insurance|401k|retirement|pto|vacation|holiday)/gi
  ];
  
  const benefits: string[] = [];
  for (const pattern of benefitsPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      benefits.push(...matches);
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