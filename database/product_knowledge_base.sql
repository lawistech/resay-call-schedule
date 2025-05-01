-- Create product_knowledge_base table
CREATE TABLE IF NOT EXISTS product_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES product_catalog(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- 'technical_specs', 'usage_scenarios', 'faq', 'competitive_analysis'
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE product_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view product knowledge base" 
ON product_knowledge_base FOR SELECT 
USING (true);

-- Policy for insert
CREATE POLICY "Authenticated users can insert knowledge base entries" 
ON product_knowledge_base FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy for update
CREATE POLICY "Authenticated users can update knowledge base entries" 
ON product_knowledge_base FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Policy for delete
CREATE POLICY "Authenticated users can delete knowledge base entries" 
ON product_knowledge_base FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create product_kb_competitive_analysis table for detailed competitor comparisons
CREATE TABLE IF NOT EXISTS product_kb_competitive_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_base_id UUID REFERENCES product_knowledge_base(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_product TEXT NOT NULL,
  comparison_points JSONB NOT NULL, -- Store structured comparison data
  strengths TEXT[],
  weaknesses TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for competitive analysis
ALTER TABLE product_kb_competitive_analysis ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view competitive analysis" 
ON product_kb_competitive_analysis FOR SELECT 
USING (true);

-- Policy for insert/update/delete (same as parent table)
CREATE POLICY "Authenticated users can manage competitive analysis" 
ON product_kb_competitive_analysis FOR ALL 
USING (auth.role() = 'authenticated');
