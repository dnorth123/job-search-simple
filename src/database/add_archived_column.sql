-- Add archived column to applications table
-- This column will store whether an application is archived (hidden from dashboard)

-- Add the archived column
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create an index for better performance on archived queries
CREATE INDEX IF NOT EXISTS idx_applications_archived ON applications(archived);

-- Create a composite index for user and archived queries
CREATE INDEX IF NOT EXISTS idx_applications_user_archived ON applications(user_id, archived); 