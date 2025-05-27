-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  total DECIMAL(10, 2) DEFAULT 0,
  margin_percentage DECIMAL(5, 2), -- New field for margin calculation (e.g., 15.00 for 15%)
  valid_until TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotation_items table
CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES product_catalog(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view quotations"
ON quotations FOR SELECT
USING (true);

CREATE POLICY "Users can view quotation items"
ON quotation_items FOR SELECT
USING (true);

-- Policy for insert
CREATE POLICY "Authenticated users can insert quotations"
ON quotations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert quotation items"
ON quotation_items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy for update
CREATE POLICY "Authenticated users can update quotations"
ON quotations FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quotation items"
ON quotation_items FOR UPDATE
USING (auth.role() = 'authenticated');

-- Policy for delete
CREATE POLICY "Authenticated users can delete quotations"
ON quotations FOR DELETE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete quotation items"
ON quotation_items FOR DELETE
USING (auth.role() = 'authenticated');

-- Add triggers for updated_at
CREATE TRIGGER set_timestamp_quotations
BEFORE UPDATE ON quotations
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_quotation_items
BEFORE UPDATE ON quotation_items
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
