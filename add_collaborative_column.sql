-- ADD MISSING COLUMN is_collaborative
-- Fixes 400 Bad Request on Playlist Creation

ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT false;

-- OPTIONAL: Add policy update if needed? 
-- Existing policies rely on playlist_items/members, so we might just use this for UI flaging.
-- But let's verification.

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'playlists';
