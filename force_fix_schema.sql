-- FORCE FIX RELATIONSHIPS & CHECK ORPHANS

-- 1. Check for "Orphan" items (Items that point to songs that don't exist)
-- If this returns a number > 0, those items will ALWAYS show as "Unknown"
SELECT count(*) as orphan_count 
FROM public.playlist_items 
WHERE song_id NOT IN (SELECT id FROM public.songs);

-- 2. HARD RESET Foreign Key
-- We drop ANY constraint that links these tables to avoid confusion
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'playlist_items_song_id_fkey') THEN
        ALTER TABLE public.playlist_items DROP CONSTRAINT playlist_items_song_id_fkey;
    END IF;
END $$;

-- 3. Re-create the Constraint explicitly
ALTER TABLE public.playlist_items 
ADD CONSTRAINT playlist_items_song_id_fkey 
FOREIGN KEY (song_id) 
REFERENCES public.songs(id) 
ON DELETE CASCADE;

-- 4. Force Permissions Refresh
NOTIFY pgrst, 'reload config';

-- 5. Verification: This query emulates what the App does.
-- It SHOULD return the Title. If title is NULL here, the data is corrupted.
SELECT 
    pi.id as item_id,
    s.title as song_title
FROM public.playlist_items pi
LEFT JOIN public.songs s ON pi.song_id = s.id
LIMIT 5;
