-- Create product_kb_analytics table for tracking usage
CREATE TABLE IF NOT EXISTS product_kb_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_base_id UUID REFERENCES product_knowledge_base(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'view', 'search', 'download', etc.
  search_term TEXT,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE product_kb_analytics ENABLE ROW LEVEL SECURITY;

-- Policy for select (only admins can view analytics)
CREATE POLICY "Admins can view analytics" 
ON product_kb_analytics FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy for insert (anyone can create analytics entries)
CREATE POLICY "Anyone can insert analytics" 
ON product_kb_analytics FOR INSERT 
WITH CHECK (true);

-- Create product_kb_popular table for caching popular entries
CREATE TABLE IF NOT EXISTS product_kb_popular (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_base_id UUID REFERENCES product_knowledge_base(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE product_kb_popular ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view popular entries" 
ON product_kb_popular FOR SELECT 
USING (true);

-- Policy for insert/update (only system can update)
CREATE POLICY "System can manage popular entries" 
ON product_kb_popular FOR ALL 
USING (auth.role() = 'authenticated');

-- Create a function to update popular entries (to be run on a schedule)
CREATE OR REPLACE FUNCTION update_kb_popular_entries()
RETURNS void AS $$
BEGIN
  -- Clear existing data
  DELETE FROM product_kb_popular;
  
  -- Insert new popularity data
  INSERT INTO product_kb_popular (
    knowledge_base_id,
    view_count,
    search_count,
    download_count,
    total_score,
    last_calculated
  )
  SELECT 
    a.knowledge_base_id,
    COUNT(*) FILTER (WHERE a.action = 'view') AS view_count,
    COUNT(*) FILTER (WHERE a.action = 'search') AS search_count,
    COUNT(*) FILTER (WHERE a.action = 'download') AS download_count,
    (COUNT(*) FILTER (WHERE a.action = 'view') * 1) + 
    (COUNT(*) FILTER (WHERE a.action = 'search') * 2) + 
    (COUNT(*) FILTER (WHERE a.action = 'download') * 3) AS total_score,
    NOW() AS last_calculated
  FROM 
    product_kb_analytics a
  WHERE 
    a.created_at > (NOW() - INTERVAL '30 days')
  GROUP BY 
    a.knowledge_base_id;
END;
$$ LANGUAGE plpgsql;
