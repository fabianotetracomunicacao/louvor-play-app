-- Fix 403 Error on Playlist Items Insert
-- The previous policies might be too restrictive or conflicting. 
-- We need to ensure that:
-- 1. Owners can insert items.
-- 2. Editors (collaborators) can insert items.

-- Enable RLS
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Users can manage own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Manage items in my playlists" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can insert own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Manage items in owned or collaborative playlists" ON public.playlist_items;

-- 1. SELECT (View)
-- If I can see the playlist, I can see the items.
CREATE POLICY "View playlist items" ON public.playlist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = playlist_items.playlist_id
      AND (
        p.owner_id = auth.uid() OR
        p.is_public = true OR
        (pm.user_id = auth.uid() AND pm.status = 'active')
      )
    )
  );

-- 2. INSERT (Add)
-- Owner OR Editor
CREATE POLICY "Add playlist items" ON public.playlist_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = playlist_id -- from the new row
      AND (
        p.owner_id = auth.uid() OR 
        (pm.user_id = auth.uid() AND pm.role = 'editor' AND pm.status = 'active')
      )
    )
  );

-- 3. UPDATE (Edit)
-- Owner OR Editor
CREATE POLICY "Update playlist items" ON public.playlist_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = playlist_id
      AND (
        p.owner_id = auth.uid() OR 
        (pm.user_id = auth.uid() AND pm.role = 'editor' AND pm.status = 'active')
      )
    )
  );

-- 4. DELETE (Remove)
-- Owner OR Editor
CREATE POLICY "Delete playlist items" ON public.playlist_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = playlist_id
      AND (
        p.owner_id = auth.uid() OR 
        (pm.user_id = auth.uid() AND pm.role = 'editor' AND pm.status = 'active')
      )
    )
  );
