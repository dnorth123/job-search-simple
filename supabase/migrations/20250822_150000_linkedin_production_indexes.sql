-- LinkedIn Discovery Production Database Indexes and Optimization
-- This migration adds indexes, partitioning, and optimization for production use

BEGIN;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Index for linkedin_search_cache table
CREATE INDEX IF NOT EXISTS idx_linkedin_search_cache_search_term 
ON linkedin_search_cache(search_term);

CREATE INDEX IF NOT EXISTS idx_linkedin_search_cache_expires_at 
ON linkedin_search_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_linkedin_search_cache_created_at 
ON linkedin_search_cache(created_at DESC);

-- Composite index for active cache entries
CREATE INDEX IF NOT EXISTS idx_linkedin_search_cache_active 
ON linkedin_search_cache(search_term, expires_at) 
WHERE expires_at > NOW();

-- Index for search_count lookups (used in rate limiting)
CREATE INDEX IF NOT EXISTS idx_linkedin_search_cache_search_count 
ON linkedin_search_cache(search_term, search_count, created_at) 
WHERE search_count > 0;

-- Index for linkedin_search_metrics table
CREATE INDEX IF NOT EXISTS idx_linkedin_search_metrics_created_at 
ON linkedin_search_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_linkedin_search_metrics_search_term 
ON linkedin_search_metrics(search_term);

CREATE INDEX IF NOT EXISTS idx_linkedin_search_metrics_user_action 
ON linkedin_search_metrics(user_action);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_linkedin_search_metrics_analytics 
ON linkedin_search_metrics(created_at DESC, user_action, search_term);

-- Index for companies table with LinkedIn data
CREATE INDEX IF NOT EXISTS idx_companies_linkedin_url 
ON companies(linkedin_url) 
WHERE linkedin_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_linkedin_confidence 
ON companies(linkedin_confidence DESC) 
WHERE linkedin_confidence IS NOT NULL;

-- =============================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================

-- Update table statistics for better query planning
ANALYZE linkedin_search_cache;
ANALYZE linkedin_search_metrics;
ANALYZE companies;

-- Set more aggressive autovacuum settings for high-traffic tables
ALTER TABLE linkedin_search_cache SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 100,
  autovacuum_analyze_threshold = 50
);

ALTER TABLE linkedin_search_metrics SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 100,
  autovacuum_analyze_threshold = 50
);

-- =============================================
-- PARTITIONING FOR LARGE TABLES
-- =============================================

-- Create partitioned table for linkedin_search_metrics if it grows large
-- This will help with performance when we have millions of records

