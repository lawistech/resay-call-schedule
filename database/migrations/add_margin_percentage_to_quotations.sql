-- Migration: Add margin_percentage column to quotations table
-- This migration adds the margin_percentage field to support dynamic margin calculations

-- Add the margin_percentage column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'quotations' 
        AND column_name = 'margin_percentage'
    ) THEN
        ALTER TABLE quotations 
        ADD COLUMN margin_percentage DECIMAL(5, 2);
        
        -- Add a comment to document the field
        COMMENT ON COLUMN quotations.margin_percentage IS 'Margin percentage used for pricing calculations (e.g., 15.00 for 15%)';
        
        RAISE NOTICE 'Added margin_percentage column to quotations table';
    ELSE
        RAISE NOTICE 'margin_percentage column already exists in quotations table';
    END IF;
END $$;

-- Update any existing quotations with a default margin percentage if needed
-- This is optional and can be customized based on business requirements
UPDATE quotations 
SET margin_percentage = 15.00 
WHERE margin_percentage IS NULL 
AND created_at < NOW();

-- Add an index for better query performance if needed
CREATE INDEX IF NOT EXISTS idx_quotations_margin_percentage 
ON quotations(margin_percentage) 
WHERE margin_percentage IS NOT NULL;
