-- FORCE CLAIM PLAYLISTS
-- This script updates ALL playlists to belong to the user who runs this script.
-- Use this to fix permissions if you are the only user/admin.

UPDATE public.playlists
SET owner_id = auth.uid()
WHERE owner_id IS NULL OR owner_id != auth.uid();

-- Also ensure the RLS policies are correct one last time
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage items in my playlists" ON public.playlist_items;
CREATE POLICY "Manage items in my playlists" ON public.playlist_items
  FOR ALL
  USING (
    playlist_id IN (SELECT id FROM public.playlists)
  )
  WITH CHECK (
    playlist_id IN (SELECT id FROM public.playlists)
  );
