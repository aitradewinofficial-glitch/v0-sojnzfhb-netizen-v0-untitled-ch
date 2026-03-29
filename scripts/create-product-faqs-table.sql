-- Create product_faqs table for storing FAQ items for products
CREATE TABLE IF NOT EXISTS product_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  question_en TEXT,
  answer TEXT NOT NULL,
  answer_en TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by product_id
CREATE INDEX IF NOT EXISTS idx_product_faqs_product_id ON product_faqs(product_id);

-- Create index for active FAQs
CREATE INDEX IF NOT EXISTS idx_product_faqs_active ON product_faqs(is_active);

-- Add comment to table
COMMENT ON TABLE product_faqs IS 'Stores frequently asked questions for products';
