-- Create product_attachments table
CREATE TABLE IF NOT EXISTS product_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES product_catalog(id) ON DELETE CASCADE,
  quotation_id UUID,
  email_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_attachment_target CHECK (
    (quotation_id IS NOT NULL AND email_id IS NULL) OR
    (quotation_id IS NULL AND email_id IS NOT NULL)
  )
);

-- Add RLS policies
ALTER TABLE product_attachments ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view product attachments" 
ON product_attachments FOR SELECT 
USING (true);

-- Policy for insert
CREATE POLICY "Authenticated users can insert product attachments" 
ON product_attachments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy for update
CREATE POLICY "Authenticated users can update product attachments" 
ON product_attachments FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Policy for delete
CREATE POLICY "Authenticated users can delete product attachments" 
ON product_attachments FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_product_attachments_modtime
BEFORE UPDATE ON product_attachments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
