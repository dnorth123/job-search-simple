-- =============================================
-- KWJT Connections Import Feature
-- Migration: Create connections and network stats tables
-- =============================================

BEGIN;

-- =============================================
-- CONNECTIONS TABLE
-- =============================================

-- Create connections table for storing imported LinkedIn connections
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    linkedin_url TEXT,
    email TEXT,
    
    -- Professional Information
    company TEXT,
    position TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    
    -- Connection Metadata
    connected_date DATE,
    network_strength INTEGER DEFAULT 50 CHECK (network_strength >= 0 AND network_strength <= 100),
    tags TEXT[] DEFAULT '{}',
    
    -- Tracking Fields
    notes TEXT,
    last_interaction DATE,
    interaction_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Import Metadata
    import_source TEXT DEFAULT 'manual' CHECK (import_source IN ('manual', 'linkedin_csv', 'api', 'other')),
    import_batch_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_connection_per_user UNIQUE(user_id, email),
    CONSTRAINT unique_linkedin_per_user UNIQUE(user_id, linkedin_url)
);

-- Add comments for documentation
COMMENT ON TABLE public.connections IS 'Stores professional network connections imported from LinkedIn or added manually';
COMMENT ON COLUMN public.connections.network_strength IS 'Connection strength score 0-100, auto-calculated based on position seniority and interactions';
COMMENT ON COLUMN public.connections.tags IS 'Array of tags for categorizing connections (e.g., recruiter, mentor, colleague)';

-- =============================================
-- COMPANY NETWORK STATS TABLE
-- =============================================

-- Create aggregated network statistics by company
CREATE TABLE IF NOT EXISTS public.company_network_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    
    -- Network Metrics
    total_connections INTEGER DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    average_network_strength DECIMAL(5,2) DEFAULT 0,
    
    -- Connection Breakdown by Seniority
    executive_connections INTEGER DEFAULT 0,     -- C-level, VP, Director
    senior_connections INTEGER DEFAULT 0,        -- Senior, Lead, Principal
    mid_connections INTEGER DEFAULT 0,           -- Regular titles
    junior_connections INTEGER DEFAULT 0,        -- Junior, Associate, Intern
    
    -- Engagement Metrics
    total_interactions INTEGER DEFAULT 0,
    last_interaction_date DATE,
    
    -- Department Distribution (JSONB for flexibility)
    department_distribution JSONB DEFAULT '{}',
    
    -- Top Connections (stores top 5 connections by network strength)
    top_connections JSONB DEFAULT '[]',
    
    -- Timestamps
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_company_stats_per_user UNIQUE(user_id, company_id)
);

COMMENT ON TABLE public.company_network_stats IS 'Aggregated network statistics per company for network analysis';
COMMENT ON COLUMN public.company_network_stats.department_distribution IS 'JSON object with department names as keys and connection counts as values';
COMMENT ON COLUMN public.company_network_stats.top_connections IS 'JSON array of top 5 connections with their details';

-- =============================================
-- POSITION SENIORITY LOOKUP TABLE
-- =============================================

