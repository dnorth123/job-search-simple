import React, { useState, useEffect } from 'react';
import type { JobApplication, JobStatus } from '../jobTypes';

interface JobCardProps {
  job: JobApplication;
  onEdit: (job: JobApplication) => void;
  openStatusDropdown: string | null;
  onStatusClick: (job: JobApplication) => void;
  onStatusSelect: (job: JobApplication, status: JobStatus) => Promise<void>;
  onViewJobDescription?: (job: JobApplication) => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS: JobStatus[] = ['Pre-application', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onEdit,
  openStatusDropdown,
  onStatusClick,
  onStatusSelect,
  onViewJobDescription,
  isLoading = false
}) => {
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'Pre-application': return 'badge-pre-application';
      case 'Applied': return 'badge-applied';
      case 'Interview': return 'badge-interview';
      case 'Offer': return 'badge-offer';
      case 'Rejected': return 'badge-rejected';
      case 'Withdrawn': return 'badge-withdrawn';
      default: return 'badge-secondary';
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min || !max) return null;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  // Function to fetch page title from URL
  const fetchPageTitle = async (url: string) => {
    if (!url) return;
    
    setIsLoadingTitle(true);
    try {
      // Use a CORS proxy to fetch the page title
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const title = doc.querySelector('title')?.textContent || 'Job Posting';
        setPageTitle(title);
      } else {
        setPageTitle('Job Posting');
      }
    } catch (error) {
      console.error('Error fetching page title:', error);
      setPageTitle('Job Posting');
    } finally {
      setIsLoadingTitle(false);
    }
  };

  // Fetch page title when job URL changes
  useEffect(() => {
    if (job.job_posting_url) {
      fetchPageTitle(job.job_posting_url);
    }
  }, [job.job_posting_url]);



  const handleJobUrlClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (job.job_posting_url) {
      window.open(job.job_posting_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={`job-card ${isLoading ? 'loading' : ''} ${job.archived ? 'archived' : ''}`}
      data-status={job.current_status || 'Applied'}
    >
      {/* Executive Header with Edit Button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className={`font-bold mb-2 ${job.archived ? 'text-neutral-500' : 'text-executive-primary'}`}>
            {job.position}
          </h2>
          <div className={`company ${job.archived ? 'text-neutral-400' : 'text-intelligence-primary'}`}>
            {job.company?.name || 'Unknown Company'}
          </div>
        </div>
        
        {/* Subtle Edit Button in Top-Right */}
        <button
          onClick={() => onEdit(job)}
          className="flex-shrink-0 ml-3 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          title="Edit application"
          disabled={isLoading}
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Executive Metadata Grid */}
      <div className="metadata">
        <div className="metadata-item">
          <span className="label">Applied:</span>
          <span className="value">{formatDate(job.date_applied)}</span>
        </div>
        
        {job.job_posting_url && (
          <div className="metadata-item">
            <span className="label">Job Posting:</span>
            <span className="value">
              <a
                href={job.job_posting_url}
                onClick={handleJobUrlClick}
                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
                title={job.job_posting_url}
              >
                {isLoadingTitle ? (
                  <span className="text-gray-500">Loading...</span>
                ) : (
                  <>
                    <span className="truncate">
                      {pageTitle || 'Job Posting'}
                    </span>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </>
                )}
              </a>
            </span>
          </div>
        )}
        
        {formatSalary(job.salary_range_min, job.salary_range_max) && (
          <div className="metadata-item">
            <span className="label">Salary Range:</span>
            <span className="value">{formatSalary(job.salary_range_min, job.salary_range_max)}</span>
          </div>
        )}
        
        {job.remote_policy && (
          <div className="metadata-item">
            <span className="label">Work Policy:</span>
            <span className="value">{job.remote_policy}</span>
          </div>
        )}
        
        {job.location && (
          <div className="metadata-item">
            <span className="label">Location:</span>
            <span className="value">{job.location}</span>
          </div>
        )}
        
        {job.application_source && (
          <div className="metadata-item">
            <span className="label">Source:</span>
            <span className="value">{job.application_source}</span>
          </div>
        )}
        
        {job.job_req_id && (
          <div className="metadata-item">
            <span className="label">Req ID:</span>
            <span className="value">{job.job_req_id}</span>
          </div>
        )}
        
        {job.job_description && onViewJobDescription && (
          <div className="metadata-item">
            <span className="label">Job Description:</span>
            <span className="value">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewJobDescription(job);
                }}
                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                title="View job description"
              >
                <span>View Details</span>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </span>
          </div>
        )}
      </div>

                        {/* Archived Indicator in Bottom Left */}
                  {job.archived && (
                    <div className="absolute bottom-6 left-4">
                      <div className="archived-indicator">
                        <span className="archived-text">Archived</span>
                      </div>
                    </div>
                  )}

                  {/* Status Badge in Bottom Right */}
                  <div className="absolute bottom-6 right-4">
                    <div className="relative status-dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusClick(job);
                        }}
                        className={`status-badge !relative !top-auto !right-auto ${job.archived ? 'badge-archived' : getStatusColor(job.current_status || 'Applied')} ${
                          openStatusDropdown === job.id ? 'open' : ''
                        }`}
                        title="Click to change status"
                      >
                        {job.current_status || 'Applied'}
                      </button>
          
          {openStatusDropdown === job.id && (
            <div className="status-dropdown">
              {/* Status dropdown options */}
              {STATUS_OPTIONS.map(status => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusSelect(job, status);
                  }}
                  className={`status-dropdown-item ${
                    job.current_status === status ? 'active' : ''
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 