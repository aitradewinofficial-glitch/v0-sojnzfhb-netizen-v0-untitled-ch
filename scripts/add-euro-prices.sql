-- Add euro price columns to new_products table
-- Matching the existing BGN price columns: price, retailerprice, wholesalerprice, europe_price
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS price_eur DECIMAL(10,2);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS retailerprice_eur DECIMAL(10,2);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS wholesalerprice_eur DECIMAL(10,2);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS europe_price_eur DECIMAL(10,2);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'new_products' AND column_name LIKE '%eur%';
