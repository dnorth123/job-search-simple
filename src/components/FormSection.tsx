import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  children, 
  className = "" 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
        {title}
      </h3>
      <div className="space-y-4 md:space-y-6">
        {/* Single column on mobile, smart grouping on desktop */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}; 