-- Add transposition column to songs table
-- This is required for "Meu tom" saving feature to work in Editor

DO $$ 
BEGIN
    ALTER TABLE public.songs ADD COLUMN transposition integer DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
