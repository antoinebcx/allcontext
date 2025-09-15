-- Context Platform Database Schema
-- Complete schema for Supabase PostgreSQL
-- Run this in Supabase SQL Editor to set up the database

-- ============================================================================
-- ARTIFACTS TABLE
-- ============================================================================

-- Create artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL CHECK (length(title) <= 200),
    content TEXT NOT NULL CHECK (length(content) <= 100000),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Create indexes for performance
CREATE INDEX idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at DESC);

-- Enable full-text search
ALTER TABLE artifacts 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
) STORED;

CREATE INDEX idx_artifacts_search ON artifacts USING GIN(search_vector);

-- ============================================================================
-- API KEYS TABLE
-- ============================================================================

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    last_4 TEXT NOT NULL,
    lookup_hash VARCHAR(16),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    scopes TEXT[] DEFAULT ARRAY['read', 'write']::TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_scopes CHECK (
        scopes <@ ARRAY['read', 'write', 'delete']::TEXT[]
    )
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_api_keys_lookup_hash ON api_keys(lookup_hash) WHERE is_active = true;

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to artifacts table
CREATE TRIGGER update_artifacts_updated_at 
    BEFORE UPDATE ON artifacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to api_keys table
CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON api_keys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired API keys
CREATE OR REPLACE FUNCTION cleanup_expired_api_keys()
RETURNS void AS $$
BEGIN
    UPDATE api_keys 
    SET is_active = FALSE 
    WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on artifacts table
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Artifacts policies
CREATE POLICY "Users can manage their own artifacts"
    ON artifacts
    FOR ALL
    USING (auth.uid() = user_id);

-- Enable RLS on api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- API Keys policies
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

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON artifacts TO authenticated;
GRANT ALL ON api_keys TO authenticated;
GRANT SELECT ON api_keys TO anon;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

-- Add comments for documentation
COMMENT ON TABLE artifacts IS 'Stores markdown-based AI context artifacts';
COMMENT ON COLUMN artifacts.title IS 'Auto-generated from content if not provided';
COMMENT ON COLUMN artifacts.content IS 'Markdown content, max 100k characters';
COMMENT ON COLUMN artifacts.metadata IS 'Flexible JSON metadata for categorization';

COMMENT ON TABLE api_keys IS 'Stores API keys for programmatic access to the platform';
COMMENT ON COLUMN api_keys.key_hash IS 'Bcrypt hash of the actual API key';
COMMENT ON COLUMN api_keys.key_prefix IS 'Visible prefix for key identification (e.g., sk_prod_)';
COMMENT ON COLUMN api_keys.last_4 IS 'Last 4 characters of the key for display purposes';
COMMENT ON COLUMN api_keys.lookup_hash IS 'SHA256 hash of first 16 chars of API key for fast filtering during validation';
COMMENT ON COLUMN api_keys.scopes IS 'Array of permissions: read, write, delete';
