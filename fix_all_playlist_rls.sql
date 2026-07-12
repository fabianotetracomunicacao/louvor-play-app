-- ULTIMATE PLAYLIST RLS FIX
-- This script drops ALL policies related to playlists and items and re-creates them cleanly.
-- It is designed to fix 403 Forbidden errors by simplifying access rules.

-- 1. Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- 2. Clean Slate: Drop ALL existing policies
-- Playlists
DROP POLICY IF EXISTS "Users can view relevant playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can create playlists" ON public.playlists;
DROP POLICY IF EXISTS "Owners and Editors can update playlists" ON public.playlists;
DROP POLICY IF EXISTS "Only owners can delete playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can manage own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Public playlists are viewable by everyone" ON public.playlists;
DROP POLICY IF EXISTS "Editors can update playlist metadata" ON public.playlists;

-- Items
DROP POLICY IF EXISTS "View playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Add playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Update playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Delete playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can manage own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Manage items in my playlists" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can insert own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Manage items in owned or collaborative playlists" ON public.playlist_items;
DROP POLICY IF EXISTS "View items in visible playlists" ON public.playlist_items;


-- 3. PLAYLISTS Policies

-- SELECT: Owner OR Public OR Member
CREATE POLICY "select_playlists" ON public.playlists
  FOR SELECT USING (
    owner_id = auth.uid() 
    OR is_public = true 
    OR EXISTS (SELECT 1 FROM public.playlist_members WHERE playlist_id = id AND user_id = auth.uid())
  );

-- INSERT: Authenticated users
CREATE POLICY "insert_playlists" ON public.playlists
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND owner_id = auth.uid()
  );

-- UPDATE: Owner OR Editor
CREATE POLICY "update_playlists" ON public.playlists
  FOR UPDATE USING (
    owner_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.playlist_members WHERE playlist_id = id AND user_id = auth.uid() AND role = 'editor' AND status = 'active')
  );

-- DELETE: Owner Only
CREATE POLICY "delete_playlists" ON public.playlists
  FOR DELETE USING (
    owner_id = auth.uid()
  );


-- 4. PLAYLIST ITEMS Policies

-- SELECT: If I can see the playlist, I can see the items.
-- (We repeat logic to avoid recursion or dependency on other policies if possible, but simplest is checking membership directly)
CREATE POLICY "select_playlist_items" ON public.playlist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = playlist_items.playlist_id
      AND (
        p.owner_id = auth.uid() 
        OR p.is_public = true 
        OR (pm.user_id = auth.uid() AND pm.status = 'active')
      )
    )
  );

-- INSERT: Owner OR Editor
CREATE POLICY "insert_playlist_items" ON public.playlist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = playlist_id -- resolved from new row
      AND (
        p.owner_id = auth.uid() 
        OR (pm.user_id = auth.uid() AND pm.role = 'editor' AND pm.status = 'active')
      )
    )
  );

-- UPDATE: Owner OR Editor
CREATE POLICY "update_playlist_items" ON public.playlist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = playlist_id
      AND (
        p.owner_id = auth.uid() 
        OR (pm.user_id = auth.uid() AND pm.role = 'editor' AND pm.status = 'active')
      )
    )
  );

-- DELETE: Owner OR Editor
CREATE POLICY "delete_playlist_items" ON public.playlist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = playlist_id
      AND (
        p.owner_id = auth.uid() 
        OR (pm.user_id = auth.uid() AND pm.role = 'editor' AND pm.status = 'active')
      )
    )
  );
