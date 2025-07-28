import { supabase, TABLES } from './supabase';
import type { 
  JobApplication, 
  ApplicationTimeline, 
  JobStatus, 
  LegacyJobApplication,
  CompanyFormData,
  UserProfileFormData
} from '../jobTypes';

// Simplified error handling - no retries, just direct operations
async function handleDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    console.log(`${operationName} - Starting operation`);
    
    // Simple timeout - no retries
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), 10000); // 10 second timeout
    });
    
    const result = await Promise.race([
      operation(),
      timeoutPromise
    ]);
    
    console.log(`${operationName} - Success`);
    return result;
  } catch (error) {
    console.error(`${operationName} - Failed:`, error);
    throw error;
  }
}

// Error handling helper
function handleError(error: unknown, operation: string): never {
  console.error(`Error in ${operation}:`, error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  throw new Error(`${operation} failed: ${errorMessage}`);
}

// Simple connection test - no retries
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('Testing database connection...');
    
    const { error } = await supabase
      .from(TABLES.USERS)
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Check database schema and table structure
export async function checkDatabaseSchema(): Promise<{
  usersTableExists: boolean;
  usersTableStructure: unknown;
  error?: string;
}> {
  try {
    console.log('Checking database schema...');
    
    // Test if users table exists and get its structure
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Schema check failed:', error);
      return {
        usersTableExists: false,
        usersTableStructure: null,
        error: error.message
      };
    }
    
    console.log('Schema check successful, users table exists');
    return {
      usersTableExists: true,
      usersTableStructure: data,
      error: undefined
    };
  } catch (error) {
    console.error('Schema check exception:', error);
    return {
      usersTableExists: false,
      usersTableStructure: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// User operations
export async function getCurrentUser() {
  return handleDatabaseOperation(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) handleError(error, 'getCurrentUser');
    return user;
  }, 'getCurrentUser');
}

export async function createUser(userData: {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  professional_title?: string;
  industry_category?: string;
  career_level?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  phone_number?: string;
  location?: string;
  years_experience?: number;
  skills?: string[];
}) {
  console.log('createUser called with:', userData);
  
  return handleDatabaseOperation(async () => {
    try {
      console.log('createUser - Starting database operation...');
      
      // First, let's test if the table exists
      const { data: tableTest, error: tableError } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .limit(1);
      
      console.log('createUser - Table test result:', { tableTest, tableError });
      
      if (tableError) {
        console.error('createUser - Table access error:', tableError);
        throw new Error(`Table access failed: ${tableError.message}`);
      }
      
      // Use upsert instead of insert to handle existing users
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .upsert(userData, { onConflict: 'id' })
        .select()
        .single();
      
      console.log('createUser result:', { data, error });
      
      if (error) {
        console.error('createUser error:', error);
        throw new Error(`Database operation failed: ${error.message}`);
      }
      
      if (!data) {
        console.error('createUser - No data returned');
        throw new Error('No data returned from database operation');
      }
      
      console.log('createUser returning:', data);
      return data;
    } catch (error) {
      console.error('createUser - Exception caught:', error);
      throw error;
    }
  }, 'createUser');
}

export async function getUserProfile(userId: string) {
  console.log('getUserProfile called for userId:', userId);
  
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .limit(1);
    
    console.log('getUserProfile result:', { data, error });
    
    if (error) {
      console.error('getUserProfile error:', error);
      return null;
    }
    
    // Return the first result or null
    const userProfile = Array.isArray(data) ? data[0] || null : data;
    console.log('getUserProfile returning:', userProfile);
    return userProfile;
  }, 'getUserProfile');
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfileFormData>) {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) handleError(error, 'updateUserProfile');
    return data;
  }, 'updateUserProfile');
}

// Company operations
export async function getCompanies() {
  const { data, error } = await supabase
    .from(TABLES.COMPANIES)
    .select('*')
    .order('name');
  
  if (error) handleError(error, 'getCompanies');
  return data || [];
}

