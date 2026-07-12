-- Add 'tags' column to songs table
-- This fixes the error: Could not find the 'tags' column of 'songs' in the schema cache

DO $$ 
BEGIN 
    -- Add 'tags' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'tags') THEN
        ALTER TABLE public.songs ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
END $$;
