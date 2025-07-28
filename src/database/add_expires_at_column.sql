-- Migration to add expires_at column to beta_invites table
-- Run this in your Supabase SQL Editor

-- Add the expires_at column if it doesn't exist
ALTER TABLE beta_invites 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_beta_invites_expires_at ON beta_invites(expires_at);

-- Update the RLS policy to allow unauthenticated access for validation
DROP POLICY IF EXISTS "Authenticated users can view beta_invites" ON beta_invites;
DROP POLICY IF EXISTS "Anyone can view beta_invites for validation" ON beta_invites;

-- Create the new policy that allows unauthenticated access
CREATE POLICY "Anyone can view beta_invites for validation" ON beta_invites
    FOR SELECT USING (true);

-- Only service role can manage beta_invites
DROP POLICY IF EXISTS "Service role can manage beta_invites" ON beta_invites;
CREATE POLICY "Service role can manage beta_invites" ON beta_invites
    FOR ALL USING (auth.role() = 'service_role');

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'beta_invites' 
ORDER BY ordinal_position; 