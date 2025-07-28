import React, { useState, useRef } from 'react';
import { parseJobDescription, extractTextFromFile, validateFile } from '../utils/jobDescriptionParser';
import type { ParsedJobData } from '../utils/jobDescriptionParser';

interface JobDescriptionUploadProps {
  onDataExtracted: (data: ParsedJobData) => void;
}

export const JobDescriptionUpload: React.FC<JobDescriptionUploadProps> = ({
  onDataExtracted
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
    try {
      const parsedData = parseJobDescription(textInput);
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
        <h4 className="text-lg font-medium text-neutral-900 mb-2">
          Upload Job Description
        </h4>
        <p className="text-sm text-neutral-600 mb-4">
          Upload a job description file or paste the text to automatically extract information
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
              Supports: TXT, MD, PDF, DOC, DOCX (max 5MB)
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
            accept=".txt,.md,.pdf,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      {/* Text Input Alternative */}
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-sm text-neutral-600">Or paste job description text:</p>
        </div>
        
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste the job description text here..."
          className="form-textarea w-full h-32 resize-none"
          disabled={isUploading}
        />
        
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