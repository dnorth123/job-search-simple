-- Create beta_invites table for beta access management
CREATE TABLE IF NOT EXISTS beta_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    invited_by VARCHAR(255),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_beta_invites_email ON beta_invites(email);
CREATE INDEX IF NOT EXISTS idx_beta_invites_used_at ON beta_invites(used_at);
CREATE INDEX IF NOT EXISTS idx_beta_invites_expires_at ON beta_invites(expires_at);

-- Enable Row Level Security
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for beta_invites
-- Only authenticated users can view beta_invites (for validation purposes)
CREATE POLICY "Authenticated users can view beta_invites" ON beta_invites
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role or admin can insert/update beta_invites
CREATE POLICY "Service role can manage beta_invites" ON beta_invites
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to automatically update used_at when invite is used
CREATE OR REPLACE FUNCTION update_beta_invite_used()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.used_at IS NOT NULL AND OLD.used_at IS NULL THEN
        NEW.used_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic used_at update
CREATE TRIGGER update_beta_invite_used_at 
    BEFORE UPDATE ON beta_invites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_beta_invite_used();

-- Insert some sample beta invites for testing (optional)
-- INSERT INTO beta_invites (email, expires_at) VALUES 
--     ('test@example.com', NOW() + INTERVAL '30 days'),
--     ('beta@example.com', NOW() + INTERVAL '30 days'); 