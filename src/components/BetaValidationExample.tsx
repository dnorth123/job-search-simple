import React, { useState } from 'react';
import { useBetaValidation } from '../hooks/useBetaValidation';

export const BetaValidationExample: React.FC = () => {
  const [email, setEmail] = useState('');
  const [validationResult, setValidationResult] = useState<string>('');
  
  const {
    isLoading,
    error,
    validateBetaAccess,
    markBetaInviteUsed,
    clearError
  } = useBetaValidation();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    clearError();
    setValidationResult('');
  };

  const handleValidateAccess = async () => {
    if (!email.trim()) {
      setValidationResult('Please enter an email address');
      return;
    }

    const result = await validateBetaAccess(email);
    
    if (result.isValid) {
      setValidationResult('✅ Beta access validated! You can proceed with registration.');
    } else {
      setValidationResult(`❌ ${result.error}`);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!email.trim()) {
      setValidationResult('Please enter an email address first');
      return;
    }

    // Simulate registration process
    const success = await markBetaInviteUsed(email);
    
    if (success) {
      setValidationResult('✅ Registration completed! Beta invite marked as used.');
      setEmail(''); // Clear form
    } else {
      setValidationResult('❌ Failed to complete registration. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Beta Access Validation</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {validationResult && (
          <div className={`p-3 rounded-md ${
            validationResult.includes('✅') 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {validationResult}
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={handleValidateAccess}
            disabled={isLoading || !email.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Validating...' : 'Validate Beta Access'}
          </button>
          
          <button
            onClick={handleCompleteRegistration}
            disabled={isLoading || !email.trim()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Complete Registration'}
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Enter an email address to check beta access</li>
          <li>• The system validates against the beta_invites table</li>
          <li>• Checks if the invite exists and hasn't been used</li>
          <li>• After successful registration, marks the invite as used</li>
        </ul>
      </div>
    </div>
  );
}; 