import { useEffect, useState } from 'react';
import type { 
  JobApplication, 
  JobStatus, 
  RemotePolicy, 
  PriorityLevel, 
  ApplicationSource
} from './jobTypes';
import {
  getJobApplications,
  addJobApplication,
  updateJobApplication,
  deleteJobApplication,
  updateApplicationStatus,
} from './utils/supabaseOperations';
import { useAuth } from './hooks/useAuth';
import { LoginForm, ProfileSetupForm } from './components/AuthForms';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserProfile } from './components/UserProfile';
import { CompanySelector } from './components/CompanySelector';
import { DatabaseErrorBoundary } from './components/DatabaseErrorBoundary';
import { DatabaseStatus } from './components/DatabaseStatus';
import { validateJobApplicationForm } from './utils/validation';

const STATUS_OPTIONS: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
const REMOTE_POLICY_OPTIONS: RemotePolicy[] = ['Remote', 'Hybrid', 'On-site'];
const PRIORITY_OPTIONS: { value: PriorityLevel; label: string }[] = [
  { value: 1, label: 'High' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Low' },
];
const APPLICATION_SOURCE_OPTIONS: ApplicationSource[] = [
  'LinkedIn', 'Indeed', 'Company Website', 'Referral', 'Recruiter',
  'Glassdoor', 'AngelList', 'Handshake', 'Career Fair', 'Other'
];

function emptyJob(): Omit<JobApplication, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: '',
    position: '',
    priority_level: 3,
    notes: '',
    date_applied: new Date().toISOString().slice(0, 10),
    current_status: 'Applied',
  };
}

