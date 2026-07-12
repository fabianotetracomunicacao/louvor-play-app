-- ==============================================
-- Fix: Collaborative Playlist Visibility
-- Problem: Members added via `playlist_members` cannot see the playlist
-- because the `playlists` RLS policy only allows owner_id access.
-- 
-- Solution: Split policy into SELECT (owner OR member) and ALL (owner only).
-- ==============================================

-- 1. Drop the current all-in-one policy
DROP POLICY IF EXISTS "Users can manage own playlists" ON public.playlists;

-- 2. New SELECT policy: owners AND members can read a playlist
CREATE POLICY "Users can view playlists they own or are members of" ON public.playlists
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR
    auth.uid() IN (
      SELECT user_id FROM public.playlist_members
      WHERE playlist_id = id
    )
  );

-- 3. INSERT policy: only authenticated users can create playlists (for themselves)
CREATE POLICY "Users can create their own playlists" ON public.playlists
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- 4. UPDATE policy: only owner can update playlist metadata
CREATE POLICY "Owners can update their playlists" ON public.playlists
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 5. DELETE policy: only owner can delete
CREATE POLICY "Owners can delete their playlists" ON public.playlists
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ==============================================
-- Also fix playlist_items: members (editors) should be able 
-- to view and manage items in playlists they belong to.
-- ==============================================

DROP POLICY IF EXISTS "Users can manage own playlist items" ON public.playlist_items;

-- SELECT: owner or member of the parent playlist
CREATE POLICY "Members can view playlist items" ON public.playlist_items
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.playlists WHERE id = playlist_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM public.playlist_members WHERE playlist_id = playlist_items.playlist_id
    )
  );

-- INSERT/UPDATE/DELETE: owner or editor member
CREATE POLICY "Editors can manage playlist items" ON public.playlist_items
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.playlists WHERE id = playlist_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM public.playlist_members 
      WHERE playlist_id = playlist_items.playlist_id
        AND role IN ('editor', 'admin')
        AND status = 'active'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.playlists WHERE id = playlist_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM public.playlist_members 
      WHERE playlist_id = playlist_items.playlist_id
        AND role IN ('editor', 'admin')
        AND status = 'active'
    )
  );
