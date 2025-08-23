import React from 'react';
import { X, ExternalLink, Building2, MapPin, DollarSign } from 'lucide-react';
import type { JobApplication } from '../jobTypes';

interface JobDescriptionModalProps {
  application: JobApplication;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDescriptionModal: React.FC<JobDescriptionModalProps> = ({
  application,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const formatJobDescription = (description: string) => {
    // Try to parse as JSON first for structured data
    try {
      const structured = JSON.parse(description);
      return renderStructuredJobDescription(structured);
    } catch {
      // Fall back to plain text formatting
      return renderPlainTextJobDescription(description);
    }
  };

  const renderStructuredJobDescription = (data: any) => {
    return (
      <div className="space-y-6">
        {/* Job Overview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Overview</h3>
          {data.summary && (
            <p className="text-gray-700 leading-relaxed">{data.summary}</p>
          )}
        </div>

        {/* Responsibilities */}
        {data.responsibilities && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Responsibilities</h3>
            {Array.isArray(data.responsibilities) ? (
              <ul className="space-y-2">
                {data.responsibilities.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1.5 text-xs">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-700 whitespace-pre-line">{data.responsibilities}</div>
            )}
          </div>
        )}

        {/* Requirements */}
        {data.requirements && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
            {Array.isArray(data.requirements) ? (
              <ul className="space-y-2">
                {data.requirements.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1.5 text-xs">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-700 whitespace-pre-line">{data.requirements}</div>
            )}
          </div>
        )}

        {/* Preferred Qualifications */}
        {data.preferred && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferred Qualifications</h3>
            {Array.isArray(data.preferred) ? (
              <ul className="space-y-2">
                {data.preferred.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-500 mr-2 mt-1.5 text-xs">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-700 whitespace-pre-line">{data.preferred}</div>
            )}
          </div>
        )}

        {/* Benefits */}
        {data.benefits && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
            {Array.isArray(data.benefits) ? (
              <ul className="space-y-2">
                {data.benefits.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1.5 text-xs">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-700 whitespace-pre-line">{data.benefits}</div>
            )}
          </div>
        )}

        {/* Additional Sections */}
        {Object.entries(data).map(([key, value]) => {
          if (['summary', 'responsibilities', 'requirements', 'preferred', 'benefits'].includes(key)) {
            return null;
          }
          
          if (typeof value === 'string' && value.trim()) {
            return (
              <div key={key}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                  {key.replace(/_/g, ' ')}
                </h3>
                <div className="text-gray-700 whitespace-pre-line">{value}</div>
              </div>
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  const renderPlainTextJobDescription = (description: string) => {
    // Enhanced plain text formatting
    const sections = description.split(/\n\s*\n/);
    
    return (
      <div className="space-y-6">
        {sections.map((section, index) => {
          const lines = section.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) return null;
          
          // Check if first line looks like a header (short, maybe with special chars)
          const firstLine = lines[0];
          const isHeader = firstLine.length < 50 && 
                          (firstLine.includes(':') || 
                           firstLine.match(/^[A-Z\s]+$/) ||
                           firstLine.match(/^[A-Z][A-Za-z\s]*$/));
          
          if (isHeader && lines.length > 1) {
            return (
              <div key={index}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {firstLine.replace(':', '')}
                </h3>
                <div className="space-y-2">
                  {lines.slice(1).map((line, lineIndex) => {
                    const trimmed = line.trim();
                    
                    // Check if line is a bullet point
                    if (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
                      return (
                        <div key={lineIndex} className="flex items-start">
                          <span className="text-blue-500 mr-2 mt-1.5 text-xs">•</span>
                          <span className="text-gray-700">{trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '')}</span>
                        </div>
                      );
                    }
                    
                    return (
                      <p key={lineIndex} className="text-gray-700">{trimmed}</p>
                    );
                  })}
                </div>
              </div>
            );
          } else {
            // Regular paragraph
            return (
              <div key={index} className="space-y-2">
                {lines.map((line, lineIndex) => {
                  const trimmed = line.trim();
                  
                  if (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
                    return (
                      <div key={lineIndex} className="flex items-start">
                        <span className="text-blue-500 mr-2 mt-1.5 text-xs">•</span>
                        <span className="text-gray-700">{trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '')}</span>
                      </div>
                    );
                  }
                  
                  return (
                    <p key={lineIndex} className="text-gray-700">{trimmed}</p>
                  );
                })}
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {application.position}
              </h2>
              
              {/* Job Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {application.company && (
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    {application.company.name}
                  </div>
                )}
                
                {application.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {application.location}
                  </div>
                )}
                
                {(application.salary_range_min || application.salary_range_max) && (
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {application.salary_range_min && application.salary_range_max 
                      ? `$${application.salary_range_min.toLocaleString()} - $${application.salary_range_max.toLocaleString()}`
                      : application.salary_range_min 
                      ? `$${application.salary_range_min.toLocaleString()}+`
                      : `Up to $${application.salary_range_max?.toLocaleString()}`
                    }
                  </div>
                )}
              </div>
              
              {/* Job Posting Link */}
              {application.job_posting_url && (
                <div className="mt-3">
                  <a
                    href={application.job_posting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Original Posting
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {application.job_description ? (
            formatJobDescription(application.job_description)
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg">No job description available</p>
              <p className="text-sm mt-2">Upload application data with job description to view it here.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};