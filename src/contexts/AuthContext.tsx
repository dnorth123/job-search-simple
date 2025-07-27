import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { getUserProfile, updateUserProfile, createUser, testDatabaseConnection } from '../utils/supabaseOperations';
import { AuthContext, type UserProfile, type AuthContextType } from './AuthContextTypes';
import type { IndustryCategory, CareerLevel } from '../jobTypes';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Test database connection on mount
    const testConnection = async () => {
      try {
        const isConnected = await testDatabaseConnection();
        setDatabaseConnected(isConnected);
        console.log('Database connection status:', isConnected);
      } catch (error) {
        console.error('Database connection test failed:', error);
        setDatabaseConnected(false);
      }
    };

    testConnection();
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session:', session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Loading user profile for:', session.user.id);
          await loadUserProfile(session.user.id);
        } else {
          console.log('No session, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state change:', { event: _event, session });
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Loading timeout reached, forcing loading to false');
      setLoading(false);
      setProfileLoading(false);
    }, 10000); // 10 second timeout

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for:', userId);
      setProfileLoading(true);
      
      // Check database connection first
      if (databaseConnected === false) {
        console.log('Database not connected, skipping profile load');
        setProfile(null);
        setProfileLoading(false);
        setLoading(false);
        return;
      }
      
      const userProfile = await getUserProfile(userId);
      console.log('User profile loaded:', userProfile);
      
      if (userProfile) {
        setProfile(userProfile);
      } else {
        console.log('No user profile found - user may not exist in users table yet');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setProfile(null);
    } finally {
      console.log('Setting profileLoading to false');
      setProfileLoading(false);
      // Also set main loading to false after profile load attempt
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear local state
    setUser(null);
    setProfile(null);
  };

  const createUserProfile = async (profileData: {
    first_name: string;
    last_name: string;
    professional_title?: string;
    industry_category?: IndustryCategory;
    career_level?: CareerLevel;
    linkedin_url?: string;
    portfolio_url?: string;
    phone_number?: string;
    location?: string;
    years_experience?: number;
    skills?: string[];
  }) => {
    console.log('createUserProfile called with:', profileData);
    if (!user) throw new Error('No authenticated user');
    
    try {
      // Check database connection
      if (databaseConnected === false) {
        console.log('Database not connected, using fallback mode');
        const fallbackProfile = {
          id: user.id,
          email: user.email!,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Setting fallback profile:', fallbackProfile);
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
      
      console.log('Calling createUser with:', { id: user.id, email: user.email, ...profileData });
      const newProfile = await createUser({
        id: user.id,
        email: user.email!,
        ...profileData,
      });
      
      console.log('createUser returned:', newProfile);
      setProfile(newProfile);
      return newProfile;
    } catch (error) {
      console.error('createUserProfile error:', error);
      
      // Fallback to local profile if database fails
      console.log('Database operation failed, using fallback profile');
      const fallbackProfile = {
        id: user.id,
        email: user.email!,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  const updateProfile = async (updates: Partial<{
    first_name: string;
    last_name: string;
    professional_title: string;
    industry_category: IndustryCategory;
    career_level: CareerLevel;
    linkedin_url: string;
    portfolio_url: string;
    phone_number: string;
    location: string;
    years_experience: number;
    skills: string[];
  }>) => {
    if (!user) throw new Error('No authenticated user');
    
    try {
      const updatedProfile = await updateUserProfile(user.id, updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('updateProfile error:', error);
      
      // Fallback to local update if database fails
      if (profile) {
        const fallbackProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
      
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    profileLoading,
    databaseConnected,
    signIn,
    signUp,
    signOut,
    createUserProfile,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

 