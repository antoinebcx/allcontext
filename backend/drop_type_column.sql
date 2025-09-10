-- SQL migration to remove type column from artifacts table
-- Run this in Supabase SQL Editor

-- Remove type constraint and column
ALTER TABLE artifacts 
DROP CONSTRAINT IF EXISTS artifacts_type_check;

ALTER TABLE artifacts 
DROP COLUMN IF EXISTS type;

-- Remove any indexes that might reference the type column
DROP INDEX IF EXISTS idx_artifacts_type;
DROP INDEX IF EXISTS idx_artifacts_user_type;