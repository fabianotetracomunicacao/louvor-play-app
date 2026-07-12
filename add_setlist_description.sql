-- Add description column to setlists table
ALTER TABLE setlists 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Verify it was added (optional, for output)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'setlists' AND column_name = 'description';
