-- Add SEO columns to categories table
-- Basic Meta Tags (EN)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_meta_title VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_meta_description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_meta_keywords TEXT;

-- Open Graph Tags (EN)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_og_title VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_og_description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_og_image TEXT;

-- Twitter Card Tags
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_twitter_card VARCHAR(50) DEFAULT 'summary_large_image';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_twitter_title VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_twitter_description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_twitter_image TEXT;

-- Canonical & Robots
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_canonical_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_robots VARCHAR(100) DEFAULT 'index, follow';

-- Schema.org / Structured Data
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_schema_type VARCHAR(100) DEFAULT 'CollectionPage';

-- Focus Keywords
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_focus_keyword VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_secondary_keywords TEXT;

-- Bulgarian SEO (for BG version)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_meta_title_bg VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_meta_description_bg TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_meta_keywords_bg TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_og_title_bg VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_og_description_bg TEXT;

-- Indexes for categories SEO
CREATE INDEX IF NOT EXISTS idx_categories_seo_focus_keyword ON categories(seo_focus_keyword);
CREATE INDEX IF NOT EXISTS idx_categories_seo_meta_title ON categories(seo_meta_title);

-- Add comments for documentation (categories)
COMMENT ON COLUMN categories.seo_meta_title IS 'SEO: Page title tag for EN (max 60 chars recommended)';
COMMENT ON COLUMN categories.seo_meta_description IS 'SEO: Meta description for EN (max 160 chars recommended)';
COMMENT ON COLUMN categories.seo_meta_keywords IS 'SEO: Comma-separated keywords for EN';
COMMENT ON COLUMN categories.seo_og_title IS 'SEO: Open Graph title for social sharing';
COMMENT ON COLUMN categories.seo_og_description IS 'SEO: Open Graph description for social sharing';
COMMENT ON COLUMN categories.seo_og_image IS 'SEO: Open Graph image URL for social sharing';
COMMENT ON COLUMN categories.seo_twitter_card IS 'SEO: Twitter card type (summary_large_image, summary)';
COMMENT ON COLUMN categories.seo_canonical_url IS 'SEO: Canonical URL to avoid duplicate content';
COMMENT ON COLUMN categories.seo_robots IS 'SEO: Robots meta directive (index, follow, noindex, nofollow)';
COMMENT ON COLUMN categories.seo_meta_title_bg IS 'SEO: Page title tag for BG (max 60 chars recommended)';
COMMENT ON COLUMN categories.seo_meta_description_bg IS 'SEO: Meta description for BG (max 160 chars recommended)';

-- =====================================================
-- Add SEO columns to subcategories table
-- =====================================================

-- Basic Meta Tags (EN)
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_meta_title VARCHAR(255);
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_meta_description TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_meta_keywords TEXT;

-- Open Graph Tags (EN)
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_og_title VARCHAR(255);
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_og_description TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_og_image TEXT;

-- Twitter Card Tags
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_twitter_card VARCHAR(50) DEFAULT 'summary_large_image';
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_twitter_title VARCHAR(255);
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_twitter_description TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_twitter_image TEXT;

-- Canonical & Robots
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_canonical_url TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_robots VARCHAR(100) DEFAULT 'index, follow';

-- Schema.org / Structured Data
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_schema_type VARCHAR(100) DEFAULT 'CollectionPage';

-- Focus Keywords
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_focus_keyword VARCHAR(255);
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_secondary_keywords TEXT;

-- Bulgarian SEO (for BG version)
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_meta_title_bg VARCHAR(255);
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_meta_description_bg TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_meta_keywords_bg TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_og_title_bg VARCHAR(255);
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_og_description_bg TEXT;

-- Indexes for subcategories SEO
CREATE INDEX IF NOT EXISTS idx_subcategories_seo_focus_keyword ON subcategories(seo_focus_keyword);
CREATE INDEX IF NOT EXISTS idx_subcategories_seo_meta_title ON subcategories(seo_meta_title);

-- Add comments for documentation (subcategories)
COMMENT ON COLUMN subcategories.seo_meta_title IS 'SEO: Page title tag for EN (max 60 chars recommended)';
COMMENT ON COLUMN subcategories.seo_meta_description IS 'SEO: Meta description for EN (max 160 chars recommended)';
COMMENT ON COLUMN subcategories.seo_meta_keywords IS 'SEO: Comma-separated keywords for EN';
COMMENT ON COLUMN subcategories.seo_og_title IS 'SEO: Open Graph title for social sharing';
COMMENT ON COLUMN subcategories.seo_og_description IS 'SEO: Open Graph description for social sharing';
COMMENT ON COLUMN subcategories.seo_og_image IS 'SEO: Open Graph image URL for social sharing';
COMMENT ON COLUMN subcategories.seo_twitter_card IS 'SEO: Twitter card type (summary_large_image, summary)';
COMMENT ON COLUMN subcategories.seo_canonical_url IS 'SEO: Canonical URL to avoid duplicate content';
COMMENT ON COLUMN subcategories.seo_robots IS 'SEO: Robots meta directive (index, follow, noindex, nofollow)';
COMMENT ON COLUMN subcategories.seo_meta_title_bg IS 'SEO: Page title tag for BG (max 60 chars recommended)';
COMMENT ON COLUMN subcategories.seo_meta_description_bg IS 'SEO: Meta description for BG (max 160 chars recommended)';
