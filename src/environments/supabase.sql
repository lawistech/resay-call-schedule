-- NOTE: Run these SQL commands in your Supabase SQL Editor

-- Profiles table (extended user info)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  notes TEXT,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calls table
CREATE TABLE calls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  method TEXT DEFAULT 'phone', -- phone, webex, etc.
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, missed, cancelled
  reason TEXT NOT NULL,
  notes TEXT,
  recording_url TEXT,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Profiles policy
CREATE POLICY "Users can view all profiles" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid());

-- Companies policy
CREATE POLICY "Users can view all companies" 
  ON companies FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert companies" 
  ON companies FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update companies" 
  ON companies FOR UPDATE 
  TO authenticated 
  USING (true);

-- Contacts policy
CREATE POLICY "Users can view all contacts" 
  ON contacts FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert contacts" 
  ON contacts FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update contacts" 
  ON contacts FOR UPDATE 
  TO authenticated 
  USING (true);

-- Calls policy
CREATE POLICY "Users can view all calls" 
  ON calls FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert calls" 
  ON calls FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update calls" 
  ON calls FOR UPDATE 
  TO authenticated 
  USING (true);

-- Triggers for updated_at

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_companies
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_contacts
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_calls
BEFORE UPDATE ON calls
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Function to handle new user registrations
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger after user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE handle_new_user();