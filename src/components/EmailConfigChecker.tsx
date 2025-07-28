import React, { useState } from 'react';
import { emailService } from '../utils/emailService';

interface EmailConfigCheckerProps {
  adminEmail: string;
}

export const EmailConfigChecker: React.FC<EmailConfigCheckerProps> = ({ adminEmail }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const configStatus = emailService.getConfigStatus();

  const handleTestEmail = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await emailService.sendBetaUserNotification({
        adminEmail,
        newBetaUsers: ['test@example.com'],
        totalCount: 1
      });

      setTestResult({
        success: result,
        message: result 
          ? 'Test email sent successfully! Check your inbox.' 
          : 'Failed to send test email. Check console for details.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Email Configuration Status</h3>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Email Service Enabled:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            configStatus.enabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {configStatus.enabled ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">API Key Configured:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            configStatus.hasApiKey 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {configStatus.hasApiKey ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">From Email Configured:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            configStatus.hasFromEmail 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {configStatus.hasFromEmail ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {!configStatus.enabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Email notifications not configured
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  To receive email notifications when new beta users are added, you need to:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Set up an email service (Resend recommended)</li>
                  <li>Add <code className="bg-yellow-100 px-1 rounded">VITE_EMAIL_API_KEY</code> to your environment variables</li>
                  <li>Add <code className="bg-yellow-100 px-1 rounded">VITE_FROM_EMAIL</code> to your environment variables</li>
                </ul>
                <p className="mt-2">
                  See <code className="bg-yellow-100 px-1 rounded">EMAIL_SETUP_GUIDE.md</code> for detailed instructions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {configStatus.enabled && (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={handleTestEmail}
            disabled={isTesting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTesting ? 'Sending Test Email...' : 'Send Test Email'}
          </button>
          
          {testResult && (
            <div className={`mt-3 p-3 rounded-md ${
              testResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {testResult.success ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};