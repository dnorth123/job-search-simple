import React, { useState, useRef } from 'react';
import { parseJobDescription, extractTextFromFile, validateFile, extractTextFromUrl, validateUrl } from '../utils/jobDescriptionParser';
import { getExtractionTips } from '../utils/corsProxyService';
import type { ParsedJobData } from '../utils/jobDescriptionParser';
import { kwjtProcessor, type KWJTProcessingResult } from '../utils/kwjtTemplateProcessor';
import type { JobApplicationWithInference } from '../types/inference';

interface ApplicationData {
  company_name?: string;
  company_linkedin_url?: string;
  position?: string;
  department?: string;
  team?: string;
  location?: string;
  work_arrangement?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  currency?: string;
  equity_offered?: boolean;
  job_url?: string;
  job_req_id?: string; // v2.3.0 field
  job_description?: string | {
    purpose?: string;
    key_responsibilities?: string[];
    minimum_requirements?: string[];
    benefits_offered?: string[];
    working_conditions?: {
      travel_required?: string;
      work_environment?: string;
      physical_requirements?: string;
    };
    job_type?: string;
  };
  requirements?: string;
  preferred_qualifications?: string;
  benefits?: string;
  application_method?: string;
  application_source?: string;
  priority?: string;
  match_score?: number;
  notes?: string;
  pros?: string;
  cons?: string;
  research_notes?: string;
  networking_contacts?: string;
  interview_preparation?: string;
  
  // v2.3.0 inference tracking fields
  inference_metadata?: {
    total_fields: number;
    directly_extracted: number;
    inferred_fields: number;
    confidence_scores: Record<string, number>;
    research_sources: string[];
    extraction_timestamp: string;
    parser_version: string;
  };
  
  // Internal processing flag
  _isV23Template?: boolean;
}

interface JobDescriptionUploadProps {
  onDataExtracted: (data: ParsedJobData) => void;
  onApplicationDataExtracted?: (data: ApplicationData) => void;
  onKWJTDataExtracted?: (result: KWJTProcessingResult) => void;
}

