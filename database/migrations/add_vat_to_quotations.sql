-- Add VAT fields to quotations table
ALTER TABLE quotations
ADD COLUMN vat_rate DECIMAL(5, 2) DEFAULT 20.00,
ADD COLUMN vat_amount DECIMAL(10, 2) GENERATED ALWAYS AS (total * (vat_rate / 100)) STORED,
ADD COLUMN total_with_vat DECIMAL(10, 2) GENERATED ALWAYS AS (total + (total * (vat_rate / 100))) STORED;

-- Comment on columns
COMMENT ON COLUMN quotations.vat_rate IS 'VAT rate percentage (default 20%)';
COMMENT ON COLUMN quotations.vat_amount IS 'Calculated VAT amount based on total and VAT rate';
COMMENT ON COLUMN quotations.total_with_vat IS 'Total amount including VAT';
