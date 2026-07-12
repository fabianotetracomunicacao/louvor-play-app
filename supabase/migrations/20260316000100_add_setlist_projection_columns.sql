-- Add projection background columns to setlists
ALTER TABLE public.setlists ADD COLUMN IF NOT EXISTS proj_bg_type TEXT;
ALTER TABLE public.setlists ADD COLUMN IF NOT EXISTS proj_bg_url TEXT;
ALTER TABLE public.setlists ADD COLUMN IF NOT EXISTS proj_bg_color TEXT DEFAULT '#000000';

-- Add projection columns to setlist_items
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_bg_type TEXT;
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_bg_url TEXT;
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_bg_color TEXT DEFAULT '#000000';
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_font_size INTEGER;
