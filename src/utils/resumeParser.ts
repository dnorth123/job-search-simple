import type { IndustryCategory, CareerLevel } from '../jobTypes';

export interface ParsedResumeData {
  first_name?: string;
  last_name?: string;
  professional_title?: string;
  industry_category?: IndustryCategory;
  career_level?: CareerLevel;
  linkedin_url?: string;
  portfolio_url?: string;
  phone_number?: string;
  location?: string;
  years_experience?: number;
  skills?: string[];
}

export function parseResume(text: string): ParsedResumeData {
  const data: ParsedResumeData = {};
  
  // Convert to lowercase for easier matching
  const lowerText = text.toLowerCase();
  
  // Extract name (usually at the top of resume)
  const namePatterns = [
    /^([A-Z][a-z]+)\s+([A-Z][a-z]+)/m,
    /^([A-Z][a-z]+)\s+([A-Z][a-z]+)\s*$/m,
    /(?:name|full name):\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[2]) {
      data.first_name = match[1].trim();
      data.last_name = match[2].trim();
      break;
    }
  }
  
  // Extract professional title
  const titlePatterns = [
    /(?:title|position|role|job title):\s*([^.\n]+)/gi,
    /(?:current|present|recent).*?(?:title|position|role):\s*([^.\n]+)/gi,
    /(?:senior|lead|principal|director|manager|engineer|developer|designer|analyst|consultant)/gi
  ];
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.professional_title = match[1].trim();
      break;
    }
  }
  
  // Extract location
  const locationPatterns = [
    /(?:location|based in|located in|address):\s*([A-Za-z\s,]+?)(?:\s|$|,|\.)/gi,
    /(?:city|state|country):\s*([A-Za-z\s,]+?)(?:\s|$|,|\.)/gi,
    /([A-Z][a-z]+,\s*[A-Z]{2})/g, // City, State format
    /([A-Z][a-z]+,\s*[A-Z][a-z]+)/g // City, Country format
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.location = match[1].trim();
      break;
    }
  }
  
  // Extract phone number
  const phonePatterns = [
    /(?:phone|tel|mobile|cell):\s*([+\d\s\-()]+)/gi,
    /(\+?1?\s*\(?\d{3}\)?\s*[-]?\d{3}\s*[-]?\d{4})/g,
    /(\d{3}\s*[-]?\d{3}\s*[-]?\d{4})/g
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.phone_number = match[1].trim();
      break;
    }
  }
  
  // Extract LinkedIn URL
  const linkedinPatterns = [
    /(?:linkedin|linkedin\.com):\s*(https?:\/\/[^\s]+)/gi,
    /(https?:\/\/linkedin\.com\/in\/[^\s]+)/gi,
    /(linkedin\.com\/in\/[^\s]+)/gi
  ];
  
  for (const pattern of linkedinPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.linkedin_url = match[1].startsWith('http') ? match[1] : `https://${match[1]}`;
      break;
    }
  }
  
  // Extract portfolio URL
  const portfolioPatterns = [
    /(?:portfolio|website|site):\s*(https?:\/\/[^\s]+)/gi,
    /(https?:\/\/[^\s]+\.com)/gi,
    /(https?:\/\/[^\s]+\.io)/gi,
    /(https?:\/\/[^\s]+\.dev)/gi
  ];
  
  for (const pattern of portfolioPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && !match[1].includes('linkedin')) {
      data.portfolio_url = match[1];
      break;
    }
  }
  
  // Extract years of experience
  const experiencePatterns = [
    /(?:years? of experience|experience|exp):\s*(\d+)/gi,
    /(\d+)\s*years?.*?experience/gi,
    /experience.*?(\d+)\s*years/gi
  ];
  
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const years = parseInt(match[1]);
      if (years > 0 && years <= 50) {
        data.years_experience = years;
        break;
      }
    }
  }
  
  // Extract career level based on title and experience
  if (data.professional_title) {
    const title = data.professional_title.toLowerCase();
    if (title.includes('executive') || title.includes('vp') || title.includes('chief') || title.includes('c-level')) {
      data.career_level = 'Executive';
    } else if (title.includes('director') || title.includes('head of')) {
      data.career_level = 'Director';
    } else if (title.includes('manager') || title.includes('lead')) {
      data.career_level = 'Manager';
    } else if (title.includes('senior')) {
      data.career_level = 'Senior';
    } else if (title.includes('mid') || title.includes('intermediate')) {
      data.career_level = 'Mid';
    } else if (title.includes('junior') || title.includes('entry')) {
      data.career_level = 'Entry';
    }
  }
  
  // Extract industry category
  const industryKeywords = {
    'Technology': ['software', 'tech', 'technology', 'programming', 'coding', 'development', 'engineering'],
    'Healthcare': ['health', 'medical', 'pharmaceutical', 'biotech', 'clinical', 'patient'],
    'Finance': ['finance', 'banking', 'investment', 'financial', 'accounting', 'trading'],
    'Education': ['education', 'academic', 'teaching', 'learning', 'university', 'school'],
    'Manufacturing': ['manufacturing', 'production', 'industrial', 'factory', 'operations'],
    'Retail': ['retail', 'e-commerce', 'sales', 'merchandising', 'customer service'],
    'Consulting': ['consulting', 'advisory', 'strategy', 'management consulting'],
    'Media': ['media', 'entertainment', 'publishing', 'journalism', 'content'],
    'Non-profit': ['non-profit', 'nonprofit', 'charity', 'foundation', 'social impact'],
    'Government': ['government', 'public sector', 'policy', 'regulatory', 'federal'],
    'Real Estate': ['real estate', 'property', 'construction', 'development'],
    'Transportation': ['transportation', 'logistics', 'supply chain', 'shipping'],
    'Energy': ['energy', 'oil', 'gas', 'renewable', 'utilities'],
    'Legal': ['legal', 'law', 'attorney', 'compliance', 'regulatory']
  };
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      data.industry_category = industry as IndustryCategory;
      break;
    }
  }
  
  // Extract skills
  const skillsPatterns = [
    /(?:skills|technologies|tools|technologies|programming languages):\s*([^.\n]+)/gi,
    /(?:proficient in|experience with|expertise in):\s*([^.\n]+)/gi
  ];
  
  const skills: string[] = [];
  
  // Common technical skills
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
    'Kubernetes', 'Git', 'Agile', 'Scrum', 'Product Management', 'User Research',
    'Data Analysis', 'Machine Learning', 'AI', 'Cloud Computing', 'DevOps',
    'UI/UX', 'Design', 'Marketing', 'Sales', 'Customer Service', 'Project Management',
    'Leadership', 'Communication', 'Analytics', 'Strategy', 'Business Development'
  ];
  
  for (const skill of commonSkills) {
    if (lowerText.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }
  
  // Extract skills from text patterns
  for (const pattern of skillsPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const skillText = match[1];
      const extractedSkills = skillText
        .split(/[,•\n]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0 && skill.length < 50);
      skills.push(...extractedSkills);
    }
  }
  
  // Remove duplicates and limit to top skills
  const uniqueSkills = [...new Set(skills)].slice(0, 15);
  if (uniqueSkills.length > 0) {
    data.skills = uniqueSkills;
  }
  
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