-- FINAL RECURSION FIX (SECURITY DEFINER FUNCTION)

-- Why this works:
-- Instead of policies querying tables directly (which triggers RLS loop),
-- we define a function that runs with elevated privileges (SECURITY DEFINER).
-- This function can check the 'playlist_members' table without being blocked by RLS.
-- We then use this function inside our policies.

-- 1. Create Helper Function
CREATE OR REPLACE FUNCTION public.fn_is_playlist_member(p_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.playlist_members 
    WHERE playlist_id = p_id 
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Editor Helper (Optional but useful)
CREATE OR REPLACE FUNCTION public.fn_is_playlist_editor(p_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.playlist_members 
    WHERE playlist_id = p_id 
    AND user_id = auth.uid()
    AND role = 'editor'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Reset Policies
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_members ENABLE ROW LEVEL SECURITY;

-- Drop ALL Relevant Policies
DROP POLICY IF EXISTS "select_playlists" ON public.playlists;
DROP POLICY IF EXISTS "insert_playlists" ON public.playlists;
DROP POLICY IF EXISTS "update_playlists" ON public.playlists;
DROP POLICY IF EXISTS "delete_playlists" ON public.playlists;

DROP POLICY IF EXISTS "select_members" ON public.playlist_members;
DROP POLICY IF EXISTS "manage_members" ON public.playlist_members;

DROP POLICY IF EXISTS "select_playlist_items" ON public.playlist_items;
DROP POLICY IF EXISTS "insert_playlist_items" ON public.playlist_items;
DROP POLICY IF EXISTS "update_playlist_items" ON public.playlist_items;
DROP POLICY IF EXISTS "delete_playlist_items" ON public.playlist_items;

DROP POLICY IF EXISTS "Legacy View" ON public.playlists;
DROP POLICY IF EXISTS "Legacy Manage" ON public.playlists;


-- 4. Apply New Simplified Policies

-- PLAYLISTS
CREATE POLICY "select_playlists" ON public.playlists
  FOR SELECT USING (
    owner_id = auth.uid() 
    OR is_public = true 
    OR public.fn_is_playlist_member(id)  -- Use function!
  );

CREATE POLICY "insert_playlists" ON public.playlists
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND owner_id = auth.uid()
  );

CREATE POLICY "update_playlists" ON public.playlists
  FOR UPDATE USING (
    owner_id = auth.uid() 
    OR public.fn_is_playlist_editor(id) -- Use function!
  );

CREATE POLICY "delete_playlists" ON public.playlists
  FOR DELETE USING (
    owner_id = auth.uid()
  );


-- PLAYLIST MEMBERS (No recursion now!)
CREATE POLICY "select_members" ON public.playlist_members
  FOR SELECT USING (
    user_id = auth.uid() -- Can always see own membership
    OR public.fn_is_playlist_member(playlist_id) -- Can see other members if I am a member
  );

CREATE POLICY "manage_members" ON public.playlist_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND owner_id = auth.uid())
  );


-- PLAYLIST ITEMS
CREATE POLICY "select_playlist_items" ON public.playlist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND (owner_id = auth.uid() OR is_public = true))
    OR public.fn_is_playlist_member(playlist_id)
  );

CREATE POLICY "insert_playlist_items" ON public.playlist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND owner_id = auth.uid())
    OR public.fn_is_playlist_editor(playlist_id)
  );

CREATE POLICY "update_playlist_items" ON public.playlist_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND owner_id = auth.uid())
    OR public.fn_is_playlist_editor(playlist_id)
  );

CREATE POLICY "delete_playlist_items" ON public.playlist_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND owner_id = auth.uid())
    OR public.fn_is_playlist_editor(playlist_id)
  );
