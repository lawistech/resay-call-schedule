-- Create product_kb_feedback table for user feedback
CREATE TABLE IF NOT EXISTS product_kb_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_base_id UUID REFERENCES product_knowledge_base(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  is_helpful BOOLEAN,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'implemented', 'rejected'
  admin_response TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE product_kb_feedback ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view their own feedback" 
ON product_kb_feedback FOR SELECT 
USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- Policy for insert
CREATE POLICY "Authenticated users can submit feedback" 
ON product_kb_feedback FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy for update (only admins can update feedback status)
CREATE POLICY "Admins can update feedback" 
ON product_kb_feedback FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create product_kb_ratings view for average ratings
CREATE OR REPLACE VIEW product_kb_ratings AS
SELECT 
  knowledge_base_id,
  COUNT(*) AS total_ratings,
  ROUND(AVG(rating), 1) AS average_rating,
  COUNT(*) FILTER (WHERE is_helpful = true) AS helpful_count,
  COUNT(*) FILTER (WHERE is_helpful = false) AS not_helpful_count
FROM 
  product_kb_feedback
WHERE 
  rating IS NOT NULL
GROUP BY 
  knowledge_base_id;
