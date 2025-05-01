-- Profile Enhancement SQL
-- Run these SQL commands in your Supabase SQL Editor to enhance user profiles

-- Add new columns to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

-- Update RLS policies for enhanced profile management

-- Allow users to view all profiles (already exists)
-- CREATE POLICY "Users can view all profiles" 
--   ON profiles FOR SELECT 
--   TO authenticated 
--   USING (true);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Function to update profile_completed status
CREATE OR REPLACE FUNCTION update_profile_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if essential fields are filled
  IF NEW.full_name IS NOT NULL AND 
     NEW.email IS NOT NULL AND 
     NEW.role IS NOT NULL
  THEN
    NEW.profile_completed := true;
  ELSE
    NEW.profile_completed := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profile_completed status
CREATE TRIGGER update_profile_completed_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_profile_completed();

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_active timestamp
CREATE TRIGGER update_last_active_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_last_active();
