-- Create company_communications table
CREATE TABLE IF NOT EXISTS company_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'email', 'call', 'meeting', 'note'
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  summary TEXT NOT NULL,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_company_communications_company_id ON company_communications(company_id);
CREATE INDEX IF NOT EXISTS idx_company_communications_contact_id ON company_communications(contact_id);
CREATE INDEX IF NOT EXISTS idx_company_communications_type ON company_communications(type);

-- Enable Row Level Security
ALTER TABLE company_communications ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read all company communications"
  ON company_communications FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert company communications"
  ON company_communications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update company communications"
  ON company_communications FOR UPDATE
  USING (auth.role() = 'authenticated');
