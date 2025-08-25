// Job Board Matrix Data - Professional Directory for Knowledge Workers
// Based on comprehensive market research and platform categorization

export type JobBoardCategory = 
  | 'general'
  | 'product_management'
  | 'ux_design'
  | 'strategy_innovation'
  | 'contract_fractional'
  | 'executive_curated';

export interface JobBoard {
  name: string;
  url: string;
  description: string;
  category: JobBoardCategory;
  tags: string[];
  isPremium?: boolean;
  requiresApplication?: boolean;
}

export const JOB_BOARD_CATEGORIES: Record<JobBoardCategory, { label: string; description: string; iconName: string }> = {
  general: {
    label: 'General Platforms',
    description: 'High-volume mainstream job boards with broad market coverage',
    iconName: 'Globe'
  },
  product_management: {
    label: 'Product Management',
    description: 'Specialized platforms for product leadership and strategy roles',
    iconName: 'BarChart3'
  },
  ux_design: {
    label: 'UX & Design',
    description: 'Creative and user experience focused opportunities',
    iconName: 'Palette'
  },
  strategy_innovation: {
    label: 'Strategy & Innovation',
    description: 'Strategic consulting and innovation leadership positions',
    iconName: 'Lightbulb'
  },
  contract_fractional: {
    label: 'Contract & Fractional',
    description: 'Flexible engagement models for specialized expertise',
    iconName: 'Zap'
  },
  executive_curated: {
    label: 'Executive & Curated',
    description: 'Premium networks for senior leadership opportunities',
    iconName: 'Crown'
  }
};

