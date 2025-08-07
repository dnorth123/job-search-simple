import { useEffect, useState } from 'react';
import type { 
  JobApplication, 
  JobStatus, 
  RemotePolicy, 
  ApplicationSource,
  Todo,
  TodoPriority,
  TodoCategory
} from './jobTypes';
import {
  getJobApplications,
  addJobApplication,
  updateJobApplication,
  updateApplicationStatus,
  searchCompanies,
  createCompany,
  deleteJobApplication,
  getTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  toggleTodoComplete,
} from './utils/supabaseOperations';
import { useAuth } from './hooks/useAuth';
import { LoginForm, SignupForm, ProfileSetupForm } from './components/AuthForms';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserProfile } from './components/UserProfile';
import { CompanySelector } from './components/CompanySelector';
import { DatabaseErrorBoundary } from './components/DatabaseErrorBoundary';
import { DatabaseStatus } from './components/DatabaseStatus';
import { AdminBetaInvites } from './components/AdminBetaInvites';
import { JobCard } from './components/JobCard';
import { JobDescriptionUpload } from './components/JobDescriptionUpload';

import { TodoForm } from './components/TodoForm';
import { TodoList } from './components/TodoList';
import { TodoFilters } from './components/TodoFilters';
import { validateJobApplicationForm } from './utils/validation';
import { initializeEmailService } from './utils/emailService';

