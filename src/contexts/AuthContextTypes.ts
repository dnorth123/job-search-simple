import { createContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { IndustryCategory, CareerLevel } from '../jobTypes';

export interface UserProfile {
  id: string;
  email: string;
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
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  databaseConnected: boolean | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createUserProfile: (profileData: {
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
  }) => Promise<UserProfile>;
  updateProfile: (updates: Partial<{
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
  }>) => Promise<UserProfile>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined); 