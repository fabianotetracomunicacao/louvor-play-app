-- FIX RECURSION "NUCLEAR OPTION"
-- This script dynamically drops ALL policies on the relevant tables to ensure no conflicting rules remain.

-- 1. DROP ALL POLICIES DYNAMICALLY
DO $$ 
DECLARE 
  pol record; 
BEGIN 
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('playlists', 'playlist_items', 'playlist_members', 'playlist_comments') 
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename); 
  END LOOP; 
END $$;

-- 2. CREATE SECURITY DEFINER FUNCTION
-- Bypasses RLS by running as the function owner (postgres).
-- Using search_path = public ensures no hijacking.
CREATE OR REPLACE FUNCTION public.fn_is_member_of_playlist(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM playlist_members 
    WHERE playlist_id = p_id 
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_is_editor_of_playlist(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM playlist_members 
    WHERE playlist_id = p_id 
    AND user_id = auth.uid()
    AND role = 'editor'
    AND status = 'active'
  );
END;
$$;


-- 3. ENABLE RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_comments ENABLE ROW LEVEL SECURITY; -- Also fix comments


-- 4. APPLY NEW POLICIES

-- === PLAYLISTS ===
CREATE POLICY "select_playlists" ON public.playlists
  FOR SELECT USING (
    owner_id = auth.uid() 
    OR is_public = true 
    OR public.fn_is_member_of_playlist(id)
  );

CREATE POLICY "insert_playlists" ON public.playlists
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND owner_id = auth.uid()
  );

CREATE POLICY "update_playlists" ON public.playlists
  FOR UPDATE USING (
    owner_id = auth.uid() 
    OR public.fn_is_editor_of_playlist(id)
  );

CREATE POLICY "delete_playlists" ON public.playlists
  FOR DELETE USING (
    owner_id = auth.uid()
  );

-- === PLAYLIST ITEMS ===
CREATE POLICY "select_playlist_items" ON public.playlist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND (owner_id = auth.uid() OR is_public = true))
    OR public.fn_is_member_of_playlist(playlist_id)
  );

CREATE POLICY "insert_playlist_items" ON public.playlist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND owner_id = auth.uid())
    OR public.fn_is_editor_of_playlist(playlist_id)
  );

CREATE POLICY "update_playlist_items" ON public.playlist_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND owner_id = auth.uid())
    OR public.fn_is_editor_of_playlist(playlist_id)
  );

CREATE POLICY "delete_playlist_items" ON public.playlist_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND owner_id = auth.uid())
    OR public.fn_is_editor_of_playlist(playlist_id)
  );

-- === PLAYLIST MEMBERS ===
-- Only user can see their memberships
-- Or if I'm a member of a playlist, I see other members (via function)
CREATE POLICY "select_members" ON public.playlist_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.fn_is_member_of_playlist(playlist_id)
  );

-- Only OWNER can manage members (Add/Remove)
CREATE POLICY "manage_members" ON public.playlist_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND owner_id = auth.uid())
  );

-- === PLAYLIST COMMENTS ===
CREATE POLICY "select_comments" ON public.playlist_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND (owner_id = auth.uid() OR is_public = true))
    OR public.fn_is_member_of_playlist(playlist_id)
  );

CREATE POLICY "insert_comments" ON public.playlist_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND (owner_id = auth.uid() OR is_public = true))
      OR public.fn_is_member_of_playlist(playlist_id)
    )
  );

