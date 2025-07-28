import React, { useState, useRef } from 'react';
import { parseResume, extractTextFromFile, validateFile } from '../utils/resumeParser';
import type { ParsedResumeData } from '../utils/resumeParser';

interface ResumeUploadProps {
  onDataExtracted: (data: ParsedResumeData) => void;
  disabled?: boolean;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onDataExtracted,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) {
      setLocalError('Please upload a valid file (TXT, MD, PDF, DOC, DOCX) under 5MB');
      return;
    }

    setIsUploading(true);
    setLocalError(null);
    try {
      const text = await extractTextFromFile(file);
      const parsedData = parseResume(text);
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
    try {
      const parsedData = parseResume(textInput);
      onDataExtracted(parsedData);
    } catch {
      setLocalError('Failed to parse text. Please try again.');
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
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-medium text-secondary-900 mb-2">
          Upload Resume
        </h4>
        <p className="text-sm text-secondary-600 mb-4">
          Upload your resume or paste the text to automatically extract profile information
        </p>
      </div>

      {/* Error Display */}
      {localError && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="text-error-700 text-sm">{localError}</div>
        </div>
      )}

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-secondary-primary bg-secondary-primary-lighter'
            : 'border-secondary-300 hover:border-secondary-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <div>
            <p className="text-sm text-secondary-600">
              {isUploading ? 'Processing resume...' : 'Drag and drop your resume here, or click to browse'}
            </p>
            <p className="text-xs text-secondary-500 mt-1">
              Supports: TXT, MD, PDF, DOC, DOCX (max 5MB)
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            className="btn btn-secondary text-sm"
          >
            {isUploading ? 'Processing...' : 'Choose Resume'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      {/* Text Input Alternative */}
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-sm text-secondary-600">Or paste resume text:</p>
        </div>
        
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste your resume text here..."
          className="form-textarea w-full h-32 resize-none"
          disabled={isUploading || disabled}
        />
        
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleTextParse}
            disabled={isUploading || disabled || !textInput.trim()}
            className="btn btn-primary text-sm"
          >
            {isUploading ? 'Processing...' : 'Parse Resume'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isUploading && (
        <div className="text-center py-4">
          <div className="loading-spinner mx-auto mb-2"></div>
          <p className="text-sm text-secondary-600">Extracting profile information...</p>
        </div>
      )}

      {/* Information about what gets extracted */}
      <div className="bg-secondary-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-secondary-900 mb-2">What we extract:</h5>
        <div className="grid grid-cols-2 gap-2 text-xs text-secondary-600">
          <div>• Name</div>
          <div>• Professional Title</div>
          <div>• Location</div>
          <div>• Phone Number</div>
          <div>• LinkedIn URL</div>
          <div>• Portfolio URL</div>
          <div>• Years of Experience</div>
          <div>• Skills</div>
          <div>• Industry Category</div>
          <div>• Career Level</div>
        </div>
      </div>
    </div>
  );
}; 