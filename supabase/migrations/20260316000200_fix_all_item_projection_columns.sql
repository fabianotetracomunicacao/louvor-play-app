-- Add projection columns to playlist_items (to support per-item overrides in regular playlists)
ALTER TABLE public.playlist_items ADD COLUMN IF NOT EXISTS proj_bg_type TEXT;
ALTER TABLE public.playlist_items ADD COLUMN IF NOT EXISTS proj_bg_url TEXT;
ALTER TABLE public.playlist_items ADD COLUMN IF NOT EXISTS proj_bg_color TEXT DEFAULT '#000000';
ALTER TABLE public.playlist_items ADD COLUMN IF NOT EXISTS proj_font_size INTEGER;

-- Ensure setlists also have these columns (re-running for safety)
ALTER TABLE public.setlists ADD COLUMN IF NOT EXISTS proj_bg_type TEXT;
ALTER TABLE public.setlists ADD COLUMN IF NOT EXISTS proj_bg_url TEXT;
ALTER TABLE public.setlists ADD COLUMN IF NOT EXISTS proj_bg_color TEXT DEFAULT '#000000';

ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_bg_type TEXT;
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_bg_url TEXT;
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_bg_color TEXT DEFAULT '#000000';
ALTER TABLE public.setlist_items ADD COLUMN IF NOT EXISTS proj_font_size INTEGER;
