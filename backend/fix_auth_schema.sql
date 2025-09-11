-- Fix for authentication issues in Supabase
-- Run this in the Supabase SQL Editor

-- Remove the DEFAULT auth.uid() from user_id column
-- This is necessary because we're passing user_id explicitly from the backend
-- The default was causing conflicts with our authentication flow

ALTER TABLE artifacts 
ALTER COLUMN user_id DROP DEFAULT;

-- Verify the change
SELECT column_name, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'artifacts' 
AND column_name = 'user_id';

-- Note: This change is safe because:
-- 1. We always pass user_id explicitly from the backend
-- 2. The NOT NULL constraint remains in place
-- 3. Existing data is not affected