-- LinkedIn Company Discovery Feature Migration
-- This migration adds all necessary tables and columns for LinkedIn company discovery

-- Create LinkedIn search cache table
CREATE TABLE linkedin_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_term TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  search_count INTEGER DEFAULT 1
);

-- Create indexes for cache table
CREATE INDEX idx_linkedin_cache_search ON linkedin_search_cache(search_term);
CREATE INDEX idx_linkedin_cache_expires ON linkedin_search_cache(expires_at);
CREATE INDEX idx_linkedin_cache_created ON linkedin_search_cache(created_at);

-- Add LinkedIn-related columns to companies table
DO $$
BEGIN
  -- Check if linkedin_url column already exists before adding it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='companies' AND column_name='linkedin_url'
  ) THEN
    -- Column doesn't exist, safe to add all LinkedIn columns
    ALTER TABLE companies 
    ADD COLUMN linkedin_url TEXT,
    ADD COLUMN linkedin_discovery_method TEXT CHECK (linkedin_discovery_method IN ('auto', 'manual', 'none')),
    ADD COLUMN linkedin_confidence DECIMAL(3,2),
    ADD COLUMN linkedin_last_verified TIMESTAMP WITH TIME ZONE;
  ELSE
    -- LinkedIn URL column exists, add only the new discovery columns
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='companies' AND column_name='linkedin_discovery_method'
    ) THEN
      ALTER TABLE companies ADD COLUMN linkedin_discovery_method TEXT CHECK (linkedin_discovery_method IN ('auto', 'manual', 'none'));
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='companies' AND column_name='linkedin_confidence'
    ) THEN
      ALTER TABLE companies ADD COLUMN linkedin_confidence DECIMAL(3,2);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='companies' AND column_name='linkedin_last_verified'
    ) THEN
      ALTER TABLE companies ADD COLUMN linkedin_last_verified TIMESTAMP WITH TIME ZONE;
    END IF;
  END IF;
END $$;

-- Create analytics table for LinkedIn search metrics
CREATE TABLE linkedin_search_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  search_term TEXT NOT NULL,
  results_count INTEGER,
  selected_url TEXT,
  selection_confidence DECIMAL(3,2),
  user_action TEXT CHECK (user_action IN ('selected', 'manual_entry', 'skipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for metrics table
CREATE INDEX idx_linkedin_metrics_user_id ON linkedin_search_metrics(user_id);
CREATE INDEX idx_linkedin_metrics_created_at ON linkedin_search_metrics(created_at);
CREATE INDEX idx_linkedin_metrics_search_term ON linkedin_search_metrics(search_term);
CREATE INDEX idx_linkedin_metrics_user_action ON linkedin_search_metrics(user_action);

-- Create additional index for companies table LinkedIn URL lookups
CREATE INDEX IF NOT EXISTS idx_companies_linkedin_url ON companies(linkedin_url) WHERE linkedin_url IS NOT NULL;

-- Enable Row Level Security for new tables
ALTER TABLE linkedin_search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_search_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for linkedin_search_cache
-- Cache is accessible by all authenticated users (shared cache)
CREATE POLICY "Authenticated users can read cache" ON linkedin_search_cache
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cache" ON linkedin_search_cache
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cache" ON linkedin_search_cache
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for linkedin_search_metrics
-- Users can only see their own metrics
CREATE POLICY "Users can view own metrics" ON linkedin_search_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" ON linkedin_search_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anonymous metrics tracking is allowed (for non-authenticated users)
CREATE POLICY "Allow anonymous metrics tracking" ON linkedin_search_metrics
  FOR INSERT WITH CHECK (user_id IS NULL);

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_linkedin_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM linkedin_search_cache
  WHERE expires_at < NOW() - INTERVAL '1 day'; -- Keep expired entries for 1 day for analytics
END;
$$ LANGUAGE plpgsql;

-- Create function to get cache hit rate for monitoring
CREATE OR REPLACE FUNCTION get_linkedin_cache_hit_rate(days INTEGER DEFAULT 7)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_searches INTEGER;
  cache_hits INTEGER;
BEGIN
  -- Count total searches from metrics
  SELECT COUNT(*) INTO total_searches
  FROM linkedin_search_metrics
  WHERE created_at >= NOW() - (days || ' days')::INTERVAL;
  
  -- Count cache hits (searches that found existing cache entries)
  SELECT COUNT(*) INTO cache_hits
  FROM linkedin_search_cache
  WHERE search_count > 1
  AND created_at >= NOW() - (days || ' days')::INTERVAL;
  
  IF total_searches = 0 THEN
    RETURN 0.0;
  END IF;
  
  RETURN ROUND((cache_hits::DECIMAL / total_searches::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE linkedin_search_cache IS 'Caches LinkedIn company search results to minimize API calls to Brave Search';
COMMENT ON TABLE linkedin_search_metrics IS 'Tracks user interactions with LinkedIn company discovery for analytics and optimization';
COMMENT ON COLUMN companies.linkedin_discovery_method IS 'Tracks how the LinkedIn URL was discovered: auto (via search), manual (user entered), or none';
COMMENT ON COLUMN companies.linkedin_confidence IS 'Confidence score (0.0-1.0) for auto-discovered LinkedIn URLs';
COMMENT ON COLUMN companies.linkedin_last_verified IS 'Timestamp when the LinkedIn URL was last verified or updated';

-- Create a view for easy LinkedIn discovery analytics
CREATE OR REPLACE VIEW linkedin_discovery_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_searches,
  COUNT(CASE WHEN results_count > 0 THEN 1 END) as successful_searches,
  AVG(results_count) as avg_results_per_search,
  COUNT(CASE WHEN user_action = 'selected' THEN 1 END) as auto_selections,
  COUNT(CASE WHEN user_action = 'manual_entry' THEN 1 END) as manual_entries,
  COUNT(CASE WHEN user_action = 'skipped' THEN 1 END) as skipped_searches
FROM linkedin_search_metrics
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant appropriate permissions for the view
GRANT SELECT ON linkedin_discovery_analytics TO authenticated;