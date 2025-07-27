-- Migration script to add missing columns to existing tables
-- Run this in your Supabase SQL Editor

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS industry_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS career_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS skills TEXT[];

-- Add missing columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS industry_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS company_size_range VARCHAR(20),
ADD COLUMN IF NOT EXISTS headquarters_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS website_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS funding_stage VARCHAR(100);

-- Add missing columns to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS job_posting_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS recruiter_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS recruiter_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS recruiter_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS interview_rounds INTEGER,
ADD COLUMN IF NOT EXISTS benefits_mentioned TEXT,
ADD COLUMN IF NOT EXISTS equity_offered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS equity_details TEXT;

-- Add missing columns to application_timeline table
ALTER TABLE application_timeline 
ADD COLUMN IF NOT EXISTS interview_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS interview_date DATE,
ADD COLUMN IF NOT EXISTS interviewer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS feedback_received TEXT,
ADD COLUMN IF NOT EXISTS next_steps TEXT;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(priority_level);
CREATE INDEX IF NOT EXISTS idx_applications_date_applied ON applications(date_applied);
CREATE INDEX IF NOT EXISTS idx_application_timeline_date_changed ON application_timeline(date_changed);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry_category);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (if they don't exist)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create timeline entry (if it doesn't exist)
CREATE OR REPLACE FUNCTION create_timeline_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new application, create initial timeline entry
    IF TG_OP = 'INSERT' THEN
        INSERT INTO application_timeline (
            application_id, 
            status, 
            date_changed, 
            notes
        ) VALUES (
            NEW.id, 
            'Applied', 
            NEW.date_applied, 
            'Application submitted'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic timeline creation (if it doesn't exist)
DROP TRIGGER IF EXISTS create_initial_timeline_entry ON applications;
CREATE TRIGGER create_initial_timeline_entry
    AFTER INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION create_timeline_entry();