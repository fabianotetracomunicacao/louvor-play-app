-- Add missing columns to songs table
-- These are required for the new metadata features and save functionality

DO $$ 
BEGIN 
    -- Add 'style' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'style') THEN
        ALTER TABLE public.songs ADD COLUMN style TEXT;
    END IF;

    -- Add 'functions' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'functions') THEN
        ALTER TABLE public.songs ADD COLUMN "functions" TEXT[];
    END IF;

    -- Add 'transposition' column if it doesn't exist (seen in debug payload)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'transposition') THEN
        ALTER TABLE public.songs ADD COLUMN transposition INTEGER DEFAULT 0;
    END IF;

    -- Add 'tone' column if it doesn't exist (sometimes used as alias for original_key or custom tone)
    -- Checking if it's used in your code, but based on error 'functions' is the main blocker.
END $$;
