-- Create opportunity_products table
CREATE TABLE IF NOT EXISTS opportunity_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id UUID REFERENCES product_catalog(id) ON DELETE SET NULL,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE opportunity_products ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view opportunity products" 
ON opportunity_products FOR SELECT 
USING (true);

-- Policy for insert
CREATE POLICY "Authenticated users can insert opportunity products" 
ON opportunity_products FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy for update
CREATE POLICY "Authenticated users can update opportunity products" 
ON opportunity_products FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Policy for delete
CREATE POLICY "Authenticated users can delete opportunity products" 
ON opportunity_products FOR DELETE 
USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE TRIGGER set_timestamp_opportunity_products
BEFORE UPDATE ON opportunity_products
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
