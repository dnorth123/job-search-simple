-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    professional_title VARCHAR(255),
    industry_category VARCHAR(50), -- Technology, Healthcare, Finance, etc.
    career_level VARCHAR(50), -- Entry, Mid, Senior, Lead, Manager, Director, Executive
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    phone_number VARCHAR(20),
    location VARCHAR(255),
    years_experience INTEGER,
    skills TEXT[], -- Array of skills
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry_category VARCHAR(50), -- Technology, Healthcare, Finance, etc.
    company_size_range VARCHAR(20), -- 1-10, 11-50, 51-200, etc.
    headquarters_location VARCHAR(255),
    website_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    description TEXT,
    founded_year INTEGER,
    funding_stage VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    position VARCHAR(255) NOT NULL,
    salary_range_min INTEGER,
    salary_range_max INTEGER,
    location VARCHAR(255),
    remote_policy VARCHAR(50), -- 'Remote', 'Hybrid', 'On-site'
    application_source VARCHAR(50), -- 'LinkedIn', 'Indeed', 'Company Website', etc.
    priority_level INTEGER DEFAULT 3, -- 1=High, 2=Medium, 3=Low
    notes TEXT,
    date_applied DATE NOT NULL,
    job_posting_url VARCHAR(255),
    recruiter_name VARCHAR(255),
    recruiter_email VARCHAR(255),
    recruiter_phone VARCHAR(20),
    interview_rounds INTEGER,
    benefits_mentioned TEXT,
    equity_offered BOOLEAN DEFAULT FALSE,
    equity_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Application_Timeline table for status tracking
CREATE TABLE IF NOT EXISTS application_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'
    notes TEXT,
    date_changed DATE NOT NULL,
    interview_type VARCHAR(50), -- 'Phone', 'Video', 'On-site', 'Technical', 'Behavioral'
    interview_date DATE,
    interviewer_name VARCHAR(255),
    feedback_received TEXT,
    next_steps TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_company_id ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(priority_level);
CREATE INDEX IF NOT EXISTS idx_applications_date_applied ON applications(date_applied);
CREATE INDEX IF NOT EXISTS idx_application_timeline_application_id ON application_timeline(application_id);
CREATE INDEX IF NOT EXISTS idx_application_timeline_status ON application_timeline(status);
CREATE INDEX IF NOT EXISTS idx_application_timeline_date_changed ON application_timeline(date_changed);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry_category);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Companies are viewable by all authenticated users
CREATE POLICY "Authenticated users can view companies" ON companies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert companies" ON companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update companies" ON companies
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Applications are user-specific
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications" ON applications
    FOR DELETE USING (auth.uid() = user_id);

-- Application timeline is user-specific through the application relationship
CREATE POLICY "Users can view own application timeline" ON application_timeline
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_timeline.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own application timeline" ON application_timeline
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_timeline.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own application timeline" ON application_timeline
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_timeline.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own application timeline" ON application_timeline
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_timeline.application_id 
            AND applications.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create timeline entry when application status changes
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

-- Create trigger for automatic timeline creation
CREATE TRIGGER create_initial_timeline_entry 
    AFTER INSERT ON applications 
    FOR EACH ROW 
    EXECUTE FUNCTION create_timeline_entry(); 