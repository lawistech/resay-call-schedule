-- Create product_kb_history table for version history
CREATE TABLE IF NOT EXISTS product_kb_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_base_id UUID REFERENCES product_knowledge_base(id) ON DELETE CASCADE,
  product_id UUID REFERENCES product_catalog(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  version INTEGER NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE product_kb_history ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Users can view knowledge base history" 
ON product_kb_history FOR SELECT 
USING (true);

-- Policy for insert
CREATE POLICY "Authenticated users can insert history entries" 
ON product_kb_history FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Add a trigger to automatically create history entries when knowledge base entries are updated
CREATE OR REPLACE FUNCTION create_kb_history_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the current version number or start at 1
  DECLARE
    current_version INTEGER;
  BEGIN
    SELECT COALESCE(MAX(version), 0) + 1 INTO current_version
    FROM product_kb_history
    WHERE knowledge_base_id = NEW.id;
    
    -- Insert the history record
    INSERT INTO product_kb_history (
      knowledge_base_id,
      product_id,
      title,
      content,
      category,
      tags,
      version,
      changed_by,
      change_summary
    ) VALUES (
      NEW.id,
      NEW.product_id,
      NEW.title,
      NEW.content,
      NEW.category,
      NEW.tags,
      current_version,
      NEW.created_by,
      'Initial version'
    );
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for new entries
CREATE TRIGGER kb_entry_created
AFTER INSERT ON product_knowledge_base
FOR EACH ROW
EXECUTE FUNCTION create_kb_history_entry();

-- Create a trigger for updated entries
CREATE OR REPLACE FUNCTION update_kb_history_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history if content has changed
  IF NEW.title != OLD.title OR NEW.content != OLD.content OR NEW.category != OLD.category OR NEW.tags != OLD.tags THEN
    -- Get the current version number
    DECLARE
      current_version INTEGER;
    BEGIN
      SELECT COALESCE(MAX(version), 0) + 1 INTO current_version
      FROM product_kb_history
      WHERE knowledge_base_id = NEW.id;
      
      -- Insert the history record
      INSERT INTO product_kb_history (
        knowledge_base_id,
        product_id,
        title,
        content,
        category,
        tags,
        version,
        changed_by,
        change_summary
      ) VALUES (
        NEW.id,
        NEW.product_id,
        NEW.title,
        NEW.content,
        NEW.category,
        NEW.tags,
        current_version,
        auth.uid(),
        'Updated entry'
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for updates
CREATE TRIGGER kb_entry_updated
AFTER UPDATE ON product_knowledge_base
FOR EACH ROW
EXECUTE FUNCTION update_kb_history_entry();
