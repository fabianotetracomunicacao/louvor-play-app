-- Add style and functions columns if they don't exist
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS functions TEXT[]; -- Array of text for multiple selections

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'songs' AND column_name IN ('style', 'functions');
