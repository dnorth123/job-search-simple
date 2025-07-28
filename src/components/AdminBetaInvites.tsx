import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';

interface BetaInvite {
  id: string;
  email: string;
  used_at: string | null;
  created_at: string;
  expires_at?: string;
  invited_by?: string;
  notes?: string;
}

interface AdminStats {
  total: number;
  used: number;
  available: number;
}

interface AdminBetaInvitesProps {
  onNavigateBack: () => void;
}

export const AdminBetaInvites: React.FC<AdminBetaInvitesProps> = ({ onNavigateBack }) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<BetaInvite[]>([]);
  const [stats, setStats] = useState<AdminStats>({ total: 0, used: 0, available: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newEmails, setNewEmails] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Admin email check
  const ADMIN_EMAIL = 'dan.northington@gmail.com';

  useEffect(() => {
    console.log('AdminBetaInvites: user changed', { user: user?.email });
    if (user) {
      const isAdmin = user.email === ADMIN_EMAIL;
      console.log('AdminBetaInvites: admin check', { userEmail: user.email, isAdmin });
      setIsAuthorized(isAdmin);
      
      if (isAdmin) {
        console.log('AdminBetaInvites: loading invites');
        loadInvites();
      }
    }
  }, [user]);

  const loadInvites = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('beta_invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching beta invites:', fetchError);
        setError('Failed to load beta invites. Please try again.');
        return;
      }

      setInvites(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error('Error loading beta invites:', err);
      setError('Failed to load beta invites. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateStats = useCallback((inviteList: BetaInvite[]) => {
    const total = inviteList.length;
    const used = inviteList.filter(invite => invite.used_at).length;
    const available = total - used;

    setStats({ total, used, available });
  }, []);

  const validateEmails = useCallback((emailString: string): string[] => {
    const emails = emailString
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    emails.forEach(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        validEmails.push(email.toLowerCase());
      } else {
        invalidEmails.push(email);
      }
    });

    if (invalidEmails.length > 0) {
      setError(`Invalid email format: ${invalidEmails.join(', ')}`);
      return [];
    }

    return validEmails;
  }, []);

  const addInvites = useCallback(async () => {
    if (!newEmails.trim()) {
      setError('Please enter at least one email address.');
      return;
    }

    const validEmails = validateEmails(newEmails);
    if (validEmails.length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Check for duplicates
      const existingEmails = invites.map(invite => invite.email.toLowerCase());
      const duplicates = validEmails.filter(email => existingEmails.includes(email));
      
      if (duplicates.length > 0) {
        setError(`Duplicate emails found: ${duplicates.join(', ')}`);
        return;
      }

      // Insert new invites
      const newInvites = validEmails.map(email => ({
        email,
        invited_by: user?.email || 'admin',
        notes: 'Added via admin interface'
      }));

      const { error: insertError } = await supabase
        .from('beta_invites')
        .insert(newInvites);

      if (insertError) {
        console.error('Error adding beta invites:', insertError);
        setError('Failed to add beta invites. Please try again.');
        return;
      }

      setSuccess(`Successfully added ${validEmails.length} beta invite(s).`);
      setNewEmails('');
      await loadInvites();
    } catch (err) {
      console.error('Error adding beta invites:', err);
      setError('Failed to add beta invites. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [newEmails, invites, user, validateEmails, loadInvites]);

  const deleteInvite = useCallback(async (inviteId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('beta_invites')
        .delete()
        .eq('id', inviteId);

      if (deleteError) {
        console.error('Error deleting beta invite:', deleteError);
        setError('Failed to delete beta invite. Please try again.');
        return;
      }

      setSuccess('Beta invite deleted successfully.');
      setShowDeleteConfirm(null);
      await loadInvites();
    } catch (err) {
      console.error('Error deleting beta invite:', err);
      setError('Failed to delete beta invite. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [loadInvites]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Show unauthorized message if not admin
  if (user && !isAuthorized) {
    console.log('AdminBetaInvites: showing access denied');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the admin interface.
            </p>
            <button
              onClick={onNavigateBack}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin interface...</p>
        </div>
      </div>
    );
  }

  console.log('AdminBetaInvites: rendering main interface');
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateBack}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Beta Invites Admin</h1>
            </div>
            <div className="text-sm text-gray-500">
              Admin: {user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {(error || success) && (
          <div className="mb-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={clearMessages}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={clearMessages}
                      className="text-green-400 hover:text-green-600"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Invites</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.available}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Used</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.used}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Invites Form */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Add New Beta Invites</h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Addresses (one per line)
                </label>
                <textarea
                  id="emails"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email addresses, one per line&#10;example@email.com&#10;another@email.com"
                  value={newEmails}
                  onChange={(e) => setNewEmails(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={addInvites}
                  disabled={isSubmitting || !newEmails.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Adding...' : 'Add Invites'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invites Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Beta Invites</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invite.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        invite.used_at 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {invite.used_at ? 'Used' : 'Available'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invite.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.used_at ? formatDate(invite.used_at) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.expires_at ? formatDate(invite.expires_at) : 'No expiry'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!invite.used_at && (
                        <button
                          onClick={() => setShowDeleteConfirm(invite.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invites.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No beta invites found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this beta invite? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteInvite(showDeleteConfirm)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 