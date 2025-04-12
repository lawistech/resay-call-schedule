-- Create opportunity_history table
CREATE TABLE IF NOT EXISTS opportunity_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE opportunity_history ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view opportunity history" 
ON opportunity_history FOR SELECT 
USING (true);

-- Policy for insert
CREATE POLICY "Authenticated users can insert opportunity history" 
ON opportunity_history FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy for update
CREATE POLICY "Authenticated users can update opportunity history" 
ON opportunity_history FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Policy for delete
CREATE POLICY "Authenticated users can delete opportunity history" 
ON opportunity_history FOR DELETE 
USING (auth.role() = 'authenticated');

-- Add trigger for created_at
CREATE TRIGGER set_timestamp_opportunity_history
BEFORE UPDATE ON opportunity_history
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
