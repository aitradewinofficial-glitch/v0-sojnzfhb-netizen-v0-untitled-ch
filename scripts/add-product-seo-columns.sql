-- Add SEO columns to new_products table
-- This migration adds comprehensive SEO fields to each product

-- Basic Meta Tags
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_meta_title VARCHAR(255);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_meta_description TEXT;
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_meta_keywords TEXT;

-- Open Graph Tags (Facebook, LinkedIn)
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_og_title VARCHAR(255);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_og_description TEXT;
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_og_image TEXT;
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_og_image_width INTEGER DEFAULT 1200;
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_og_image_height INTEGER DEFAULT 630;
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_og_type VARCHAR(50) DEFAULT 'product';

-- Twitter Card Tags
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_twitter_card VARCHAR(50) DEFAULT 'summary_large_image';
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_twitter_title VARCHAR(255);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_twitter_description TEXT;
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_twitter_image TEXT;

-- Canonical and Robots
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_canonical_url TEXT;
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_robots VARCHAR(100) DEFAULT 'index, follow';

-- Schema.org / JSON-LD Product Data
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_schema_brand VARCHAR(255);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_schema_sku VARCHAR(100);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_schema_gtin VARCHAR(50);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_schema_mpn VARCHAR(100);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_schema_availability VARCHAR(50) DEFAULT 'InStock';
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_schema_condition VARCHAR(50) DEFAULT 'NewCondition';
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_schema_currency VARCHAR(10) DEFAULT 'BGN';

-- Additional SEO fields
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_focus_keyword VARCHAR(255);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_secondary_keywords TEXT;
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_alt_text TEXT;

-- Bulgarian SEO (for BG version)
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_meta_title_bg VARCHAR(255);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_meta_description_bg TEXT;
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_meta_keywords_bg TEXT;
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_og_title_bg VARCHAR(255);
ALTER TABLE new_products ADD COLUMN IF NOT EXISTS seo_og_description_bg TEXT;

-- Create index for SEO-related searches
CREATE INDEX IF NOT EXISTS idx_products_seo_focus_keyword ON new_products(seo_focus_keyword);
CREATE INDEX IF NOT EXISTS idx_products_seo_meta_title ON new_products(seo_meta_title);

-- Add comment for documentation
COMMENT ON COLUMN new_products.seo_meta_title IS 'SEO: Page title tag (max 60 chars recommended)';
COMMENT ON COLUMN new_products.seo_meta_description IS 'SEO: Meta description (max 160 chars recommended)';
COMMENT ON COLUMN new_products.seo_meta_keywords IS 'SEO: Comma-separated keywords';
COMMENT ON COLUMN new_products.seo_og_title IS 'SEO: Open Graph title for social sharing';
COMMENT ON COLUMN new_products.seo_og_description IS 'SEO: Open Graph description for social sharing';
COMMENT ON COLUMN new_products.seo_og_image IS 'SEO: Open Graph image URL for social sharing';
COMMENT ON COLUMN new_products.seo_twitter_card IS 'SEO: Twitter card type (summary_large_image, summary)';
COMMENT ON COLUMN new_products.seo_canonical_url IS 'SEO: Canonical URL to avoid duplicate content';
COMMENT ON COLUMN new_products.seo_robots IS 'SEO: Robots directive (index/noindex, follow/nofollow)';
COMMENT ON COLUMN new_products.seo_schema_brand IS 'SEO: Product brand for Schema.org';
COMMENT ON COLUMN new_products.seo_schema_availability IS 'SEO: Product availability (InStock, OutOfStock, PreOrder)';
COMMENT ON COLUMN new_products.seo_focus_keyword IS 'SEO: Primary keyword to optimize for';