-- First, let's create a new partitioned table
CREATE TABLE IF NOT EXISTS linkedin_search_metrics_partitioned (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_term TEXT NOT NULL,
    selected_url TEXT,
    selection_confidence DECIMAL(3,2),
    user_action TEXT NOT NULL CHECK (user_action IN ('selected', 'manual_entry', 'skipped')),
    response_time_ms INTEGER,
    result_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create initial partitions (current month and next 3 months)
CREATE TABLE IF NOT EXISTS linkedin_search_metrics_2024_12 
PARTITION OF linkedin_search_metrics_partitioned
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS linkedin_search_metrics_2025_01 
PARTITION OF linkedin_search_metrics_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS linkedin_search_metrics_2025_02 
PARTITION OF linkedin_search_metrics_partitioned
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS linkedin_search_metrics_2025_03 
PARTITION OF linkedin_search_metrics_partitioned
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Create indexes on partitioned table
CREATE INDEX IF NOT EXISTS idx_linkedin_search_metrics_partitioned_created_at 
ON linkedin_search_metrics_partitioned(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_linkedin_search_metrics_partitioned_search_term 
ON linkedin_search_metrics_partitioned(search_term);

-- =============================================
-- CLEANUP AND MAINTENANCE
-- =============================================

-- Create a function to clean up old cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_linkedin_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired cache entries older than 1 day past expiration
    DELETE FROM linkedin_search_cache 
    WHERE expires_at < (NOW() - INTERVAL '1 day');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO linkedin_search_metrics (
        search_term, 
        user_action, 
        response_time_ms,
        result_count
    ) VALUES (
        'system_cleanup', 
        'cleanup', 
        0,
        deleted_count
    );
    
    RETURN deleted_count;
END;
$$;

-- Create a function to clean up old metrics (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_linkedin_metrics()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete metrics older than 90 days
    DELETE FROM linkedin_search_metrics 
    WHERE created_at < (NOW() - INTERVAL '90 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Create a function to rotate partitions automatically
CREATE OR REPLACE FUNCTION create_next_month_partition()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_month DATE;
    next_next_month DATE;
    partition_name TEXT;
BEGIN
    -- Calculate next month
    next_month := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    next_next_month := next_month + INTERVAL '1 month';
    
    -- Generate partition name
    partition_name := 'linkedin_search_metrics_' || TO_CHAR(next_month, 'YYYY_MM');
    
    -- Create partition if it doesn't exist
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I 
        PARTITION OF linkedin_search_metrics_partitioned
        FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        next_month,
        next_next_month
    );
    
    RETURN partition_name;
END;
$$;

-- =============================================
-- PERFORMANCE MONITORING
-- =============================================

-- Create a view for cache performance metrics
CREATE OR REPLACE VIEW linkedin_cache_performance AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE search_count > 1) as cache_hits,
    COUNT(*) FILTER (WHERE search_count = 1) as cache_misses,
    ROUND(
        (COUNT(*) FILTER (WHERE search_count > 1)::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 2
    ) as cache_hit_rate_percent,
    AVG(search_count) as avg_search_count
FROM linkedin_search_cache 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create a view for API performance metrics  
CREATE OR REPLACE VIEW linkedin_api_performance AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_searches,
    COUNT(*) FILTER (WHERE user_action = 'selected') as successful_selections,
    COUNT(*) FILTER (WHERE user_action = 'manual_entry') as manual_entries,
    COUNT(*) FILTER (WHERE user_action = 'skipped') as skipped,
    AVG(response_time_ms) as avg_response_time_ms,
    AVG(result_count) as avg_result_count,
    AVG(selection_confidence) FILTER (WHERE selection_confidence IS NOT NULL) as avg_confidence
FROM linkedin_search_metrics 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create a view for top search terms
CREATE OR REPLACE VIEW linkedin_top_searches AS
SELECT 
    search_term,
    COUNT(*) as search_count,
    COUNT(*) FILTER (WHERE user_action = 'selected') as selection_count,
    ROUND(
        (COUNT(*) FILTER (WHERE user_action = 'selected')::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 2
    ) as selection_rate_percent,
    AVG(selection_confidence) FILTER (WHERE selection_confidence IS NOT NULL) as avg_confidence,
    MAX(created_at) as last_searched
FROM linkedin_search_metrics 
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND search_term != 'system_cleanup'
GROUP BY search_term
HAVING COUNT(*) >= 3  -- Only show terms searched at least 3 times
ORDER BY search_count DESC, selection_rate_percent DESC
LIMIT 50;

-- =============================================
-- SCHEDULED MAINTENANCE (via pg_cron if available)
-- =============================================

-- Note: These would typically be set up in production with pg_cron
-- or scheduled via external cron jobs

-- Clean up expired cache entries daily at 2 AM
-- SELECT cron.schedule('linkedin-cache-cleanup', '0 2 * * *', 'SELECT cleanup_expired_linkedin_cache();');

-- Clean up old metrics weekly on Sunday at 3 AM  
-- SELECT cron.schedule('linkedin-metrics-cleanup', '0 3 * * 0', 'SELECT cleanup_old_linkedin_metrics();');

-- Create next month partition on the 25th of each month
-- SELECT cron.schedule('linkedin-partition-create', '0 0 25 * *', 'SELECT create_next_month_partition();');

-- =============================================
-- ROW LEVEL SECURITY (if needed)
-- =============================================

-- Enable RLS on tables if user-specific access control is needed
-- ALTER TABLE linkedin_search_cache ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE linkedin_search_metrics ENABLE ROW LEVEL SECURITY;

-- Example policy (uncomment and modify as needed)
-- CREATE POLICY linkedin_cache_policy ON linkedin_search_cache 
--     FOR ALL TO authenticated 
--     USING (true);

-- =============================================
-- CONSTRAINTS AND VALIDATION
-- =============================================

-- Add constraint to ensure reasonable confidence values
ALTER TABLE linkedin_search_metrics 
ADD CONSTRAINT IF NOT EXISTS check_confidence_range 
CHECK (selection_confidence IS NULL OR (selection_confidence >= 0.0 AND selection_confidence <= 1.0));

-- Add constraint to ensure positive response times
ALTER TABLE linkedin_search_metrics 
ADD CONSTRAINT IF NOT EXISTS check_positive_response_time 
CHECK (response_time_ms IS NULL OR response_time_ms >= 0);

-- Add constraint to ensure reasonable result counts
ALTER TABLE linkedin_search_metrics 
ADD CONSTRAINT IF NOT EXISTS check_reasonable_result_count 
CHECK (result_count IS NULL OR (result_count >= 0 AND result_count <= 1000));

-- =============================================
-- FINAL OPTIMIZATIONS
-- =============================================

-- Update table statistics after index creation
ANALYZE linkedin_search_cache;
ANALYZE linkedin_search_metrics;
ANALYZE companies;

-- Vacuum to reclaim space and update statistics
VACUUM ANALYZE linkedin_search_cache;
VACUUM ANALYZE linkedin_search_metrics;

COMMIT;

-- =============================================
-- PERFORMANCE TESTING QUERIES
-- =============================================

/*
-- Test queries to verify index performance:

-- 1. Cache lookup (should use idx_linkedin_search_cache_active)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM linkedin_search_cache 
WHERE search_term = 'microsoft' AND expires_at > NOW();

-- 2. Metrics analytics (should use idx_linkedin_search_metrics_analytics)
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_action, COUNT(*) 
FROM linkedin_search_metrics 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_action;

-- 3. Company LinkedIn lookup (should use idx_companies_linkedin_url)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM companies 
WHERE linkedin_url = 'https://linkedin.com/company/microsoft';

-- 4. Cache performance view test
SELECT * FROM linkedin_cache_performance LIMIT 7;

-- 5. API performance view test  
SELECT * FROM linkedin_api_performance LIMIT 7;

-- 6. Top searches view test
SELECT * FROM linkedin_top_searches LIMIT 10;
*/