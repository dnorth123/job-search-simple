-- Just add the missing policy for user signup
-- This will allow users to create their profile during signup
CREATE POLICY "Allow user signup" ON users
    FOR INSERT WITH CHECK (true); 