-- Create lookup table for position seniority scoring
CREATE TABLE IF NOT EXISTS public.position_seniority_levels (
    id SERIAL PRIMARY KEY,
    keyword TEXT NOT NULL UNIQUE,
    seniority_level TEXT NOT NULL,
    base_score INTEGER NOT NULL CHECK (base_score >= 0 AND base_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default seniority keywords and scores
INSERT INTO public.position_seniority_levels (keyword, seniority_level, base_score) VALUES
    -- Executive Level (80-100)
    ('ceo', 'executive', 100),
    ('cto', 'executive', 95),
    ('cfo', 'executive', 95),
    ('coo', 'executive', 95),
    ('chief', 'executive', 90),
    ('president', 'executive', 90),
    ('founder', 'executive', 85),
    ('co-founder', 'executive', 85),
    ('vp', 'executive', 80),
    ('vice president', 'executive', 80),
    
    -- Director Level (70-79)
    ('director', 'director', 75),
    ('head of', 'director', 75),
    
    -- Senior Level (60-69)
    ('senior', 'senior', 65),
    ('lead', 'senior', 65),
    ('principal', 'senior', 68),
    ('staff', 'senior', 67),
    ('manager', 'senior', 60),
    
    -- Mid Level (40-59)
    ('engineer', 'mid', 50),
    ('developer', 'mid', 50),
    ('analyst', 'mid', 50),
    ('specialist', 'mid', 50),
    ('consultant', 'mid', 55),
    
    -- Junior Level (20-39)
    ('junior', 'junior', 30),
    ('associate', 'junior', 35),
    ('assistant', 'junior', 30),
    ('intern', 'junior', 20),
    ('trainee', 'junior', 20)
ON CONFLICT (keyword) DO NOTHING;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Connections table indexes
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON public.connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_company ON public.connections(company);
CREATE INDEX IF NOT EXISTS idx_connections_company_id ON public.connections(company_id);
CREATE INDEX IF NOT EXISTS idx_connections_network_strength ON public.connections(network_strength DESC);
CREATE INDEX IF NOT EXISTS idx_connections_connected_date ON public.connections(connected_date DESC);
CREATE INDEX IF NOT EXISTS idx_connections_tags ON public.connections USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_connections_full_name ON public.connections(full_name);
CREATE INDEX IF NOT EXISTS idx_connections_active ON public.connections(is_active) WHERE is_active = true;

-- Company network stats indexes
CREATE INDEX IF NOT EXISTS idx_company_network_stats_user_id ON public.company_network_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_company_network_stats_company_id ON public.company_network_stats(company_id);
CREATE INDEX IF NOT EXISTS idx_company_network_stats_total ON public.company_network_stats(total_connections DESC);

-- Position seniority indexes
CREATE INDEX IF NOT EXISTS idx_position_seniority_keyword ON public.position_seniority_levels(lower(keyword));

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to calculate network strength based on position
CREATE OR REPLACE FUNCTION calculate_network_strength(
    p_position TEXT,
    p_interaction_count INTEGER DEFAULT 0,
    p_last_interaction DATE DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_base_score INTEGER := 50; -- Default score
    v_final_score INTEGER;
    v_position_lower TEXT;
    v_days_since_interaction INTEGER;
BEGIN
    -- Normalize position text
    v_position_lower := lower(COALESCE(p_position, ''));
    
    -- Get base score from position seniority
    SELECT MAX(base_score) INTO v_base_score
    FROM public.position_seniority_levels
    WHERE v_position_lower LIKE '%' || lower(keyword) || '%';
    
    -- If no match found, use default
    IF v_base_score IS NULL THEN
        v_base_score := 50;
    END IF;
    
    -- Adjust for interaction frequency (up to +15 points)
    IF p_interaction_count > 0 THEN
        v_base_score := v_base_score + LEAST(p_interaction_count * 3, 15);
    END IF;
    
    -- Adjust for recency of interaction (up to +10 points or -10 points)
    IF p_last_interaction IS NOT NULL THEN
        v_days_since_interaction := CURRENT_DATE - p_last_interaction;
        
        IF v_days_since_interaction <= 30 THEN
            v_base_score := v_base_score + 10; -- Recent interaction
        ELSIF v_days_since_interaction <= 90 THEN
            v_base_score := v_base_score + 5;  -- Somewhat recent
        ELSIF v_days_since_interaction > 365 THEN
            v_base_score := v_base_score - 10; -- Very old interaction
        END IF;
    END IF;
    
    -- Ensure score stays within 0-100 range
    v_final_score := LEAST(GREATEST(v_base_score, 0), 100);
    
    RETURN v_final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update company network stats
CREATE OR REPLACE FUNCTION update_company_network_stats(p_company_id UUID, p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_company_name TEXT;
BEGIN
    -- Get company name
    SELECT name INTO v_company_name FROM public.companies WHERE id = p_company_id;
    
    -- Update or insert network stats
    INSERT INTO public.company_network_stats (
        user_id,
        company_id,
        company_name,
        total_connections,
        active_connections,
        average_network_strength,
        executive_connections,
        senior_connections,
        mid_connections,
        junior_connections,
        total_interactions,
        last_interaction_date,
        top_connections
    )
    SELECT 
        p_user_id,
        p_company_id,
        v_company_name,
        COUNT(*),
        COUNT(*) FILTER (WHERE is_active = true),
        AVG(network_strength),
        COUNT(*) FILTER (WHERE position ~* '(ceo|cto|cfo|chief|president|vp|director)'),
        COUNT(*) FILTER (WHERE position ~* '(senior|lead|principal|manager)' AND position !~* '(ceo|cto|cfo|chief|president|vp|director)'),
        COUNT(*) FILTER (WHERE position !~* '(ceo|cto|cfo|chief|president|vp|director|senior|lead|principal|manager|junior|intern|associate)'),
        COUNT(*) FILTER (WHERE position ~* '(junior|intern|associate|assistant)'),
        SUM(interaction_count),
        MAX(last_interaction),
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'name', full_name,
                    'position', position,
                    'network_strength', network_strength
                )
                ORDER BY network_strength DESC
                LIMIT 5
            )
            FROM public.connections
            WHERE company_id = p_company_id 
            AND user_id = p_user_id
            AND is_active = true
        )
    FROM public.connections
    WHERE company_id = p_company_id 
    AND user_id = p_user_id
    ON CONFLICT (user_id, company_id) 
    DO UPDATE SET
        total_connections = EXCLUDED.total_connections,
        active_connections = EXCLUDED.active_connections,
        average_network_strength = EXCLUDED.average_network_strength,
        executive_connections = EXCLUDED.executive_connections,
        senior_connections = EXCLUDED.senior_connections,
        mid_connections = EXCLUDED.mid_connections,
        junior_connections = EXCLUDED.junior_connections,
        total_interactions = EXCLUDED.total_interactions,
        last_interaction_date = EXCLUDED.last_interaction_date,
        top_connections = EXCLUDED.top_connections,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to auto-calculate network strength on insert/update
CREATE OR REPLACE FUNCTION trigger_calculate_network_strength()
RETURNS TRIGGER AS $$
BEGIN
    NEW.network_strength := calculate_network_strength(
        NEW.position,
        NEW.interaction_count,
        NEW.last_interaction
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_network_strength_trigger
    BEFORE INSERT OR UPDATE OF position, interaction_count, last_interaction
    ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_network_strength();

-- Trigger to update company network stats when connections change
CREATE OR REPLACE FUNCTION trigger_update_network_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats for old company if changed
    IF TG_OP = 'UPDATE' AND OLD.company_id IS DISTINCT FROM NEW.company_id THEN
        IF OLD.company_id IS NOT NULL THEN
            PERFORM update_company_network_stats(OLD.company_id, OLD.user_id);
        END IF;
    END IF;
    
    -- Update stats for new/current company
    IF NEW.company_id IS NOT NULL THEN
        PERFORM update_company_network_stats(NEW.company_id, NEW.user_id);
    END IF;
    
    -- Handle deletion
    IF TG_OP = 'DELETE' AND OLD.company_id IS NOT NULL THEN
        PERFORM update_company_network_stats(OLD.company_id, OLD.user_id);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_network_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_network_stats();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on tables
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_network_stats ENABLE ROW LEVEL SECURITY;

-- Connections table policies
CREATE POLICY connections_select_policy ON public.connections
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY connections_insert_policy ON public.connections
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY connections_update_policy ON public.connections
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY connections_delete_policy ON public.connections
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Company network stats policies
CREATE POLICY company_network_stats_select_policy ON public.company_network_stats
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY company_network_stats_insert_policy ON public.company_network_stats
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY company_network_stats_update_policy ON public.company_network_stats
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY company_network_stats_delete_policy ON public.company_network_stats
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS FOR DATA IMPORT
-- =============================================

-- Function to bulk import connections from CSV data
CREATE OR REPLACE FUNCTION import_connections_batch(
    p_user_id UUID,
    p_connections JSONB,
    p_import_source TEXT DEFAULT 'linkedin_csv'
) RETURNS JSONB AS $$
DECLARE
    v_batch_id UUID := gen_random_uuid();
    v_imported INTEGER := 0;
    v_skipped INTEGER := 0;
    v_errors JSONB := '[]'::jsonb;
    v_connection JSONB;
BEGIN
    -- Process each connection
    FOR v_connection IN SELECT * FROM jsonb_array_elements(p_connections)
    LOOP
        BEGIN
            INSERT INTO public.connections (
                user_id,
                first_name,
                last_name,
                linkedin_url,
                email,
                company,
                position,
                connected_date,
                tags,
                import_source,
                import_batch_id
            ) VALUES (
                p_user_id,
                v_connection->>'first_name',
                v_connection->>'last_name',
                v_connection->>'linkedin_url',
                v_connection->>'email',
                v_connection->>'company',
                v_connection->>'position',
                (v_connection->>'connected_date')::date,
                COALESCE((v_connection->'tags')::text[], '{}'),
                p_import_source,
                v_batch_id
            ) ON CONFLICT (user_id, email) DO UPDATE SET
                linkedin_url = EXCLUDED.linkedin_url,
                company = EXCLUDED.company,
                position = EXCLUDED.position,
                updated_at = NOW();
            
            v_imported := v_imported + 1;
        EXCEPTION WHEN OTHERS THEN
            v_skipped := v_skipped + 1;
            v_errors := v_errors || jsonb_build_object(
                'connection', v_connection,
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'batch_id', v_batch_id,
        'imported', v_imported,
        'skipped', v_skipped,
        'errors', v_errors
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS FOR EASIER QUERYING
-- =============================================

-- View for connection insights
CREATE OR REPLACE VIEW public.connection_insights AS
SELECT 
    c.id,
    c.user_id,
    c.full_name,
    c.company,
    c.position,
    c.network_strength,
    c.tags,
    c.last_interaction,
    c.interaction_count,
    CASE 
        WHEN c.position ~* '(ceo|cto|cfo|chief|president|vp|director)' THEN 'Executive'
        WHEN c.position ~* '(senior|lead|principal|manager)' THEN 'Senior'
        WHEN c.position ~* '(junior|intern|associate|assistant)' THEN 'Junior'
        ELSE 'Mid-level'
    END as seniority_level,
    CASE 
        WHEN c.last_interaction >= CURRENT_DATE - INTERVAL '30 days' THEN 'Active'
        WHEN c.last_interaction >= CURRENT_DATE - INTERVAL '90 days' THEN 'Recent'
        WHEN c.last_interaction >= CURRENT_DATE - INTERVAL '365 days' THEN 'Inactive'
        ELSE 'Dormant'
    END as engagement_status,
    comp.name as company_name,
    comp.linkedin_url as company_linkedin_url
FROM public.connections c
LEFT JOIN public.companies comp ON c.company_id = comp.id
WHERE c.is_active = true;

-- Grant permissions on views
GRANT SELECT ON public.connection_insights TO authenticated;

-- =============================================
-- SAMPLE QUERIES FOR TESTING
-- =============================================

/*
-- Import connections example:
SELECT import_connections_batch(
    auth.uid(),
    '[
        {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "company": "Microsoft",
            "position": "Senior Software Engineer",
            "linkedin_url": "https://linkedin.com/in/johndoe",
            "connected_date": "2023-01-15",
            "tags": ["colleague", "engineering"]
        }
    ]'::jsonb,
    'linkedin_csv'
);

-- Get top connections for a company:
SELECT * FROM connection_insights
WHERE user_id = auth.uid()
AND company = 'Microsoft'
ORDER BY network_strength DESC
LIMIT 10;

-- Get network statistics:
SELECT * FROM company_network_stats
WHERE user_id = auth.uid()
ORDER BY total_connections DESC;
*/

COMMIT;

-- =============================================
-- ROLLBACK SCRIPT (commented out for safety)
-- =============================================

/*
-- To rollback this migration, run:
BEGIN;
DROP TRIGGER IF EXISTS update_network_stats_trigger ON public.connections;
DROP TRIGGER IF EXISTS calculate_network_strength_trigger ON public.connections;
DROP FUNCTION IF EXISTS trigger_update_network_stats();
DROP FUNCTION IF EXISTS trigger_calculate_network_strength();
DROP FUNCTION IF EXISTS import_connections_batch(UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS update_company_network_stats(UUID, UUID);
DROP FUNCTION IF EXISTS calculate_network_strength(TEXT, INTEGER, DATE);
DROP VIEW IF EXISTS public.connection_insights;
DROP TABLE IF EXISTS public.company_network_stats;
DROP TABLE IF EXISTS public.connections;
DROP TABLE IF EXISTS public.position_seniority_levels;
COMMIT;
*/