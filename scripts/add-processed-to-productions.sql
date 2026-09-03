-- Add processed column to productions table
-- This column tracks whether a production record has been marked as processed

ALTER TABLE productions 
ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false;

-- Create an index for faster queries on processed status
CREATE INDEX IF NOT EXISTS idx_productions_processed ON productions(processed);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'productions' AND column_name = 'processed';
