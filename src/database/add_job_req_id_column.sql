-- Add job_req_id column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_req_id VARCHAR(100);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_applications_job_req_id ON applications(job_req_id);

-- Update the updated_at trigger to include the new column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql'; 