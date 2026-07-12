-- FIX Playlist Items RLS Policies
-- This script fixes the "403 Forbidden" error when reordering/adding items to playlists.

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can insert own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can update own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can delete own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.playlist_items;

-- 3. Create a comprehensive "Owner Manager" policy
-- This allows SELECT, INSERT, UPDATE, DELETE if the user owns the parent playlist.
CREATE POLICY "Users can manage own playlist items" ON public.playlist_items
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.playlists
      WHERE id = playlist_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.playlists
      WHERE id = playlist_id
    )
  );

-- 4. Verify Playlists Policy (Just in case parent is the issue)
-- Ensure users can actually see their playlists
DROP POLICY IF EXISTS "Users can manage own playlists" ON public.playlists;
CREATE POLICY "Users can manage own playlists" ON public.playlists
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

