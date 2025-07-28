-- Add current_status column to applications table
-- This column will store the current status of each application

-- Add the current_status column
ALTER TABLE applications 
ADD COLUMN current_status VARCHAR(50) DEFAULT 'Applied';

-- Update existing applications to have 'Applied' status
UPDATE applications 
SET current_status = 'Applied' 
WHERE current_status IS NULL;

-- Create an index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_applications_current_status ON applications(current_status);

-- Create a composite index for user and status queries
CREATE INDEX IF NOT EXISTS idx_applications_user_current_status ON applications(user_id, current_status);

-- Add a check constraint to ensure valid status values
ALTER TABLE applications 
ADD CONSTRAINT check_current_status 
CHECK (current_status IN ('Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'));

-- Create a function to automatically update current_status when timeline changes
CREATE OR REPLACE FUNCTION update_current_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the current_status in applications table
    UPDATE applications 
    SET current_status = NEW.status,
        updated_at = NOW()
    WHERE id = NEW.application_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update current_status when timeline entry is added
CREATE TRIGGER update_application_current_status 
    AFTER INSERT ON application_timeline 
    FOR EACH ROW 
    EXECUTE FUNCTION update_current_status(); 