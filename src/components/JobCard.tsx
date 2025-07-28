import React from 'react';
import type { JobApplication, JobStatus } from '../jobTypes';

interface JobCardProps {
  job: JobApplication;
  onEdit: (job: JobApplication) => void;
  openStatusDropdown: string | null;
  onStatusClick: (job: JobApplication) => void;
  onStatusSelect: (job: JobApplication, status: JobStatus) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_OPTIONS: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onEdit,
  openStatusDropdown,
  onStatusClick,
  onStatusSelect,
  isLoading = false
}) => {

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
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



  return (
    <div 
      className={`job-card ${isLoading ? 'loading' : ''}`}
      data-status={job.current_status || 'Applied'}
    >
      {/* Executive Header with Edit Button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-executive-primary font-bold mb-2">
            {job.position}
          </h2>
          <div className="company text-intelligence-primary">
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
      </div>

      {/* Status Badge in Bottom Right */}
      <div className="absolute bottom-6 right-4">
        <div className="relative status-dropdown-container">
          <button
            onClick={() => onStatusClick(job)}
            className={`status-badge ${getStatusColor(job.current_status || 'Applied')} ${
              openStatusDropdown === job.id ? 'open' : ''
            }`}
            title="Click to change status"
          >
            {job.current_status || 'Applied'}
          </button>
          
          {openStatusDropdown === job.id && (
            <div className="status-dropdown">
              {STATUS_OPTIONS.map(status => (
                <button
                  key={status}
                  onClick={() => onStatusSelect(job, status)}
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