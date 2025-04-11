-- Create product_catalog table
CREATE TABLE IF NOT EXISTS product_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  stock_quantity INTEGER,
  category TEXT,
  tags TEXT[],
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view product catalog" 
ON product_catalog FOR SELECT 
USING (true);

-- Policy for insert
CREATE POLICY "Authenticated users can insert products" 
ON product_catalog FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy for update
CREATE POLICY "Authenticated users can update products" 
ON product_catalog FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Policy for delete
CREATE POLICY "Authenticated users can delete products" 
ON product_catalog FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_product_catalog_modtime
BEFORE UPDATE ON product_catalog
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