export const JobDescriptionUpload: React.FC<JobDescriptionUploadProps> = ({
  onDataExtracted,
  onApplicationDataExtracted,
  onKWJTDataExtracted
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showManualOverride, setShowManualOverride] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // v2.3.0 Template detection
  const isV23Template = (jsonData: any): boolean => {
    return (
      jsonData.template_metadata?.version === "2.3.0" ||
      jsonData.applications?.some((app: any) => 
        app.job_description && 
        typeof app.job_description === 'object' && 
        (app.job_description.purpose || app.job_description.key_responsibilities)
      )
    );
  };

  const handleFileUpload = async (file: File) => {
    // Check if it's a JSON file
    if (file.name.endsWith('.json')) {
      setIsUploading(true);
      setLocalError(null);
      setSuccessMessage(null);
      setShowManualOverride(false);
      
      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        // Check if it's an application data JSON
        if (jsonData.applications && Array.isArray(jsonData.applications)) {
          if (jsonData.applications.length > 0) {
            
            // Check for v2.3.0 template
            const isV23 = isV23Template(jsonData);
            
            // Check if this is an enhanced KWJT template with inference data (legacy check)
            const hasInferenceData = jsonData.template_metadata || 
                                   jsonData.applications.some((app: any) => 
                                     app.inference_metadata || 
                                     (app.position && typeof app.position === 'object' && 'is_inferred' in app.position)
                                   );
            
            if ((hasInferenceData || isV23) && onKWJTDataExtracted) {
              // Process as enhanced KWJT template (includes v2.3.0)
              try {
                const result = await kwjtProcessor.processTemplate(jsonData, 'temp-user-id'); // User ID will be set in App.tsx
                if (result.success) {
                  onKWJTDataExtracted(result);
                  const templateVersion = jsonData.template_metadata?.version || 'enhanced';
                  setSuccessMessage(`Successfully processed ${templateVersion} template with ${result.applications.length} application(s) and ${result.metadata.inferred_fields_count} inferred fields`);
                } else {
                  setLocalError(`Template processing failed: ${result.errors.join(', ')}`);
                }
              } catch (error) {
                setLocalError(`Failed to process template: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            } else {
              // Process as regular application data or v2.3.0 template via alternative path
              const appData = jsonData.applications[0]; // Take the first application
              
              if (onApplicationDataExtracted) {
                // Process v2.3.0 structured job description if present
                if (isV23 && appData.job_description && typeof appData.job_description === 'object') {
                  // Keep structured format for the handler to process
                  onApplicationDataExtracted({
                    ...appData,
                    _isV23Template: true // Flag to indicate v2.3.0 processing
                  });
                  setSuccessMessage(`Successfully loaded v2.3.0 template data for ${appData.position || 'position'} at ${appData.company_name || 'company'} with structured job description`);
                } else {
                  onApplicationDataExtracted(appData);
                  setSuccessMessage(`Successfully loaded application data for ${appData.position || 'position'} at ${appData.company_name || 'company'}`);
                }
              }
            }
          } else {
            setLocalError('No applications found in the JSON file');
          }
        } else {
          setLocalError('Invalid JSON format. Please use the application template format.');
        }
      } catch (error) {
        setLocalError('Failed to parse JSON file. Please check the file format.');
      } finally {
        setIsUploading(false);
      }
      return;
    }
    
    // Original file handling for non-JSON files
    if (!validateFile(file)) {
      setLocalError('Please upload a valid file (TXT, MD, PDF, DOC, DOCX, JSON) under 5MB');
      return;
    }

    setIsUploading(true);
    setLocalError(null);
    setSuccessMessage(null);
    setShowManualOverride(false);
    try {
      const text = await extractTextFromFile(file);
      const parsedData = parseJobDescription(text);
      onDataExtracted(parsedData);
    } catch {
      setLocalError('Failed to read file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextParse = () => {
    if (!textInput.trim()) {
      setLocalError('Please enter some text to parse');
      return;
    }

    setLocalError(null);
    setSuccessMessage(null);
    setShowManualOverride(false);
    try {
      const parsedData = parseJobDescription(textInput);
      onDataExtracted(parsedData);
    } catch {
      setLocalError('Failed to parse text. Please try again.');
    }
  };

  const handleUrlParse = async () => {
    if (!urlInput.trim()) {
      setLocalError('Please enter a URL to parse');
      return;
    }

    if (!validateUrl(urlInput.trim())) {
      setLocalError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setIsUploading(true);
    setLocalError(null);
    setSuccessMessage(null);
    setShowManualOverride(false);
    try {
      const text = await extractTextFromUrl(urlInput.trim());
      
      // Auto-populate the text input field with the extracted content
      setTextInput(text);
      
      // Clear the URL input after successful extraction
      setUrlInput('');
      
      // Also parse the content immediately
      const parsedData = parseJobDescription(text);
      onDataExtracted(parsedData);
      
      // Show success message
      setSuccessMessage('Content successfully extracted from URL and populated below. You can edit the text if needed before parsing.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a CORS-related error
      if (errorMessage.includes('CORS') || errorMessage.includes('blocks external requests')) {
        setLocalError(
          'This website blocks external requests. You can manually copy the job description from the website and paste it below, or try one of the other options.'
        );
        setShowManualOverride(true);
      } else {
        setLocalError(`Failed to fetch content from URL: ${errorMessage}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-lg font-medium text-neutral-900 mb-2">
          Upload Application Info
        </h4>
        <p className="text-sm text-neutral-600 mb-4">
          Upload application data (JSON), job description file, paste text, or provide a URL to automatically extract information
        </p>
        <p className="text-xs text-neutral-500 mb-4">
          💡 Tip: Use the JSON template from /docs/enhanced_job_template_v2_2.json to pre-fill application data including company LinkedIn URLs and structured job descriptions.
          For job descriptions, URL parsing works best with public job sites.
        </p>
      </div>

      {/* Error Display */}
      {localError && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="text-error-700 text-sm">{localError}</div>
        </div>
      )}

      {/* Success Display */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-700 text-sm">{successMessage}</div>
        </div>
      )}

      {/* Manual Override Option */}
      {showManualOverride && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-700 text-sm mb-3">
            <strong>Manual Override Available:</strong> Since this website blocks external requests, you can manually copy the job description from the website and paste it below.
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-blue-600 mb-2">
                1. Open the URL in a new tab: <a href={urlInput} target="_blank" rel="noopener noreferrer" className="underline">{urlInput}</a>
              </p>
              <p className="text-xs text-blue-600 mb-2">
                2. Copy the job description text from the page
              </p>
              <p className="text-xs text-blue-600 mb-2">
                3. Paste it in the "Option 3: Paste Text" field below
              </p>
            </div>
            
            {/* Site-specific tips */}
            <div className="border-t border-blue-200 pt-2">
              <p className="text-xs font-medium text-blue-700 mb-1">Helpful Tips:</p>
              <ul className="text-xs text-blue-600 space-y-1">
                {getExtractionTips().slice(0, 4).map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowManualOverride(false)}
            className="text-xs text-blue-600 underline mt-2"
          >
            Hide this message
          </button>
        </div>
      )}

      {/* File Upload Area */}
      <div className="space-y-3">
        <h5 className="text-md font-medium text-neutral-800">Option 1: Upload File</h5>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-executive-primary bg-executive-primary-lighter'
              : 'border-neutral-300 hover:border-neutral-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-sm text-neutral-600">
                {isUploading ? 'Processing file...' : 'Drag and drop a file here, or click to browse'}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Supports: JSON (application data), TXT, MD, PDF, DOC, DOCX (max 5MB)
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="btn btn-secondary text-sm"
            >
              {isUploading ? 'Processing...' : 'Choose File'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt,.md,.pdf,.doc,.docx"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div className="space-y-3">
        <h5 className="text-md font-medium text-neutral-800">Option 2: URL Input</h5>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/job-posting"
              className="form-input flex-1"
              disabled={isUploading}
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => {
                  setUrlInput('');
                  setLocalError(null);
                  setSuccessMessage(null);
                }}
                className="btn btn-secondary text-sm px-3"
                disabled={isUploading}
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleUrlParse}
              disabled={isUploading || !urlInput.trim()}
              className="btn btn-primary text-sm"
            >
              {isUploading ? 'Fetching...' : 'Parse from URL'}
            </button>
          </div>
        </div>
      </div>

      {/* Text Input Alternative */}
      <div className="space-y-3">
        <h5 className="text-md font-medium text-neutral-800">Option 3: Paste Text</h5>
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste the job description text here..."
              className="form-textarea w-full h-32 resize-none"
              disabled={isUploading}
            />
            {textInput.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-neutral-500 bg-white px-2 py-1 rounded">
                {textInput.length} characters
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleTextParse}
              disabled={isUploading || !textInput.trim()}
              className="btn btn-primary text-sm"
            >
              {isUploading ? 'Processing...' : 'Parse Text'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isUploading && (
        <div className="text-center py-4">
          <div className="loading-spinner mx-auto mb-2"></div>
          <p className="text-sm text-neutral-600">Extracting information...</p>
        </div>
      )}
    </div>
  );
}; 