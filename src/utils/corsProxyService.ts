// CORS Proxy Service for handling blocked sites
export interface ProxyService {
  name: string;
  url: string;
  description: string;
}

export const PROXY_SERVICES: ProxyService[] = [
  {
    name: 'CORS Anywhere',
    url: 'https://cors-anywhere.herokuapp.com/',
    description: 'Public CORS proxy service'
  },
  {
    name: 'AllOrigins',
    url: 'https://api.allorigins.win/raw?url=',
    description: 'Another public CORS proxy'
  }
];

export async function fetchWithProxy(url: string, proxyService: ProxyService): Promise<string> {
  try {
    const proxyUrl = proxyService.url + encodeURIComponent(url);
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobSearchBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    throw new Error(`Proxy service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getCommonJobSites(): { name: string; url: string; tips: string[] }[] {
  return [
    {
      name: 'LinkedIn',
      url: 'linkedin.com/jobs',
      tips: [
        'LinkedIn often blocks external requests',
        'Copy the job description from the "About this role" section',
        'Include the job title, company, and location information'
      ]
    },
    {
      name: 'Indeed',
      url: 'indeed.com',
      tips: [
        'Indeed may block external requests',
        'Copy the full job description from the page',
        'Include salary information if available'
      ]
    },
    {
      name: 'Corporate Career Sites',
      url: 'careers.company.com',
      tips: [
        'Most corporate sites block external requests',
        'Copy the job description from the main content area',
        'Include requirements, responsibilities, and benefits sections'
      ]
    },
    {
      name: 'Glassdoor',
      url: 'glassdoor.com',
      tips: [
        'Glassdoor may block external requests',
        'Copy the job description from the posting',
        'Include company information and benefits'
      ]
    }
  ];
}

export function getExtractionTips(): string[] {
  return [
    'Copy the job title from the page header or title',
    'Include the company name and location',
    'Copy the full job description including requirements and responsibilities',
    'Include salary information if available',
    'Copy any benefits or perks mentioned',
    'Include the application deadline if specified',
    'Copy contact information or application instructions'
  ];
} 