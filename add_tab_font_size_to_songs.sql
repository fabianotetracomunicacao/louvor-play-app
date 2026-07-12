-- Migration: Add tab_font_size to songs table
-- Description: Allows saving a specific font size for tablature blocks independent of the main font size.

ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS tab_font_size numeric DEFAULT NULL;

-- Optional: Update existing songs to have a default relative size if needed, 
-- but NULL serves well as "Auto" (handled in frontend as Math.max(fontSize * 0.7, 6))
