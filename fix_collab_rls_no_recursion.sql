-- ==============================================
-- Fix: Playlist RLS Recursion (500 Error)
-- Problem: The SELECT policy on `playlists` queries `playlist_members`,
-- and `playlist_members` has an RLS policy that queries back to `playlists`,
-- creating infinite recursion -> 500 error.
--
-- Solution: Use a SECURITY DEFINER function that bypasses RLS when checking membership.
-- This breaks the recursion cycle.
-- ==============================================

-- 1. Create a helper function that runs without RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_playlist_member(p_playlist_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.playlist_members
    WHERE playlist_id = p_playlist_id
      AND user_id = p_user_id
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_playlist_member(uuid, uuid) TO authenticated;

-- 2. Drop ALL existing playlist policies to start fresh
DROP POLICY IF EXISTS "Users can manage own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can view playlists they own or are members of" ON public.playlists;
DROP POLICY IF EXISTS "Users can create their own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Owners can update their playlists" ON public.playlists;
DROP POLICY IF EXISTS "Owners can delete their playlists" ON public.playlists;

-- 3. SELECT: owner OR member (using non-recursive function)
CREATE POLICY "Users can view playlists they own or are members of" ON public.playlists
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR
    public.is_playlist_member(id, auth.uid())
  );

-- 4. INSERT: only for own playlists
CREATE POLICY "Users can create their own playlists" ON public.playlists
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- 5. UPDATE: only owner
CREATE POLICY "Owners can update their playlists" ON public.playlists
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 6. DELETE: only owner  
CREATE POLICY "Owners can delete their playlists" ON public.playlists
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ==============================================
-- Also fix playlist_items using the same helper to avoid recursion there too
-- ==============================================
DROP POLICY IF EXISTS "Users can manage own playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Members can view playlist items" ON public.playlist_items;
DROP POLICY IF EXISTS "Editors can manage playlist items" ON public.playlist_items;

-- SELECT: owner or any member
CREATE POLICY "Members can view playlist items" ON public.playlist_items
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.playlists WHERE id = playlist_id
    )
    OR
    public.is_playlist_member(playlist_id, auth.uid())
  );

-- INSERT/UPDATE/DELETE: owner or active editor
CREATE POLICY "Editors can manage playlist items" ON public.playlist_items
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.playlists WHERE id = playlist_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.playlist_members
      WHERE playlist_id = playlist_items.playlist_id
        AND user_id = auth.uid()
        AND role IN ('editor', 'admin')
        AND status = 'active'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.playlists WHERE id = playlist_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.playlist_members
      WHERE playlist_id = playlist_items.playlist_id
        AND user_id = auth.uid()
        AND role IN ('editor', 'admin')
        AND status = 'active'
    )
  );