export async function createCompany(companyData: CompanyFormData) {
  const { data, error } = await supabase
    .from(TABLES.COMPANIES)
    .insert(companyData)
    .select()
    .single();
  
  if (error) handleError(error, 'createCompany');
  return data;
}

export async function updateCompany(companyId: string, updates: Partial<CompanyFormData>) {
  const { data, error } = await supabase
    .from(TABLES.COMPANIES)
    .update(updates)
    .eq('id', companyId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateCompany');
  return data;
}

export async function searchCompanies(searchTerm: string) {
  const { data, error } = await supabase
    .from(TABLES.COMPANIES)
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .order('name')
    .limit(10);
  
  if (error) handleError(error, 'searchCompanies');
  return data || [];
}

// Application operations
export async function getJobApplications(userId: string): Promise<JobApplication[]> {
  console.log('getJobApplications called for userId:', userId);
  
  try {
    // First, get all applications with company data
    const { data: applications, error: appError } = await supabase
      .from(TABLES.APPLICATIONS)
      .select(`
        *,
        company:companies(*)
      `)
      .eq('user_id', userId)
      .order('date_applied', { ascending: false });
    
    console.log('getJobApplications - applications result:', { applications, appError });
    
    if (appError) {
      console.error('getJobApplications error:', appError);
      handleError(appError, 'getJobApplications');
    }
    
    if (!applications || applications.length === 0) {
      console.log('getJobApplications - no applications found');
      return [];
    }
    
    // Get the latest status for each application
    const applicationIds = applications.map(app => app.id);
    const { data: timelineData, error: timelineError } = await supabase
      .from(TABLES.APPLICATION_TIMELINE)
      .select('application_id, status, created_at')
      .in('application_id', applicationIds)
      .order('created_at', { ascending: false });
    
    console.log('getJobApplications - timeline result:', { timelineData, timelineError });
    
    if (timelineError) {
      console.error('getJobApplications timeline error:', timelineError);
      // Continue without timeline data, default to 'Applied'
    }
    
    // Create a map of the latest status for each application
    const statusMap = new Map<string, string>();
    if (timelineData) {
      const latestStatuses = new Map<string, { status: string; created_at: string }>();
      
      timelineData.forEach(entry => {
        const existing = latestStatuses.get(entry.application_id);
        if (!existing || new Date(entry.created_at) > new Date(existing.created_at)) {
          latestStatuses.set(entry.application_id, {
            status: entry.status,
            created_at: entry.created_at
          });
        }
      });
      
      latestStatuses.forEach((value, key) => {
        statusMap.set(key, value.status);
      });
    }
    
    // Add current_status to each application
    const applicationsWithStatus = applications.map(app => ({
      ...app,
      current_status: statusMap.get(app.id) || 'Applied'
    }));
    
    console.log('getJobApplications returning:', applicationsWithStatus);
    return applicationsWithStatus;
  } catch (err) {
    console.error('getJobApplications exception:', err);
    throw err;
  }
}

export async function getJobApplication(applicationId: string): Promise<JobApplication | null> {
  const { data, error } = await supabase
    .from(TABLES.APPLICATIONS)
    .select(`
      *,
      company:companies(*)
    `)
    .eq('id', applicationId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    handleError(error, 'getJobApplication');
  }
  
  if (!data) return null;
  
  // Get the latest status
  const { data: timelineData } = await supabase
    .from(TABLES.APPLICATION_TIMELINE)
    .select('status')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return {
    ...data,
    current_status: timelineData?.status || 'Applied'
  };
}

export async function addJobApplication(applicationData: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>): Promise<JobApplication> {
  // Remove current_status from applicationData since it's computed from timeline
  const dbApplicationData = { ...applicationData };
  delete dbApplicationData.current_status;
  
  // Start a transaction
  const { data: application, error: appError } = await supabase
    .from(TABLES.APPLICATIONS)
    .insert(dbApplicationData)
    .select()
    .single();
  
  if (appError) handleError(appError, 'addJobApplication - application');
  
  // Create initial timeline entry
  const timelineData: Omit<ApplicationTimeline, 'id' | 'created_at'> = {
    application_id: application.id,
    status: 'Applied',
    date_changed: applicationData.date_applied,
    notes: 'Application submitted'
  };
  
  const { error: timelineError } = await supabase
    .from(TABLES.APPLICATION_TIMELINE)
    .insert(timelineData);
  
  if (timelineError) handleError(timelineError, 'addJobApplication - timeline');
  
  return application;
}

export async function updateJobApplication(applicationId: string, updates: Partial<Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>>): Promise<JobApplication> {
  // Remove current_status from updates since it's computed from timeline
  const dbUpdates = { ...updates };
  delete dbUpdates.current_status;
  
  const { data, error } = await supabase
    .from(TABLES.APPLICATIONS)
    .update(dbUpdates)
    .eq('id', applicationId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateJobApplication');
  return data;
}

export async function deleteJobApplication(applicationId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.APPLICATIONS)
    .delete()
    .eq('id', applicationId);
  
  if (error) handleError(error, 'deleteJobApplication');
}

// Timeline operations
export async function getApplicationTimeline(applicationId: string): Promise<ApplicationTimeline[]> {
  const { data, error } = await supabase
    .from(TABLES.APPLICATION_TIMELINE)
    .select('*')
    .eq('application_id', applicationId)
    .order('date_changed', { ascending: false });
  
  if (error) handleError(error, 'getApplicationTimeline');
  return data || [];
}

export async function updateApplicationStatus(
  applicationId: string, 
  newStatus: JobStatus, 
  notes?: string,
  interviewType?: string,
  interviewDate?: string,
  interviewerName?: string,
  feedbackReceived?: string,
  nextSteps?: string
): Promise<void> {
  const timelineData: Omit<ApplicationTimeline, 'id' | 'created_at'> = {
    application_id: applicationId,
    status: newStatus,
    notes,
    date_changed: new Date().toISOString().slice(0, 10),
    interview_type: interviewType,
    interview_date: interviewDate,
    interviewer_name: interviewerName,
    feedback_received: feedbackReceived,
    next_steps: nextSteps
  };
  
  const { error } = await supabase
    .from(TABLES.APPLICATION_TIMELINE)
    .insert(timelineData);
  
  if (error) handleError(error, 'updateApplicationStatus');
}

// Migration helper for localStorage data
export async function migrateLocalStorageData(legacyData: LegacyJobApplication[], userId: string): Promise<void> {
  for (const legacyApp of legacyData) {
    // Create or find company
    let companyId: string | undefined;
    if (legacyApp.company) {
      const { data: existingCompany } = await supabase
        .from(TABLES.COMPANIES)
        .select('id')
        .eq('name', legacyApp.company)
        .single();
      
      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany } = await supabase
          .from(TABLES.COMPANIES)
          .insert({ name: legacyApp.company })
          .select('id')
          .single();
        companyId = newCompany?.id;
      }
    }
    
    // Create application
    const applicationData: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      company_id: companyId,
      position: legacyApp.position,
      priority_level: 3, // Default to low priority
      notes: legacyApp.notes,
      date_applied: legacyApp.dateApplied,
    };
    
    await addJobApplication(applicationData);
    
    // Update status if not 'Applied'
    if (legacyApp.status !== 'Applied') {
      const { data: application } = await supabase
        .from(TABLES.APPLICATIONS)
        .select('id')
        .eq('user_id', userId)
        .eq('position', legacyApp.position)
        .eq('date_applied', legacyApp.dateApplied)
        .single();
      
      if (application) {
        await updateApplicationStatus(application.id, legacyApp.status, legacyApp.notes);
      }
    }
  }
} 