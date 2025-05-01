-- Create product_kb_attachments table for file attachments
CREATE TABLE IF NOT EXISTS product_kb_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_base_id UUID REFERENCES product_knowledge_base(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE product_kb_attachments ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view knowledge base attachments" 
ON product_kb_attachments FOR SELECT 
USING (true);

-- Policy for insert
CREATE POLICY "Authenticated users can insert attachments" 
ON product_kb_attachments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy for update
CREATE POLICY "Authenticated users can update attachments" 
ON product_kb_attachments FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Policy for delete
CREATE POLICY "Authenticated users can delete attachments" 
ON product_kb_attachments FOR DELETE 
USING (auth.role() = 'authenticated');