export const JOB_BOARDS: JobBoard[] = [
  // General Platforms
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs/',
    description: 'Professional network with comprehensive job listings and industry connections. Essential platform for knowledge workers with strong recruiter presence.',
    category: 'general',
    tags: ['networking', 'recruiters', 'comprehensive', 'professional']
  },
  {
    name: 'Indeed',
    url: 'https://www.indeed.com/',
    description: 'Largest job aggregator with broad market coverage. High volume but requires filtering for quality knowledge work positions.',
    category: 'general',
    tags: ['aggregator', 'high-volume', 'comprehensive', 'global']
  },
  {
    name: 'Glassdoor',
    url: 'https://www.glassdoor.com/Job/',
    description: 'Job search platform with valuable company insights, salary data, and employee reviews. Excellent for research and compensation benchmarking.',
    category: 'general',
    tags: ['salary-data', 'company-reviews', 'insights', 'research']
  },
  {
    name: 'ZipRecruiter',
    url: 'https://www.ziprecruiter.com/',
    description: 'AI-powered job matching platform with personalized recommendations. Strong mobile experience and quick application processes.',
    category: 'general',
    tags: ['ai-matching', 'mobile-optimized', 'quick-apply', 'personalized']
  },
  {
    name: 'Monster',
    url: 'https://www.monster.com/',
    description: 'Established job board with career resources and resume services. Good for mid-career professionals seeking comprehensive support.',
    category: 'general',
    tags: ['established', 'career-resources', 'resume-services', 'mid-career']
  },
  {
    name: 'CareerBuilder',
    url: 'https://www.careerbuilder.com/',
    description: 'Enterprise-focused job platform with strong corporate partnerships. Valuable for Fortune 500 and large company opportunities.',
    category: 'general',
    tags: ['enterprise', 'fortune-500', 'corporate', 'large-companies']
  },
  {
    name: 'AngelList (Wellfound)',
    url: 'https://wellfound.com/',
    description: 'Premier startup job platform connecting talent with high-growth companies. Essential for equity-focused knowledge workers and innovation seekers.',
    category: 'general',
    tags: ['startups', 'equity', 'high-growth', 'innovation', 'tech']
  },
  {
    name: 'Dice',
    url: 'https://www.dice.com/',
    description: 'Technology-focused job board with strong developer and IT professional community. Excellent for technical knowledge workers and consultants.',
    category: 'general',
    tags: ['technology', 'developers', 'IT', 'technical', 'consultants']
  },
  {
    name: 'FlexJobs',
    url: 'https://www.flexjobs.com/',
    description: 'Curated remote and flexible work opportunities. Premium service with hand-screened positions for work-life balance focused professionals.',
    category: 'general',
    tags: ['remote', 'flexible', 'curated', 'work-life-balance'],
    isPremium: true
  },
  {
    name: 'Robert Half',
    url: 'https://www.roberthalf.com/job-search',
    description: 'Professional staffing firm with focus on finance, accounting, technology, and administrative roles. Strong consultant relationships.',
    category: 'general',
    tags: ['staffing', 'finance', 'accounting', 'technology', 'consultants']
  },
  {
    name: 'SimplyHired',
    url: 'https://www.simplyhired.com/',
    description: 'Job aggregator with clean interface and strong local market coverage. Good for geographic-specific searches and market research.',
    category: 'general',
    tags: ['aggregator', 'local-markets', 'clean-interface', 'geographic']
  },
  {
    name: 'Craigslist',
    url: 'https://craigslist.org/',
    description: 'Local classifieds with diverse opportunities including unique and niche positions. Requires careful filtering but offers hidden gems.',
    category: 'general',
    tags: ['local', 'diverse', 'niche', 'unique-opportunities']
  },

  // Product Management Specialized
  {
    name: 'Product Hunt Jobs',
    url: 'https://www.producthunt.com/jobs',
    description: 'Product-focused opportunities within the Product Hunt ecosystem. Excellent for product managers seeking startup and growth-stage companies.',
    category: 'product_management',
    tags: ['product-management', 'startups', 'growth-stage', 'product-hunt']
  },
  {
    name: 'Product Manager HQ',
    url: 'https://www.productmanagerhq.com/jobs/',
    description: 'Specialized job board exclusively for product management roles. Curated positions with detailed role requirements and company insights.',
    category: 'product_management',
    tags: ['product-management', 'specialized', 'curated', 'role-specific']
  },
  {
    name: 'Mind the Product Jobs',
    url: 'https://www.mindtheproduct.com/jobs/',
    description: 'Community-driven product management job board with global opportunities. Strong focus on product strategy and leadership roles.',
    category: 'product_management',
    tags: ['community-driven', 'global', 'product-strategy', 'leadership']
  },
  {
    name: 'Product School Jobs',
    url: 'https://productschool.com/product-management-jobs/',
    description: 'Educational platform\'s job board featuring product management positions. Good for career development and skill-matched opportunities.',
    category: 'product_management',
    tags: ['education-focused', 'career-development', 'skill-matched', 'growth']
  },

  // UX & Design Specialized  
  {
    name: 'Dribbble Jobs',
    url: 'https://dribbble.com/jobs',
    description: 'Design community job board featuring creative and UX positions. Excellent for portfolio-driven designers and creative professionals.',
    category: 'ux_design',
    tags: ['design', 'creative', 'portfolio-driven', 'community']
  },
  {
    name: 'Behance',
    url: 'https://www.behance.net/jobboard',
    description: 'Adobe\'s creative platform job board with high-quality design opportunities. Strong integration with creative portfolios and Adobe ecosystem.',
    category: 'ux_design',
    tags: ['adobe', 'creative', 'high-quality', 'portfolio-integration']
  },
  {
    name: 'IXDA Jobs',
    url: 'https://ixda.org/jobs/',
    description: 'Interaction Design Association job board focusing on UX and interaction design roles. Community-vetted opportunities for design professionals.',
    category: 'ux_design',
    tags: ['interaction-design', 'UX', 'community-vetted', 'professional']
  },
  {
    name: 'UX Jobs Board',
    url: 'https://www.uxjobsboard.com/',
    description: 'Dedicated UX job platform with comprehensive role filtering and salary insights. Excellent for user experience career advancement.',
    category: 'ux_design',
    tags: ['UX-focused', 'role-filtering', 'salary-insights', 'career-advancement']
  },

  // Strategy & Innovation
  {
    name: 'Strategy& Jobs',
    url: 'https://www.strategyand.pwc.com/us/en/careers.html',
    description: 'PwC\'s strategy consulting arm career portal. Premium strategy and innovation roles for experienced consultants and strategists.',
    category: 'strategy_innovation',
    tags: ['strategy-consulting', 'premium', 'experienced', 'pwc']
  },
  {
    name: 'BCG Careers',
    url: 'https://careers.bcg.com/',
    description: 'Boston Consulting Group career opportunities in strategy, innovation, and transformation. Elite consulting positions with global reach.',
    category: 'strategy_innovation',
    tags: ['elite-consulting', 'strategy', 'innovation', 'transformation', 'global']
  },
  {
    name: 'McKinsey Careers',
    url: 'https://www.mckinsey.com/careers',
    description: 'Premier strategy consulting firm career portal. Top-tier consulting and advisory roles for exceptional strategic thinkers.',
    category: 'strategy_innovation',
    tags: ['premier', 'top-tier', 'strategic-thinking', 'advisory']
  },
  {
    name: 'Innovation Jobs',
    url: 'https://innovationjobs.com/',
    description: 'Specialized platform for innovation, R&D, and transformation roles. Focus on cutting-edge technology and business model innovation.',
    category: 'strategy_innovation',
    tags: ['innovation', 'R&D', 'transformation', 'cutting-edge', 'business-model']
  },

  // Contract & Fractional
  {
    name: 'Upwork',
    url: 'https://www.upwork.com/',
    description: 'Leading freelance platform for knowledge work and professional services. Comprehensive project-based and long-term contract opportunities.',
    category: 'contract_fractional',
    tags: ['freelance', 'project-based', 'long-term', 'knowledge-work', 'professional-services']
  },
  {
    name: 'Toptal',
    url: 'https://www.toptal.com/',
    description: 'Exclusive network for top 3% of freelance talent. Premium fractional consulting opportunities with elite client base.',
    category: 'contract_fractional',
    tags: ['exclusive', 'top-talent', 'premium', 'fractional', 'elite-clients'],
    requiresApplication: true
  },
  {
    name: 'Catalant',
    url: 'https://www.catalant.com/',
    description: 'On-demand consulting platform connecting experts with Fortune 500 companies. High-value strategic and operational projects.',
    category: 'contract_fractional',
    tags: ['on-demand', 'consulting', 'fortune-500', 'high-value', 'strategic']
  },
  {
    name: 'Freelancer.com',
    url: 'https://www.freelancer.com/',
    description: 'Global freelance marketplace with diverse project opportunities. Competitive bidding platform for various skill levels and project types.',
    category: 'contract_fractional',
    tags: ['global', 'diverse-projects', 'competitive-bidding', 'various-skills']
  },
  {
    name: 'Guru',
    url: 'https://www.guru.com/',
    description: 'Professional freelance platform with workroom collaboration tools. Focus on building long-term client relationships and project management.',
    category: 'contract_fractional',
    tags: ['professional', 'collaboration-tools', 'long-term-relationships', 'project-management']
  },

  // Executive & Curated
  {
    name: 'ExecuNet',
    url: 'https://www.execunet.com/',
    description: 'Executive networking and career advancement platform for senior leaders. Exclusive opportunities for $100K+ compensation levels.',
    category: 'executive_curated',
    tags: ['executive', 'networking', 'senior-leaders', 'high-compensation'],
    isPremium: true
  },
  {
    name: 'BlueSteps',
    url: 'https://www.bluesteps.com/',
    description: 'AESC member executive search firm network. Premium executive opportunities vetted by top search consultants worldwide.',
    category: 'executive_curated',
    tags: ['executive-search', 'AESC', 'premium', 'search-consultants'],
    requiresApplication: true
  },
  {
    name: 'The Ladders',
    url: 'https://www.theladders.com/',
    description: 'Curated job board for $100K+ positions. Focus on senior professional and executive opportunities with personalized matching.',
    category: 'executive_curated',
    tags: ['100k-plus', 'senior-professional', 'executive', 'personalized-matching'],
    isPremium: true
  },
  {
    name: 'Spencer Stuart',
    url: 'https://www.spencerstuart.com/',
    description: 'Global executive search consultancy. C-suite and senior leadership opportunities across industries and functional areas.',
    category: 'executive_curated',
    tags: ['executive-search', 'c-suite', 'senior-leadership', 'global']
  },
  {
    name: 'Korn Ferry',
    url: 'https://www.kornferry.com/careers',
    description: 'Organizational consulting firm with executive search division. Premium leadership roles and transformation opportunities.',
    category: 'executive_curated',
    tags: ['organizational-consulting', 'executive-search', 'leadership', 'transformation']
  },
  {
    name: 'Russell Reynolds',
    url: 'https://www.russellreynolds.com/',
    description: 'Elite executive search firm specializing in CEO and board-level appointments. Ultra-premium leadership opportunities.',
    category: 'executive_curated',
    tags: ['elite', 'CEO', 'board-level', 'ultra-premium', 'leadership']
  },
  {
    name: 'Heidrick & Struggles',
    url: 'https://www.heidrick.com/',
    description: 'Premier executive search and leadership consulting firm. C-suite and senior executive roles with global reach.',
    category: 'executive_curated',
    tags: ['premier', 'executive-search', 'c-suite', 'leadership-consulting']
  },
  {
    name: 'Egon Zehnder',
    url: 'https://www.egonzehnder.com/',
    description: 'Global executive search firm focused on leadership assessment and development. Exclusive senior executive opportunities.',
    category: 'executive_curated',
    tags: ['global', 'leadership-assessment', 'development', 'exclusive']
  },
  {
    name: 'Michael Page',
    url: 'https://www.michaelpage.com/',
    description: 'International recruitment consultancy with specialized practices. Professional and managerial roles across multiple industries.',
    category: 'executive_curated',
    tags: ['international', 'specialized-practices', 'professional', 'managerial']
  },
  {
    name: 'Robert Walters',
    url: 'https://www.robertwalters.com/',
    description: 'Global specialist recruitment consultancy. High-quality professional opportunities with personalized consultant relationships.',
    category: 'executive_curated',
    tags: ['specialist-recruitment', 'high-quality', 'personalized', 'consultant-relationships']
  }
];

export const getJobBoardsByCategory = (category: JobBoardCategory): JobBoard[] => {
  return JOB_BOARDS.filter(board => board.category === category);
};

export const searchJobBoards = (query: string): JobBoard[] => {
  const lowercaseQuery = query.toLowerCase();
  return JOB_BOARDS.filter(board => 
    board.name.toLowerCase().includes(lowercaseQuery) ||
    board.description.toLowerCase().includes(lowercaseQuery) ||
    board.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getJobBoardStats = () => {
  const stats = {
    total: JOB_BOARDS.length,
    premium: JOB_BOARDS.filter(board => board.isPremium).length,
    applicationRequired: JOB_BOARDS.filter(board => board.requiresApplication).length,
    byCategory: {} as Record<JobBoardCategory, number>
  };

  Object.keys(JOB_BOARD_CATEGORIES).forEach(category => {
    stats.byCategory[category as JobBoardCategory] = getJobBoardsByCategory(category as JobBoardCategory).length;
  });

  return stats;
};