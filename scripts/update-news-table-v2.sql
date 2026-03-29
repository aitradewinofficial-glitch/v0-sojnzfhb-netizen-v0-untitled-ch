-- Add new columns to news table for SEO, content blocks, and related products

-- SEO fields
ALTER TABLE news ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE news ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE news ADD COLUMN IF NOT EXISTS meta_title_en VARCHAR(255);
ALTER TABLE news ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS meta_description_en TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS meta_keywords TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS meta_keywords_en TEXT;

-- Content blocks (JSON array for rich content with text and images)
ALTER TABLE news ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE news ADD COLUMN IF NOT EXISTS content_blocks_en JSONB DEFAULT '[]'::jsonb;

-- Related products (JSON array of product IDs)
ALTER TABLE news ADD COLUMN IF NOT EXISTS related_products JSONB DEFAULT '[]'::jsonb;

-- Gallery images (JSON array of image URLs)
ALTER TABLE news ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- Create index for slug lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_slug ON news(slug) WHERE slug IS NOT NULL;

-- Update existing rows to have empty arrays for JSONB columns
UPDATE news SET content_blocks = '[]'::jsonb WHERE content_blocks IS NULL;
UPDATE news SET content_blocks_en = '[]'::jsonb WHERE content_blocks_en IS NULL;
UPDATE news SET related_products = '[]'::jsonb WHERE related_products IS NULL;
UPDATE news SET gallery_images = '[]'::jsonb WHERE gallery_images IS NULL;
