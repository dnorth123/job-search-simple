// Enhanced Inference Tracking Types for KWJT Template Integration
import type { JobApplication, JobApplicationFormData, WorkingConditions } from '../jobTypes';

export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;
export type DataSource = 'direct' | 'web_research' | 'inference' | 'user_validation' | 'template_upload';
export type InferenceMethod = 'web_search' | 'pattern_matching' | 'industry_standard' | 'company_research' | 'manual_entry';

// Individual field inference tracking
export interface FieldInference {
  value: any;
  is_inferred: boolean;
  confidence_level?: ConfidenceLevel;
  source?: DataSource;
  method?: InferenceMethod;
  research_url?: string;
  timestamp: string;
  validation_notes?: string;
}

// Comprehensive inference metadata matching KWJT template v2.3.0
export interface InferenceMetadata {
  total_fields: number;
  directly_extracted: number;
  inferred_fields: number;
  confidence_scores: Record<string, ConfidenceLevel>;
  research_sources: string[];
  extraction_timestamp: string;
  parser_version: string;
}

// Enhanced application data with inference tracking
export interface EnhancedApplicationData {
  // Core application fields with inference tracking
  position: FieldInference;
  company_name: FieldInference;
  location: FieldInference;
  work_arrangement: FieldInference;
  salary_range_min: FieldInference;
  salary_range_max: FieldInference;
  equity_offered: FieldInference;
  job_url: FieldInference;
  application_source: FieldInference;
  priority: FieldInference;
  
  // Extended fields
  department?: FieldInference;
  team?: FieldInference;
  currency?: FieldInference;
  job_description?: FieldInference;
  requirements?: FieldInference;
  preferred_qualifications?: FieldInference;
  benefits?: FieldInference;
  
  // Research and analysis fields
  match_score?: FieldInference;
  pros?: FieldInference;
  cons?: FieldInference;
  research_notes?: FieldInference;
  networking_contacts?: FieldInference;
  interview_preparation?: FieldInference;
  
  // Template metadata
  inference_metadata: InferenceMetadata;
}

// KWJT Template Structure
export interface KWJTTemplate {
  applications: EnhancedApplicationData[];
  template_metadata: {
    version: string;
    generated_at: string;
    source_url?: string;
    processing_method: string;
    quality_score: number;
  };
}

// Backward compatibility interface for existing JobApplication
export interface JobApplicationWithInference extends JobApplication {
  // v2.3.0 Inference tracking fields for all main fields
  company_name_inferred?: boolean;
  company_linkedin_url_inferred?: boolean;
  position_inferred?: boolean;
  department_inferred?: boolean;
  team_inferred?: boolean;
  location_inferred?: boolean;
  work_arrangement_inferred?: boolean;
  salary_range_min_inferred?: boolean;
  salary_range_max_inferred?: boolean;
  currency_inferred?: boolean;
  equity_offered_inferred?: boolean;
  job_req_id_inferred?: boolean;
  job_url_inferred?: boolean;
  application_source_inferred?: boolean;
  priority_inferred?: boolean;
  notes_inferred?: boolean;
  job_description_inferred?: boolean;
  
  // v2.3.0 Comprehensive inference metadata (matches template structure exactly)
  inference_metadata?: InferenceMetadata;
  
  // Special processing fields (not persisted to database, prefixed with _)
  _company_name?: string;
}

// Form data interface for enhanced uploads
export interface EnhancedJobApplicationFormData extends JobApplicationFormData {
  // v2.3.0 Inference tracking fields for all main fields
  company_name_inferred?: boolean;
  company_linkedin_url_inferred?: boolean;
  position_inferred?: boolean;
  department_inferred?: boolean;
  team_inferred?: boolean;
  location_inferred?: boolean;
  work_arrangement_inferred?: boolean;
  salary_range_min_inferred?: boolean;
  salary_range_max_inferred?: boolean;
  currency_inferred?: boolean;
  equity_offered_inferred?: boolean;
  job_req_id_inferred?: boolean;
  job_url_inferred?: boolean;
  application_source_inferred?: boolean;
  priority_inferred?: boolean;
  notes_inferred?: boolean;
  job_description_inferred?: boolean;
  
  // Inference flags for form validation
  _inference_metadata?: InferenceMetadata;
  _has_inferred_fields?: boolean;
}