-- API Keys Schema for Context Platform
-- Run this in the Supabase SQL Editor after the main schema

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    key_hash TEXT NOT NULL UNIQUE,  -- Store bcrypt/scrypt hash of the key
    key_prefix TEXT NOT NULL,        -- First 8 chars for identification (e.g., "sk_prod_")
    last_4 TEXT NOT NULL,            -- Last 4 chars for display
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    scopes TEXT[] DEFAULT ARRAY['read', 'write']::TEXT[],  -- Permissions array
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_scopes CHECK (
        scopes <@ ARRAY['read', 'write', 'delete']::TEXT[]
    )
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and manage their own API keys
CREATE POLICY "Users can view their own API keys" 
    ON api_keys 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" 
    ON api_keys 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
    ON api_keys 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
    ON api_keys 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON api_keys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up expired keys (optional, can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_api_keys()
RETURNS void AS $$
BEGIN
    UPDATE api_keys 
    SET is_active = FALSE 
    WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE api_keys IS 'Stores API keys for programmatic access to the platform';
COMMENT ON COLUMN api_keys.key_hash IS 'Bcrypt hash of the actual API key';
COMMENT ON COLUMN api_keys.key_prefix IS 'Visible prefix for key identification (e.g., sk_prod_)';
COMMENT ON COLUMN api_keys.last_4 IS 'Last 4 characters of the key for display purposes';
COMMENT ON COLUMN api_keys.scopes IS 'Array of permissions: read, write, delete';

-- Grant permissions
GRANT ALL ON api_keys TO authenticated;
GRANT SELECT ON api_keys TO anon;  -- Anon can't actually access due to RLS