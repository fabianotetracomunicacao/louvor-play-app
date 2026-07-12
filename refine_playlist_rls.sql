-- REFINE Playlist RLS (Simplified Logic)
-- This relies on the 'playlists' table's own policies to determine access.
-- If you can SEE the playlist (SELECT id FROM playlists), you can manage its items.

-- 1. Ensure RLS enabled
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential conflicting policies
DROP POLICY IF EXISTS "Users can manage own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can view own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can insert own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can update own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can delete own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.playlist_items;

-- 3. Create the SIMPLIFIED policy
-- "If the playlist ID is in the list of playlists I can see, I can manage it."
CREATE POLICY "Manage items in my playlists" ON public.playlist_items
  FOR ALL
  USING (
    playlist_id IN (SELECT id FROM public.playlists)
  )
  WITH CHECK (
    playlist_id IN (SELECT id FROM public.playlists)
  );

-- 4. Ensure Playlists table has the correct policy (just to be safe)
DROP POLICY IF EXISTS "Users can manage own playlists" ON public.playlists;
CREATE POLICY "Users can manage own playlists" ON public.playlists
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 5. (Optional) Fix Legacy Playlists with NULL owner
-- This updates any unowned playlists to belong to the user executing this script (if run in SQL Editor as authenticated)
-- OR leaves them if run as superuser without auth context.
-- Uncomment the line below if you suspect your playlists have no owner:
-- UPDATE public.playlists SET owner_id = auth.uid() WHERE owner_id IS NULL;
