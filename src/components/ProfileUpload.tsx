import React, { useState } from 'react';
import type { UserProfileFormData } from '../jobTypes';

interface ProfileUploadProps {
  onDataPopulated: (data: Partial<UserProfileFormData>) => void;
  disabled?: boolean;
}

interface ProfileDataSchema {
  metadata: {
    schema_version: string;
    source: string;
    parsed_at: string;
  };
  personal_information?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
  };
  professional_profile?: {
    current_title?: string;
    target_title?: string;
    years_experience?: number;
    career_level?: string;
    industry_category?: string;
    functional_area?: string;
  };
  skills?: string[];
  location?: string;
  portfolio_url?: string;
}

interface UploadedData {
  profile_data_schema: ProfileDataSchema;
}

const ProfileUpload: React.FC<ProfileUploadProps> = ({ onDataPopulated, disabled = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<ProfileDataSchema | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const validateProfileSchema = (data: unknown): data is UploadedData => {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid file format: not a valid JSON object');
    }

    const typedData = data as Record<string, unknown>;
    if (!typedData.profile_data_schema) {
      throw new Error('Invalid file format: missing profile_data_schema');
    }

    const schema = typedData.profile_data_schema as Record<string, unknown>;
    if (!schema.metadata || !(schema.metadata as Record<string, unknown>).schema_version) {
      throw new Error('Invalid file format: missing metadata or schema version');
    }

    return true;
  };

  const handleProfileUpload = async (file: File): Promise<ProfileDataSchema> => {
    // Validate file type
    if (!file.name.endsWith('.json')) {
      throw new Error('Please upload a JSON file');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Please upload a file smaller than 5MB');
    }

    try {
      const fileContent = await file.text();
      const parsedData = JSON.parse(fileContent);
      
      // Validate schema structure
      validateProfileSchema(parsedData);
      
      return parsedData.profile_data_schema;
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        throw new Error('Invalid JSON format. Please check your file.');
      }
      throw parseError;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const data = await handleProfileUpload(file);
      setUploadedData(data);
      setShowPreview(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDataImport = () => {
    if (!uploadedData) return;

    const formData: Partial<UserProfileFormData> = {};

    // Personal Information
    if (uploadedData.personal_information) {
      const personal = uploadedData.personal_information;
      if (personal.first_name) formData.first_name = personal.first_name;
      if (personal.last_name) formData.last_name = personal.last_name;
      if (personal.linkedin_url) formData.linkedin_url = personal.linkedin_url;
      if (personal.phone) formData.phone_number = personal.phone;
    }

    // Professional Profile
    if (uploadedData.professional_profile) {
      const professional = uploadedData.professional_profile;
      if (professional.current_title) formData.professional_title = professional.current_title;
      if (professional.years_experience) formData.years_experience = professional.years_experience;
      if (professional.career_level) formData.career_level = professional.career_level as import('../jobTypes').CareerLevel;
      if (professional.industry_category) formData.industry_category = professional.industry_category as import('../jobTypes').IndustryCategory;
    }

    // Additional fields
    if (uploadedData.skills && Array.isArray(uploadedData.skills)) {
      formData.skills = uploadedData.skills;
    }
    if (uploadedData.location) formData.location = uploadedData.location;
    if (uploadedData.portfolio_url) formData.portfolio_url = uploadedData.portfolio_url;

    onDataPopulated(formData);
    setShowPreview(false);
    setUploadedData(null);
  };

  const cancelImport = () => {
    setShowPreview(false);
    setUploadedData(null);
    setError(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const promptText = `Parse this resume using the profile-data schema and output a completed profile-data-[firstname]-[lastname].json file following the parsing instructions provided.`;

  const downloadProfileSchema = () => {
    const link = document.createElement('a');
    link.href = '/upload-profile-files/profile_data_schema.json';
    link.download = 'profile_data_schema.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadParsingInstructions = () => {
    const link = document.createElement('a');
    link.href = '/upload-profile-files/resume_parsing_prompt.md';
    link.download = 'resume_parsing_prompt.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Upload Profile Data
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="profile-upload"
              disabled={disabled || isUploading}
            />
            <button
              type="button"
              disabled={disabled || isUploading}
              className="btn btn-secondary flex items-center space-x-2"
              onClick={() => {
                const fileInput = document.getElementById('profile-upload') as HTMLInputElement;
                if (fileInput && !disabled && !isUploading) {
                  fileInput.click();
                }
              }}
            >
                {isUploading ? (
                  <>
                    <div className="loading-spinner w-4 h-4"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload Profile Data</span>
                  </>
                )}
              </button>
            <span className="text-sm text-secondary-500">
              Generate a JSON file from your resume
            </span>
          </div>
          
          {/* Help Link */}
          <div className="flex items-center space-x-2 text-sm mt-2">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 transition-colors duration-200"
            >
              <span>How does it work?</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-1M14 6L8 12m0 0l-3-3m3 3l-3 3m3-3h-5" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="text-error-700 text-sm">{error}</div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && uploadedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-secondary-900">
                  Preview Uploaded Data
                </h3>
                <button
                  onClick={cancelImport}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Personal Information */}
                {uploadedData.personal_information && (
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">Personal Information</h4>
                    <div className="bg-secondary-50 rounded-lg p-3 space-y-1">
                      {uploadedData.personal_information.first_name && (
                        <div className="text-sm">
                          <span className="font-medium">First Name:</span> {uploadedData.personal_information.first_name}
                        </div>
                      )}
                      {uploadedData.personal_information.last_name && (
                        <div className="text-sm">
                          <span className="font-medium">Last Name:</span> {uploadedData.personal_information.last_name}
                        </div>
                      )}
                      {uploadedData.personal_information.linkedin_url && (
                        <div className="text-sm">
                          <span className="font-medium">LinkedIn:</span> {uploadedData.personal_information.linkedin_url}
                        </div>
                      )}
                      {uploadedData.personal_information.phone && (
                        <div className="text-sm">
                          <span className="font-medium">Phone:</span> {uploadedData.personal_information.phone}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Professional Profile */}
                {uploadedData.professional_profile && (
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">Professional Profile</h4>
                    <div className="bg-secondary-50 rounded-lg p-3 space-y-1">
                      {uploadedData.professional_profile.current_title && (
                        <div className="text-sm">
                          <span className="font-medium">Current Title:</span> {uploadedData.professional_profile.current_title}
                        </div>
                      )}
                      {uploadedData.professional_profile.years_experience && (
                        <div className="text-sm">
                          <span className="font-medium">Years Experience:</span> {uploadedData.professional_profile.years_experience}
                        </div>
                      )}
                      {uploadedData.professional_profile.career_level && (
                        <div className="text-sm">
                          <span className="font-medium">Career Level:</span> {uploadedData.professional_profile.career_level}
                        </div>
                      )}
                      {uploadedData.professional_profile.industry_category && (
                        <div className="text-sm">
                          <span className="font-medium">Industry:</span> {uploadedData.professional_profile.industry_category}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {uploadedData.skills && uploadedData.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">Skills</h4>
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2">
                        {uploadedData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                {(uploadedData.location || uploadedData.portfolio_url) && (
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">Additional Information</h4>
                    <div className="bg-secondary-50 rounded-lg p-3 space-y-1">
                      {uploadedData.location && (
                        <div className="text-sm">
                          <span className="font-medium">Location:</span> {uploadedData.location}
                        </div>
                      )}
                      {uploadedData.portfolio_url && (
                        <div className="text-sm">
                          <span className="font-medium">Portfolio:</span> {uploadedData.portfolio_url}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={cancelImport}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDataImport}
                  className="btn btn-strategic"
                >
                  Import Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-secondary-900">
                  How to Auto-Populate Your Profile
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Overview */}
                <div>
                  <h4 className="text-lg font-medium text-secondary-900 mb-3">Overview</h4>
                  <p className="text-secondary-700 mb-4">
                    You can automatically populate your profile using AI tools like Claude, ChatGPT, or Perplexity. 
                    The process takes 2-3 minutes and can extract most information from your resume.
                  </p>
                </div>

                {/* Step-by-step instructions */}
                <div>
                  <h4 className="text-lg font-medium text-secondary-900 mb-3">Step-by-Step Instructions</h4>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <p className="text-secondary-700">
                          <strong>Download the required files:</strong> You'll need both the profile schema and parsing instructions.
                        </p>
                        <div className="flex items-center space-x-3 mt-2">
                          <button
                            onClick={downloadProfileSchema}
                            className="btn btn-secondary text-sm"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Profile Schema
                          </button>
                          <button
                            onClick={downloadParsingInstructions}
                            className="btn btn-secondary text-sm"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Resume Parsing Prompt
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <p className="text-secondary-700">
                          <strong>Upload to your AI tool:</strong> Go to Claude, ChatGPT, Perplexity, or your favorite AI tool and upload all three files:
                        </p>
                        <ul className="mt-2 ml-4 space-y-1 text-sm text-secondary-600">
                          <li>• Your resume (PDF, DOC, or DOCX) Tip: Use a well-structured, recent resume with clear section headings and limited formatting.</li>
                          <li>• profile_data_schema.json</li>
                          <li>• resume_parsing_prompt.md</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <p className="text-secondary-700 mb-2">
                          <strong>Submit this prompt:</strong>
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase">Prompt</span>
                            <button
                              onClick={() => copyToClipboard(promptText)}
                              className={`btn btn-ghost text-xs transition-colors duration-200 ${
                                copySuccess ? 'text-success-600' : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              {copySuccess ? (
                                <>
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <code className="text-sm text-gray-700 block">
                            {promptText}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                        4
                      </div>
                      <div>
                        <p className="text-secondary-700">
                          <strong>Download and upload:</strong> Save the generated JSON file, close this window and select Upload Profile Data. 
                          Your profile will be automatically populated with the extracted information.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>


              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-secondary-200">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="btn btn-primary"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileUpload; 