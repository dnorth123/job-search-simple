export type JobStatus = 'Pre-application' | 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';
export type RemotePolicy = 'Remote' | 'Hybrid' | 'On-site';
export type PriorityLevel = 1 | 2 | 3; // 1=High, 2=Medium, 3=Low
export type CompanySizeRange = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001-5000' | '5001-10000' | '10000+';
export type IndustryCategory = 
  | 'Technology' | 'Healthcare' | 'Finance' | 'Education' | 'Manufacturing' 
  | 'Retail' | 'Consulting' | 'Media' | 'Non-profit' | 'Government' 
  | 'Real Estate' | 'Transportation' | 'Energy' | 'Legal' | 'Other';
export type CareerLevel = 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Manager' | 'Director' | 'Executive';
export type ApplicationSource = 
  | 'LinkedIn' | 'Indeed' | 'Company Website' | 'Referral' | 'Recruiter' 
  | 'Glassdoor' | 'AngelList' | 'Handshake' | 'Career Fair' | 'Other';

export type TodoPriority = 'High' | 'Medium' | 'Low';
export type TodoCategory = 'Follow-up' | 'Preparation' | 'Networking' | 'Administrative' | 'Career Development' | 'Other';

export interface LinkedInSearchResult {
  url: string;
  companyName: string;
  vanityName: string;
  description: string;
  confidence: number;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string; // ISO date string
  priority: TodoPriority;
  category?: TodoCategory;
  completed: boolean;
  linked_job_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  linked_job?: JobApplication;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  professional_title?: string;
  industry_category?: IndustryCategory;
  career_level?: CareerLevel;
  linkedin_url?: string;
  portfolio_url?: string;
  phone_number?: string;
  location?: string;
  years_experience?: number;
  skills?: string[];
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry_category?: IndustryCategory;
  company_size_range?: CompanySizeRange;
  headquarters_location?: string;
  website_url?: string;
  linkedin_url?: string;
  linkedin_discovery_method?: 'auto' | 'manual' | 'none';
  linkedin_confidence?: number;
  linkedin_last_verified?: string;
  description?: string;
  founded_year?: number;
  funding_stage?: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  company_id?: string;
  position: string;
  salary_range_min?: number;
  salary_range_max?: number;
  location?: string;
  remote_policy?: RemotePolicy;
  application_source?: ApplicationSource;
  priority_level: PriorityLevel;
  notes?: string;
  date_applied: string; // ISO date string
  job_posting_url?: string;
  job_req_id?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  interview_rounds?: number;
  benefits_mentioned?: string;
  equity_offered?: boolean;
  equity_details?: string;
  archived?: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: Company;
  current_status?: JobStatus;
}

export interface ApplicationTimeline {
  id: string;
  application_id: string;
  status: JobStatus;
  notes?: string;
  date_changed: string; // ISO date string
  interview_type?: string; // 'Phone', 'Video', 'On-site', 'Technical', 'Behavioral'
  interview_date?: string; // ISO date string
  interviewer_name?: string;
  feedback_received?: string;
  next_steps?: string;
  created_at: string;
}

// Form validation types
export interface JobApplicationFormData {
  company_id?: string;
  position: string;
  salary_range_min?: number;
  salary_range_max?: number;
  location?: string;
  remote_policy?: RemotePolicy;
  application_source?: ApplicationSource;
  priority_level: PriorityLevel;
  notes?: string;
  date_applied: string;
  job_posting_url?: string;
  job_req_id?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  benefits_mentioned?: string;
  equity_offered?: boolean;
  equity_details?: string;
  archived?: boolean;
}

export interface CompanyFormData {
  name: string;
  industry_category?: IndustryCategory;
  company_size_range?: CompanySizeRange;
  headquarters_location?: string;
  website_url?: string;
  linkedin_url?: string;
  linkedin_discovery_method?: 'auto' | 'manual' | 'none';
  linkedin_confidence?: number;
  linkedin_last_verified?: string;
  description?: string;
  founded_year?: number;
  funding_stage?: string;
}

export interface UserProfileFormData {
  first_name: string;
  last_name: string;
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

// Legacy interface for backward compatibility during migration
export interface LegacyJobApplication {
  id: string;
  company: string;
  position: string;
  status: JobStatus;
  notes?: string;
  dateApplied: string; // ISO date string
}

// Validation schemas
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
} 