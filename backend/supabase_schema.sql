-- Supabase Schema for Context Platform
-- Run this in the Supabase SQL Editor

-- Create artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    title TEXT NOT NULL CHECK (length(title) <= 200),
    content TEXT NOT NULL CHECK (length(content) <= 100000),
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Create indexes for performance
CREATE INDEX idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at DESC);
CREATE INDEX idx_artifacts_is_public ON artifacts(is_public);

-- Enable full-text search
ALTER TABLE artifacts 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
) STORED;

CREATE INDEX idx_artifacts_search ON artifacts USING GIN(search_vector);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_artifacts_updated_at 
    BEFORE UPDATE ON artifacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can CRUD their own artifacts
CREATE POLICY "Users can manage their own artifacts" 
ON artifacts 
FOR ALL 
USING (auth.uid() = user_id);

-- Policy: Anyone can read public artifacts
CREATE POLICY "Anyone can read public artifacts" 
ON artifacts 
FOR SELECT 
USING (is_public = TRUE);

-- Create a view for public artifacts (optional, for easier querying)
CREATE OR REPLACE VIEW public_artifacts AS
SELECT 
    id,
    type,
    title,
    content,
    metadata,
    created_at,
    updated_at
FROM artifacts
WHERE is_public = TRUE;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON artifacts TO authenticated;
GRANT SELECT ON artifacts TO anon;
GRANT SELECT ON public_artifacts TO anon, authenticated;