function JobTracker() {
  const { user, profile, signOut } = useAuth();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [form, setForm] = useState<Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>>(emptyJob());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'All'>('All');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (user && !dataLoaded) {
      loadData();
    }
  }, [user, dataLoaded]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openStatusDropdown && !(event.target as Element).closest('.status-dropdown-container')) {
        setOpenStatusDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openStatusDropdown]);

  // Handle Escape key and browser back button for modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showProfile) {
          setShowProfile(false);
        }
        if (showForm) {
          setShowForm(false);
          setForm(emptyJob());
          setEditingId(null);
          setValidationErrors([]);
        }
        if (showLogoutConfirm) {
          setShowLogoutConfirm(false);
        }
      }
    };

    const handlePopState = () => {
      // Close modals when browser back button is pressed
      if (showProfile || showForm || showLogoutConfirm) {
        setShowProfile(false);
        setShowForm(false);
        setShowLogoutConfirm(false);
        setForm(emptyJob());
        setEditingId(null);
        setValidationErrors([]);
      }
    };

    document.addEventListener('keydown', handleEscape);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showProfile, showForm, showLogoutConfirm]);

  const loadData = async () => {
    if (!user) return;
    
    console.log('loadData called for user:', user.id);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Calling getJobApplications...');
      const jobsData = await getJobApplications(user.id);
      console.log('getJobApplications returned:', jobsData);
      setJobs(jobsData);
      setDataLoaded(true);
    } catch (err) {
      console.error('loadData error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean | undefined = value;
    
    if (type === 'number') {
      processedValue = value === '' ? undefined : Number(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    setForm(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleCompanySelect = (companyId: string) => {
    setForm(prev => ({
      ...prev,
      company_id: companyId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    const validation = validateJobApplicationForm(form);
    if (!validation.isValid) {
      setValidationErrors(validation.errors.map(e => e.message));
      return;
    }
    
    setValidationErrors([]);
    setIsLoading(true);
    setError(null);
    
    try {
      const jobData = {
        ...form,
        user_id: user.id
      };
      
      if (editingId) {
        await updateJobApplication(editingId, jobData);
      } else {
        await addJobApplication(jobData);
      }
      
      // Reload data to ensure we get the latest status from the database
      const updatedJobs = await getJobApplications(user.id);
      setJobs(updatedJobs);
      
      setForm(emptyJob());
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (job: JobApplication) => {
    setForm({
      user_id: job.user_id,
      position: job.position,
      company_id: job.company_id,
      date_applied: job.date_applied,
      current_status: job.current_status || 'Applied',
      priority_level: job.priority_level,
      salary_range_min: job.salary_range_min,
      salary_range_max: job.salary_range_max,
      equity_offered: job.equity_offered,
      benefits_mentioned: job.benefits_mentioned,
      remote_policy: job.remote_policy,
      location: job.location,
      application_source: job.application_source,
      job_posting_url: job.job_posting_url,
      notes: job.notes,
    });
    setEditingId(job.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteJobApplication(id);
      
      // Reload data to ensure we get the latest data from the database
      if (user) {
        const updatedJobs = await getJobApplications(user.id);
        setJobs(updatedJobs);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (job: JobApplication, status: JobStatus) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await updateApplicationStatus(job.id, status);
      
      // Reload data to ensure we get the latest status from the database
      if (user) {
        const updatedJobs = await getJobApplications(user.id);
        setJobs(updatedJobs);
      }
    } catch (err) {
      console.error('Status change error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusClick = (job: JobApplication) => {
    setOpenStatusDropdown(openStatusDropdown === job.id ? null : job.id);
  };

  const handleStatusSelect = async (job: JobApplication, newStatus: JobStatus) => {
    setOpenStatusDropdown(null);
    await handleStatusChange(job, newStatus);
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    setError(null);
    
    try {
      // Close any open modals first
      setShowProfile(false);
      setShowForm(false);
      setShowLogoutConfirm(false);
      
      // Clear any open dropdowns
      setOpenStatusDropdown(null);
      
      // Perform logout
      await signOut();
      
      // Clear local state
      setJobs([]);
      setForm(emptyJob());
      setEditingId(null);
      setSearchTerm('');
      setStatusFilter('All');
      setPriorityFilter('All');
      setDataLoaded(false);
      
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to logout');
    } finally {
      setLogoutLoading(false);
    }
  };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getStatusColor(status: JobStatus) {
    switch (status) {
      case 'Applied': return 'badge-applied';
      case 'Interview': return 'badge-interview';
      case 'Offer': return 'badge-offer';
      case 'Rejected': return 'badge-rejected';
      case 'Withdrawn': return 'badge-withdrawn';
      default: return 'badge-secondary';
    }
  }



  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || job.current_status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || job.priority_level === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.current_status === 'Applied').length,
    interview: jobs.filter(j => j.current_status === 'Interview').length,
    offer: jobs.filter(j => j.current_status === 'Offer').length,
    rejected: jobs.filter(j => j.current_status === 'Rejected').length,
  };

  return (
            <div className="min-h-screen bg-gray-50">
            {/* Header */}
      <header className="bg-white shadow-soft border-b border-gray-200">
        <div className="container-padding">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 sm:py-0 sm:h-16">
            {/* Title and User Info */}
            <div className="flex items-center justify-between sm:justify-start mb-3 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 truncate">Executive Job Tracker</h1>
              <div className="sm:hidden">
                <button
                  onClick={() => {
                    if (!showForm && !showLogoutConfirm) {
                      setShowProfile(true);
                    }
                  }}
                  className="flex items-center space-x-1 text-sm text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 border border-secondary-200 px-2 py-1 rounded-lg transition-all duration-200"
                  disabled={showForm || showLogoutConfirm}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{profile?.first_name} {profile?.last_name}</span>
                </button>
              </div>
            </div>
            
            {/* User Info for Desktop */}
            <div className="hidden sm:block">
              <button
                onClick={() => {
                  if (!showForm && !showLogoutConfirm) {
                    setShowProfile(true);
                  }
                }}
                className="flex items-center space-x-2 text-sm text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 border border-secondary-200 px-3 py-2 rounded-lg transition-all duration-200"
                disabled={showForm || showLogoutConfirm}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{profile?.first_name} {profile?.last_name}</span>
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3">
              <button
                onClick={() => {
                  if (!showProfile && !showLogoutConfirm) {
                    setShowForm(true);
                  }
                }}
                className="btn btn-primary text-sm px-3 py-2"
                disabled={showProfile || showLogoutConfirm}
              >
                <span className="hidden sm:inline">+ Add Application</span>
                <span className="sm:hidden">+ Application</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-padding py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="card">
            <div className="card-body text-center">
              {isLoading ? (
                <>
                  <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-secondary-900">{stats.total}</div>
                  <div className="text-sm text-secondary-600">Total Applications</div>
                </>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              {isLoading ? (
                <>
                  <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary-600">{stats.applied}</div>
                  <div className="text-sm text-secondary-600">Applied</div>
                </>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              {isLoading ? (
                <>
                  <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-accent-600">{stats.interview}</div>
                  <div className="text-sm text-secondary-600">Interviews</div>
                </>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              {isLoading ? (
                <>
                  <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-success-600">{stats.offer}</div>
                  <div className="text-sm text-secondary-600">Offers</div>
                </>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              {isLoading ? (
                <>
                  <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-error-600">{stats.rejected}</div>
                  <div className="text-sm text-secondary-600">Rejected</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search positions or companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'All')}
                  className="form-select"
                >
                  <option value="All">All Statuses</option>
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | 'All')}
                  className="form-select"
                >
                  <option value="All">All Priorities</option>
                  {PRIORITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setPriorityFilter('All');
                  }}
                  className="btn btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card">
            <div className="card-body">
              <div className="text-error-600">{error}</div>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="text-secondary-500 mb-4">
                {jobs.length === 0 ? 'No applications yet' : 'No applications match your filters'}
              </div>
              {jobs.length === 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary"
                >
                  Add Your First Application
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <div key={job.id} className="card hover:shadow-medium transition-shadow duration-200">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900 mb-1">{job.position}</h3>
                      <p className="text-sm text-secondary-600">{job.company?.name || 'Unknown Company'}</p>
                    </div>
                                         <div className="flex items-center space-x-2 relative status-dropdown-container">
                       <button
                         onClick={() => handleStatusClick(job)}
                         className={`badge ${getStatusColor(job.current_status || 'Applied')} cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
                         title="Click to change status"
                       >
                         {job.current_status || 'Applied'}
                         <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                         </svg>
                       </button>
                       
                       {/* Status Dropdown */}
                       {openStatusDropdown === job.id && (
                         <div className="absolute top-full right-0 mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
                           {STATUS_OPTIONS.map(status => (
                             <button
                               key={status}
                               onClick={() => handleStatusSelect(job, status)}
                               className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                                 job.current_status === status
                                   ? 'bg-primary-50 text-primary-700 font-medium'
                                   : 'text-gray-700'
                               } ${status === STATUS_OPTIONS[0] ? 'rounded-t-lg' : ''} ${
                                 status === STATUS_OPTIONS[STATUS_OPTIONS.length - 1] ? 'rounded-b-lg' : ''
                               }`}
                             >
                               {status}
                             </button>
                           ))}
                         </div>
                       )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-secondary-600">
                      <span className="font-medium mr-2">Applied:</span>
                      {formatDate(job.date_applied)}
                    </div>
                                         {job.salary_range_min && job.salary_range_max && (
                       <div className="flex items-center text-sm text-secondary-600">
                         <span className="font-medium mr-2">Salary:</span>
                         ${job.salary_range_min.toLocaleString()} - ${job.salary_range_max.toLocaleString()}
                       </div>
                     )}
                    {job.remote_policy && (
                      <div className="flex items-center text-sm text-secondary-600">
                        <span className="font-medium mr-2">Work Policy:</span>
                        {job.remote_policy}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end pt-3 border-t border-secondary-200">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(job)}
                        className="action-button action-button-edit"
                        title="Edit application"
                      >
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="action-button action-button-delete"
                        title="Delete application"
                      >
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Application Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-large max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-secondary-900">
                  {editingId ? 'Edit Application' : 'Add New Application'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyJob());
                    setEditingId(null);
                    setValidationErrors([]);
                  }}
                  className="btn btn-ghost"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="card-body space-y-6">
              {validationErrors.length > 0 && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-error-700 text-sm">{error}</div>
                  ))}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Position Title *
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={form.position}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="e.g., Senior Product Manager"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Date Applied *
                    </label>
                    <input
                      type="date"
                      name="date_applied"
                      value={form.date_applied}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Company *
                  </label>
                  <CompanySelector
                    onCompanySelect={handleCompanySelect}
                    placeholder="Search or create company..."
                    className="w-full"
                  />
                </div>
              </div>

              {/* Compensation & Benefits */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
                  Compensation & Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <div>
                     <label className="block text-sm font-medium text-secondary-700 mb-2">
                       Salary Range (Min)
                     </label>
                     <input
                       type="number"
                       name="salary_range_min"
                       value={form.salary_range_min || ''}
                       onChange={handleChange}
                       className="form-input"
                       placeholder="e.g., 120000"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-secondary-700 mb-2">
                       Salary Range (Max)
                     </label>
                     <input
                       type="number"
                       name="salary_range_max"
                       value={form.salary_range_max || ''}
                       onChange={handleChange}
                       className="form-input"
                       placeholder="e.g., 180000"
                     />
                   </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Equity Offered
                    </label>
                                         <input
                       type="text"
                       name="equity_details"
                       value={form.equity_details || ''}
                       onChange={handleChange}
                       className="form-input"
                       placeholder="e.g., 0.5%"
                     />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Benefits Offered
                  </label>
                  <textarea
                    name="benefits_mentioned"
                    value={form.benefits_mentioned || ''}
                    onChange={handleChange}
                    className="form-textarea"
                    rows={3}
                    placeholder="Health insurance, 401k, etc."
                  />
                </div>
              </div>

              {/* Location & Work Policy */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
                  Location & Work Policy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Remote Policy
                    </label>
                    <select
                      name="remote_policy"
                      value={form.remote_policy || ''}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select policy...</option>
                      {REMOTE_POLICY_OPTIONS.map(policy => (
                        <option key={policy} value={policy}>{policy}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={form.location || ''}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900 border-b border-secondary-200 pb-2">
                  Application Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Application Source
                    </label>
                    <select
                      name="application_source"
                      value={form.application_source || ''}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select source...</option>
                      {APPLICATION_SOURCE_OPTIONS.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      name="priority_level"
                      value={form.priority_level}
                      onChange={handleChange}
                      className="form-select"
                    >
                      {PRIORITY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Job URL
                  </label>
                  <input
                    type="url"
                    name="job_posting_url"
                    value={form.job_posting_url || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes || ''}
                    onChange={handleChange}
                    className="form-textarea"
                    rows={4}
                    placeholder="Additional notes, interview details, etc."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyJob());
                    setEditingId(null);
                    setValidationErrors([]);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                  ) : null}
                  {editingId ? 'Update Application' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowProfile(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-large max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="card-header sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-secondary-900">Profile</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="btn btn-ghost text-error-600 hover:text-error-700 hover:bg-error-50"
                    disabled={logoutLoading}
                  >
                    {logoutLoading ? (
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    )}
                    Logout
                  </button>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="btn btn-ghost"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <UserProfile />
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-large max-w-md w-full">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-secondary-900">Confirm Logout</h2>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn btn-ghost"
                  disabled={logoutLoading}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100 mb-4">
                  <svg className="h-6 w-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Are you sure you want to logout?</h3>
                <p className="text-secondary-600 mb-6">
                  You will be signed out of your account and redirected to the login page.
                </p>
                {error && (
                  <div className="bg-error-50 border border-error-200 rounded-lg p-3 mb-4">
                    <div className="text-error-700 text-sm">{error}</div>
                  </div>
                )}
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="btn btn-secondary"
                    disabled={logoutLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="btn btn-error"
                  >
                    {logoutLoading ? (
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    )}
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const { user, profile, loading, profileLoading } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);

  console.log('App render state:', { user, profile, loading, profileLoading });

  // Check if we're in demo mode (no Supabase connection)
  useEffect(() => {
    console.log('App environment check:', {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    });
    
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.log('Setting demo mode to true');
      setIsDemoMode(true);
    } else {
      console.log('Environment variables found, demo mode false');
      setIsDemoMode(false);
    }
  }, []);

  // Optimized loading state - show loading only for initial auth check
  useEffect(() => {
    console.log('Profile setup effect:', { user, profile, profileLoading });
    if (user && !profile && !profileLoading) {
      console.log('Setting up profile setup form');
      // This will be handled by the AuthContext
    }
  }, [user, profile, profileLoading]);
  // Progressive loading for better Lighthouse performance
  if (loading) {
    console.log('Showing progressive loading state');
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Show skeleton UI immediately for better perceived performance */}
        <header className="bg-white shadow-soft border-b border-gray-200">
          <div className="container-padding">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-secondary-900">Executive Job Tracker</h1>
                <div className="hidden sm:block">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container-padding py-8">
          {/* Skeleton stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card">
                <div className="card-body text-center">
                  <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Skeleton job cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Show login screen for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full">
          <div className="card-header text-center">
            <h1 className="text-2xl font-bold text-secondary-900">Executive Job Tracker</h1>
            <p className="text-secondary-600 mt-2">Sign in to manage your job applications</p>
          </div>
          <div className="card-body">
            <LoginForm onAuthSuccess={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  // Show profile setup only if user exists but no profile (and not still loading profile)
  if (!profile && !profileLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full">
          <div className="card-header text-center">
            <h1 className="text-2xl font-bold text-secondary-900">Complete Your Profile</h1>
            <p className="text-secondary-600 mt-2">Set up your professional profile to get started</p>
          </div>
          <div className="card-body">
            <ProfileSetupForm onComplete={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  // Show main app for authenticated users with profiles
  return (
    <ProtectedRoute>
      {isDemoMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> This is a demo version. To use the full app, configure Supabase environment variables.
              </p>
            </div>
          </div>
        </div>
      )}
      <DatabaseErrorBoundary>
        <DatabaseStatus />
        <JobTracker />
      </DatabaseErrorBoundary>
    </ProtectedRoute>
  );
}

export default App;