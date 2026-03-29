-- Migration: Add sort_order and link_url columns to home_page_image table
-- This enables multi-banner carousel support

-- Add sort_order column (default 0, lower = shown first)
ALTER TABLE home_page_image ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add link_url column (optional URL when user clicks the banner)
ALTER TABLE home_page_image ADD COLUMN IF NOT EXISTS link_url TEXT DEFAULT NULL;

-- Create index for efficient banner fetching
CREATE INDEX IF NOT EXISTS idx_home_page_image_active_sort ON home_page_image (is_active, sort_order);
