-- Add youtube_links column to songs table
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS youtube_links JSONB DEFAULT '[]'::jsonb;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'songs' AND column_name = 'youtube_links';