const STATUS_OPTIONS: JobStatus[] = ['Pre-application', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
const REMOTE_POLICY_OPTIONS: RemotePolicy[] = ['Remote', 'Hybrid', 'On-site'];

const APPLICATION_SOURCE_OPTIONS: ApplicationSource[] = [
  'LinkedIn', 'Indeed', 'Company Website', 'Referral', 'Recruiter',
  'Glassdoor', 'AngelList', 'Handshake', 'Career Fair', 'Other'
];

function emptyJob(): Omit<JobApplication, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: '',
    position: '',
    notes: '',
    date_applied: new Date().toISOString().slice(0, 10),
    current_status: 'Applied',
    priority_level: 3,
    archived: false,
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showJobUpload, setShowJobUpload] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Todo state
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [todoFilters, setTodoFilters] = useState({
    showCompleted: false,
    priority: 'All' as TodoPriority | 'All',
    category: 'All' as TodoCategory | 'All'
  });

  // Admin check
  const isAdmin = user?.email === 'dan.northington@gmail.com';
  
  // Debug admin status
  console.log('Admin check:', { userEmail: user?.email, isAdmin });

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
        if (showTodoForm) {
          setShowTodoForm(false);
          setEditingTodo(null);
        }
        if (showLogoutConfirm) {
          setShowLogoutConfirm(false);
        }
        if (showAdmin) {
          setShowAdmin(false);
        }
      }
    };

    const handlePopState = () => {
      // Close modals when browser back button is pressed
      if (showProfile || showForm || showTodoForm || showLogoutConfirm || showAdmin) {
        setShowProfile(false);
        setShowForm(false);
        setShowTodoForm(false);
        setShowLogoutConfirm(false);
        setShowAdmin(false);
        setForm(emptyJob());
        setEditingId(null);
        setEditingTodo(null);
        setValidationErrors([]);
      }
    };

    document.addEventListener('keydown', handleEscape);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showProfile, showForm, showTodoForm, showLogoutConfirm, showAdmin]);

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
      
      console.log('Calling getTodos...');
      const todosData = await getTodos(user.id);
      console.log('getTodos returned:', todosData);
      setTodos(todosData);
      
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

  // Debug form state changes
  useEffect(() => {
    console.log('Form state changed - company_id:', form.company_id);
  }, [form.company_id]);

  const handleJobDataExtracted = async (data: { position?: string; company?: string; location?: string; salary_range_min?: number; salary_range_max?: number; remote_policy?: RemotePolicy; application_source?: ApplicationSource; job_req_id?: string; benefits_mentioned?: string; equity_offered?: boolean; equity_details?: string; notes?: string }) => {
    console.log('handleJobDataExtracted called with data:', data);
    
    // Update form with extracted data
    setForm(prev => ({
      ...prev,
      position: data.position || prev.position,
      location: data.location || prev.location,
      salary_range_min: data.salary_range_min || prev.salary_range_min,
      salary_range_max: data.salary_range_max || prev.salary_range_max,
      remote_policy: data.remote_policy || prev.remote_policy,
      application_source: data.application_source || prev.application_source,
      job_req_id: data.job_req_id || prev.job_req_id,
      benefits_mentioned: data.benefits_mentioned || prev.benefits_mentioned,
      equity_offered: data.equity_offered || prev.equity_offered,
      equity_details: data.equity_details || prev.equity_details,
      notes: data.notes || prev.notes,
    }));
    
    // If company name was extracted, try to find or create the company
    if (data.company) {
      console.log('Company found in parsed data:', data.company);
      try {
        await handleCompanyFromParsedData(data.company);
      } catch (error) {
        console.error('Error handling company from parsed data:', error);
      }
    } else {
      console.log('No company found in parsed data');
    }
    
    setShowJobUpload(false);
  };

  const handleCompanyFromParsedData = async (companyName: string) => {
    console.log('handleCompanyFromParsedData called with:', companyName);
    try {
      // First, try to search for existing company
      console.log('Searching for existing company...');
      const existingCompanies = await searchCompanies(companyName);
      console.log('Existing companies found:', existingCompanies);
      
      const exactMatch = existingCompanies.find(company => 
        company.name.toLowerCase() === companyName.toLowerCase()
      );
      console.log('Exact match found:', exactMatch);
      
      if (exactMatch) {
        // Use existing company
        console.log('Using existing company:', exactMatch);
        handleCompanySelect(exactMatch.id);
      } else {
        // Create new company
        console.log('Creating new company:', companyName);
        const newCompany = await createCompany({
          name: companyName,
          industry_category: undefined,
          company_size_range: undefined,
          headquarters_location: '',
          website_url: '',
          linkedin_url: '',
          description: '',
          founded_year: undefined,
          funding_stage: '',
        });
        console.log('New company created:', newCompany);
        handleCompanySelect(newCompany.id);
      }
    } catch (error) {
      console.error('Error handling company from parsed data:', error);
      // If there's an error, we'll just leave the company field empty
      // The user can manually select/create the company
    }
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
    console.log('Editing job with company_id:', job.company_id);
    console.log('Full job object:', job);
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
      job_req_id: job.job_req_id,
      notes: job.notes,
      archived: job.archived || false,
    });
    console.log('Form set with company_id:', job.company_id);
    setEditingId(job.id);
    setShowForm(true);
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
      setDataLoaded(false);
      
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to logout');
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId || !user) return;
    
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteJobApplication(editingId);
      
      // Reload data to ensure we get the latest status from the database
      const updatedJobs = await getJobApplications(user.id);
      setJobs(updatedJobs);
      
      setForm(emptyJob());
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete application');
    } finally {
      setIsLoading(false);
    }
  };

  // ====== TODO HANDLERS ======

  const handleAddTodo = () => {
    setEditingTodo(null);
    setShowTodoForm(true);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setShowTodoForm(true);
  };

  const handleSaveTodo = async (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const todoWithUserId = {
        ...todoData,
        user_id: user.id
      };
      
      if (editingTodo) {
        // Update existing todo
        const updatedTodo = await updateTodo(editingTodo.id, todoWithUserId);
        setTodos(prev => prev.map(todo => todo.id === editingTodo.id ? updatedTodo : todo));
      } else {
        // Add new todo
        const newTodo = await addTodo(todoWithUserId);
        setTodos(prev => [newTodo, ...prev]);
      }
      
      setShowTodoForm(false);
      setEditingTodo(null);
    } catch (err) {
      console.error('Todo save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save todo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedTodo = await toggleTodoComplete(todo.id, !todo.completed);
      setTodos(prev => prev.map(t => t.id === todo.id ? updatedTodo : t));
    } catch (err) {
      console.error('Todo toggle error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTodo = async (todo: Todo) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this todo? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteTodo(todo.id);
      setTodos(prev => prev.filter(t => t.id !== todo.id));
    } catch (err) {
      console.error('Todo delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTodoFiltersChange = (filters: Partial<typeof todoFilters>) => {
    setTodoFilters(prev => ({ ...prev, ...filters }));
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || job.current_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeJobs = filteredJobs.filter(job => !job.archived);
  const archivedJobs = showArchived ? filteredJobs.filter(job => job.archived) : [];

  const stats = {
    total: jobs.length,
    preApplication: jobs.filter(j => j.current_status === 'Pre-application').length,
    applied: jobs.filter(j => j.current_status === 'Applied').length,
    interview: jobs.filter(j => j.current_status === 'Interview').length,
    offer: jobs.filter(j => j.current_status === 'Offer').length,
    rejected: jobs.filter(j => j.current_status === 'Rejected').length,
    archived: jobs.filter(j => j.archived).length,
  };

  return (
            <div className="min-h-screen bg-neutral-50">
            {/* Header */}
      <header className="bg-white shadow-executive border-b border-neutral-200">
        <div className="container-padding">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 sm:py-0 sm:h-16">
            {/* Title */}
            <div className="flex items-center justify-between sm:justify-start mb-3 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 truncate">Executive Job Tracker</h1>
            </div>
            
            {/* Action Buttons and User Info */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3">
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowAdmin(true);
                  }}
                  className="btn btn-secondary text-sm px-3 py-2"
                  disabled={showProfile || showLogoutConfirm}
                >
                  <span className="hidden sm:inline">Admin</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              )}
              
              {/* User Info for Desktop */}
              <div className="hidden sm:block">
                <button
                  onClick={() => {
                    if (!showForm && !showLogoutConfirm) {
                      setShowProfile(true);
                    }
                  }}
                  className="flex items-center space-x-2 text-sm text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50 border border-neutral-200 px-3 py-2 rounded-lg transition-all duration-200"
                  disabled={showForm || showLogoutConfirm}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{profile?.first_name} {profile?.last_name}</span>
                </button>
              </div>
              
              {/* User Info for Mobile */}
              <div className="sm:hidden">
                <button
                  onClick={() => {
                    if (!showForm && !showLogoutConfirm) {
                      setShowProfile(true);
                    }
                  }}
                  className="flex items-center space-x-1 text-sm text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50 border border-neutral-200 px-2 py-1 rounded-lg transition-all duration-200"
                  disabled={showForm || showLogoutConfirm}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{profile?.first_name} {profile?.last_name}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-padding py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          <div className="card">
            <div className="card-body text-center">
              {isLoading ? (
                <>
                  <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
                                          <div className="text-base font-medium text-neutral-700">Total Applications</div>
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
                  <div className="text-2xl font-bold text-yellow-600">{stats.preApplication}</div>
                  <div className="text-base font-medium text-neutral-700">Pre-application</div>
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
                  <div className="text-2xl font-bold text-executive">{stats.applied}</div>
                                          <div className="text-base font-medium text-neutral-700">Applied</div>
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
                  <div className="text-2xl font-bold text-intelligence">{stats.interview}</div>
                                          <div className="text-base font-medium text-neutral-700">Interviews</div>
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
                                          <div className="text-base font-medium text-neutral-700">Offers</div>
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
                                          <div className="text-base font-medium text-neutral-700">Rejected</div>
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
                  <div className="text-2xl font-bold text-neutral-600">{stats.archived}</div>
                                          <div className="text-base font-medium text-neutral-700">Archived</div>
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">
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
              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-neutral-700">Show Archived</span>
                </label>
              </div>
              <div className="flex items-end justify-end">
                <button
                  onClick={() => {
                    if (!showProfile && !showLogoutConfirm) {
                      setShowForm(true);
                    }
                  }}
                  className="btn btn-strategic px-6"
                  disabled={showProfile || showLogoutConfirm}
                >
                  <span className="hidden sm:inline">+ Add Application</span>
                  <span className="sm:hidden">+ Application</span>
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
              <div className="text-neutral-500 mb-4">
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
          <div className="space-y-8">
            {/* Active Applications Section */}
            {activeJobs.length > 0 && (
              <div>
                <div className="job-cards-grid">
                  {activeJobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onEdit={handleEdit}
                      openStatusDropdown={openStatusDropdown}
                      onStatusClick={handleStatusClick}
                      onStatusSelect={handleStatusSelect}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              </div>
            )}

                                  {/* Archived Applications Section */}
                      {archivedJobs.length > 0 && (
                        <div>
                          <div className="border-t border-neutral-200 pt-8 mb-6">
                          </div>
                          <div className="job-cards-grid">
                            {archivedJobs.map(job => (
                              <JobCard
                                key={job.id}
                                job={job}
                                onEdit={handleEdit}
                                openStatusDropdown={openStatusDropdown}
                                onStatusClick={handleStatusClick}
                                onStatusSelect={handleStatusSelect}
                                isLoading={isLoading}
                              />
                            ))}
                          </div>
                        </div>
                      )}

            {/* No Applications Message */}
            {activeJobs.length === 0 && archivedJobs.length === 0 && (
              <div className="card">
                <div className="card-body text-center py-12">
                  <div className="text-neutral-500 mb-4">
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
            )}
          </div>
        )}

        {/* Todo Section */}
        <div className="border-t border-neutral-200 pt-8 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Task Management</h2>
            <div className="text-sm text-neutral-600">
              {todos.filter(t => !t.completed).length} active tasks
            </div>
          </div>

          {/* Todo Filters */}
          <TodoFilters
            showCompleted={todoFilters.showCompleted}
            priorityFilter={todoFilters.priority}
            categoryFilter={todoFilters.category}
            onShowCompletedChange={(show) => handleTodoFiltersChange({ showCompleted: show })}
            onPriorityFilterChange={(priority) => handleTodoFiltersChange({ priority })}
            onCategoryFilterChange={(category) => handleTodoFiltersChange({ category })}
            onAddTodo={handleAddTodo}
            isLoading={isLoading}
          />

          {/* Todo List */}
          <TodoList
            todos={todos}
            onEdit={handleEditTodo}
            onToggle={handleToggleTodo}
            onDelete={handleDeleteTodo}
            isLoading={isLoading}
            showCompleted={todoFilters.showCompleted}
            priorityFilter={todoFilters.priority}
            categoryFilter={todoFilters.category}
          />
        </div>
      </main>

      {/* Application Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-large max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Sticky Header */}
            <div className="card-header sticky top-0 bg-white z-10 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">
                  {editingId ? 'Edit Application' : 'Add New Application'}
                </h2>
                <div className="flex items-center space-x-3">
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="btn border-2 border-red-500 bg-white text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="loading-spinner w-4 h-4 mr-2 border-red-500 border-t-transparent"></div>
                      ) : (
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setForm(emptyJob());
                      setEditingId(null);
                      setValidationErrors([]);
                    }}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="application-form"
                    disabled={isLoading}
                    className="btn btn-strategic"
                  >
                    {isLoading ? (
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                    ) : null}
                    {editingId ? 'Update Application' : 'Add Application'}
                  </button>
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
            </div>
            
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto">
              <form id="application-form" onSubmit={handleSubmit} className="card-body space-y-6">
                {validationErrors.length > 0 && (
                  <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="text-error-700 text-sm">{error}</div>
                    ))}
                  </div>
                )}

              {/* Job Description Upload */}
              {!editingId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900 border-b border-neutral-200 pb-2">
                      Quick Import
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowJobUpload(!showJobUpload)}
                      className="btn btn-secondary text-sm"
                    >
                      {showJobUpload ? 'Hide Upload' : 'Upload Job Description'}
                    </button>
                  </div>
                  
                                              {showJobUpload && (
                              <JobDescriptionUpload
                                onDataExtracted={handleJobDataExtracted}
                              />
                            )}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-neutral-900 border-b border-neutral-200 pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Position title *
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
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Date applied *
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Company *
                  </label>
                  <CompanySelector
                    selectedCompanyId={form.company_id}
                    onCompanySelect={handleCompanySelect}
                    placeholder="Search or create company..."
                    className="w-full"
                    isEditing={!!editingId}
                  />
                </div>
              </div>

              {/* Compensation & Benefits */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-neutral-900 border-b border-neutral-200 pb-2">
                  Compensation & Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <div>
                     <label className="block text-sm font-medium text-neutral-700 mb-2">
                       Salary range (min)
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
                     <label className="block text-sm font-medium text-neutral-700 mb-2">
                       Salary range (max)
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
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Equity offered
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Benefits offered
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
                <h3 className="text-lg font-medium text-neutral-900 border-b border-neutral-200 pb-2">
                  Location & Work Policy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Remote policy
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
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                <h3 className="text-lg font-medium text-neutral-900 border-b border-neutral-200 pb-2">
                  Application Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Application source
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Job Req ID
                  </label>
                  <input
                    type="text"
                    name="job_req_id"
                    value={form.job_req_id || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., 10979"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="archived"
                    name="archived"
                    checked={form.archived || false}
                    onChange={(e) => setForm(prev => ({ ...prev, archived: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="archived" className="text-sm font-medium text-neutral-700">
                    Archive this application
                  </label>
                </div>
              </div>

              </form>
            </div>
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
                <h2 className="text-xl font-semibold text-neutral-900">Profile</h2>
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
                <h2 className="text-xl font-semibold text-neutral-900">Confirm Logout</h2>
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
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Are you sure you want to logout?</h3>
                <p className="text-neutral-600 mb-6">
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

      {/* Todo Form Modal */}
      {showTodoForm && (
        <TodoForm
          todo={editingTodo}
          jobs={jobs}
          onSave={handleSaveTodo}
          onCancel={() => {
            setShowTodoForm(false);
            setEditingTodo(null);
          }}
          isLoading={isLoading}
        />
      )}

      {/* Admin Interface Modal */}
      {showAdmin && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAdmin(false);
            }
          }}
        >
          <div className="relative top-0 mx-auto p-5 w-full h-full">
            <AdminBetaInvites onNavigateBack={() => setShowAdmin(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const { user, profile, loading, profileLoading } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Initialize email service
  useEffect(() => {
    initializeEmailService();
  }, []);

  // Check if we're in demo mode (no Supabase connection)
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setIsDemoMode(true);
    } else {
      setIsDemoMode(false);
    }
  }, []);

  // Check if user wants to sign up
  useEffect(() => {
    if (window.location.pathname === '/signup') {
      setShowSignup(true);
    } else {
      setShowSignup(false);
    }
  }, []);

  // Optimized loading state - show loading only for initial auth check
  useEffect(() => {
    if (user && !profile && !profileLoading) {
      // This will be handled by the AuthContext
    }
  }, [user, profile, profileLoading]);
  // Progressive loading for better Lighthouse performance
  if (loading) {
    return (
              <div className="min-h-screen bg-neutral-50">
        {/* Show skeleton UI immediately for better perceived performance */}
        <header className="bg-white shadow-executive border-b border-neutral-200">
          <div className="container-padding">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-neutral-900">Executive Job Tracker</h1>
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

  // Show signup screen for unauthenticated users
  if (!user && showSignup) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full">
          <div className="card-header text-center">
            <h1 className="text-2xl font-bold text-neutral-900">Executive Job Tracker</h1>
            <p className="text-neutral-600 mt-2">Create your account to get started</p>
          </div>
          <div className="card-body">
            <SignupForm onAuthSuccess={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  // Show login screen for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full">
          <div className="card-header text-center">
            <h1 className="text-2xl font-bold text-neutral-900">Executive Job Tracker</h1>
            <p className="text-neutral-600 mt-2">Sign in to manage your job applications</p>
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full">
          <div className="card-header text-center">
            <h1 className="text-2xl font-bold text-neutral-900">Complete Your Profile</h1>
            <p className="text-neutral-600 mt-2">Set up your professional profile to get started</p>
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
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.667-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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