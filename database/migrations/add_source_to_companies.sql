-- Add source column to companies table
-- This migration adds a source field to track how the company was acquired

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS source TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN companies.source IS 'Source of the company lead (BCB, Resay, AE, Sumup, etc.)';

-- Create index for faster filtering by source
CREATE INDEX IF NOT EXISTS idx_companies_source ON companies(source);

-- Update existing companies to have a default source if needed
-- UPDATE companies SET source = 'existing' WHERE source IS NULL;
