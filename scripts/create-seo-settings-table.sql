-- Create SEO settings table for homepage and site-wide SEO management
CREATE TABLE IF NOT EXISTS seo_settings (
    id SERIAL PRIMARY KEY,
    page_key VARCHAR(100) NOT NULL UNIQUE DEFAULT 'homepage',
    
    -- Basic Meta Tags
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    meta_keywords TEXT,
    
    -- Open Graph (Facebook, LinkedIn)
    og_title VARCHAR(95),
    og_description VARCHAR(200),
    og_image VARCHAR(500),
    og_image_width INTEGER DEFAULT 1200,
    og_image_height INTEGER DEFAULT 630,
    og_type VARCHAR(50) DEFAULT 'website',
    og_site_name VARCHAR(100),
    og_locale VARCHAR(10) DEFAULT 'bg_BG',
    og_url VARCHAR(500),
    
    -- Twitter Card
    twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
    twitter_title VARCHAR(70),
    twitter_description VARCHAR(200),
    twitter_image VARCHAR(500),
    twitter_site VARCHAR(100),
    twitter_creator VARCHAR(100),
    
    -- Additional SEO
    canonical_url VARCHAR(500),
    robots VARCHAR(100) DEFAULT 'index, follow',
    author VARCHAR(100),
    
    -- Structured Data / Schema.org
    schema_type VARCHAR(50) DEFAULT 'Organization',
    schema_name VARCHAR(200),
    schema_description TEXT,
    schema_logo VARCHAR(500),
    schema_same_as TEXT[], -- Array of social media URLs
    schema_address_locality VARCHAR(100),
    schema_address_region VARCHAR(100),
    schema_address_country VARCHAR(100),
    schema_postal_code VARCHAR(20),
    schema_street_address VARCHAR(200),
    schema_telephone VARCHAR(50),
    schema_email VARCHAR(100),
    
    -- Alternate Languages (hreflang)
    hreflang_en VARCHAR(500),
    hreflang_bg VARCHAR(500),
    
    -- Verification Codes
    google_site_verification VARCHAR(100),
    bing_site_verification VARCHAR(100),
    yandex_verification VARCHAR(100),
    
    -- PWA / Theme
    theme_color VARCHAR(20) DEFAULT '#f59e0b',
    background_color VARCHAR(20) DEFAULT '#ffffff',
    
    -- Analytics & Tracking (IDs only, scripts handled separately)
    ga_tracking_id VARCHAR(50),
    gtm_id VARCHAR(50),
    fb_pixel_id VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seo_settings_page_key ON seo_settings(page_key);

-- Insert default homepage SEO settings
INSERT INTO seo_settings (
    page_key,
    meta_title,
    meta_description,
    meta_keywords,
    og_title,
    og_description,
    og_site_name,
    og_locale,
    og_type,
    twitter_card,
    twitter_title,
    twitter_description,
    robots,
    author,
    schema_type,
    schema_name,
    schema_description,
    schema_address_country,
    theme_color,
    background_color
) VALUES (
    'homepage',
    'Мадикс Граундбейтс - Професионални риболовни принадлежности',
    'Най-голямата фабрика за захранки в България. Висококачествени риболовни продукти от 1995 година. Доставка в цяла България.',
    'риболов, захранки, риболовни принадлежности, въдици, макари, примамки, Мадикс, groundbaits, fishing',
    'Мадикс Граундбейтс - Професионални риболовни принадлежности',
    'Най-голямата фабрика за захранки в България. Висококачествени риболовни продукти от 1995 година.',
    'Мадикс Граундбейтс',
    'bg_BG',
    'website',
    'summary_large_image',
    'Мадикс Граундбейтс - Риболовни принадлежности',
    'Професионални риболовни продукти от най-голямата фабрика за захранки в България.',
    'index, follow',
    'Мадикс Граундбейтс',
    'Organization',
    'Мадикс Граундбейтс',
    'Производство и продажба на висококачествени риболовни принадлежности и захранки в България от 1995 година.',
    'Bulgaria',
    '#f59e0b',
    '#ffffff'
) ON CONFLICT (page_key) DO NOTHING;
