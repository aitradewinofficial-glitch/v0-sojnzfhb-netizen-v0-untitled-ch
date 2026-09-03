-- Create product_reviews table for storing product reviews and ratings
CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    reviewer_name VARCHAR(255),
    reviewer_email VARCHAR(255),
    review_text TEXT,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);

-- Create a view for average ratings per product
CREATE OR REPLACE VIEW product_rating_summary AS
SELECT 
    product_id,
    COUNT(*) as review_count,
    ROUND(AVG(rating)::numeric, 1) as average_rating
FROM product_reviews
WHERE is_approved = true
GROUP BY product_id;
