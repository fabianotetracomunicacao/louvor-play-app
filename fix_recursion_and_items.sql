-- FIX INFINITE RECURSION ERROR
-- The issue: "infinite recursion detected in policy for relation 'playlists'"
-- Cause: 'playlists' policy checks 'playlist_members', and 'playlist_members' policy checks 'playlists'. Loop!
-- Solution: Make 'playlist_members' policy strictly internal (check auth.uid against user_id or playlist_id via subquery on ITSELF, not playlists table).

-- 1. Enable RLS (Ensure)
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_members ENABLE ROW LEVEL SECURITY;

-- 2. Clean Slate: Drop ALL relevant policies
-- Playlists
DROP POLICY IF EXISTS "select_playlists" ON public.playlists;
DROP POLICY IF EXISTS "insert_playlists" ON public.playlists;
DROP POLICY IF EXISTS "update_playlists" ON public.playlists;
DROP POLICY IF EXISTS "delete_playlists" ON public.playlists;
-- (Legacy ones just in case)
DROP POLICY IF EXISTS "Users can view relevant playlists" ON public.playlists;

-- Members
DROP POLICY IF EXISTS "select_members" ON public.playlist_members;
DROP POLICY IF EXISTS "insert_members" ON public.playlist_members;
DROP POLICY IF EXISTS "update_members" ON public.playlist_members;
DROP POLICY IF EXISTS "delete_members" ON public.playlist_members;

-- Items
DROP POLICY IF EXISTS "select_playlist_items" ON public.playlist_items;
DROP POLICY IF EXISTS "insert_playlist_items" ON public.playlist_items;
DROP POLICY IF EXISTS "update_playlist_items" ON public.playlist_items;
DROP POLICY IF EXISTS "delete_playlist_items" ON public.playlist_items;


-- 3. PLAYLISTS Policies
-- Check: Owner OR Public OR Member
CREATE POLICY "select_playlists" ON public.playlists
  FOR SELECT USING (
    owner_id = auth.uid() 
    OR is_public = true 
    OR EXISTS (SELECT 1 FROM public.playlist_members pm WHERE pm.playlist_id = id AND pm.user_id = auth.uid())
  );

CREATE POLICY "insert_playlists" ON public.playlists
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND owner_id = auth.uid()
  );

CREATE POLICY "update_playlists" ON public.playlists
  FOR UPDATE USING (
    owner_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.playlist_members pm WHERE pm.playlist_id = id AND pm.user_id = auth.uid() AND pm.role = 'editor' AND pm.status = 'active')
  );

CREATE POLICY "delete_playlists" ON public.playlists
  FOR DELETE USING (
    owner_id = auth.uid()
  );


-- 4. PLAYLIST MEMBERS Policies (KEY FIX HERE)
-- Do NOT join 'playlists' to check visibility here.
-- A user can see:
-- A. Their own membership (user_id = auth.uid())
-- B. Other members of playlists they belong to.

CREATE POLICY "select_members" ON public.playlist_members
  FOR SELECT USING (
    user_id = auth.uid() -- A. Specific user
    OR
    playlist_id IN ( -- B. Shared playlists
      SELECT playlist_id FROM public.playlist_members WHERE user_id = auth.uid()
    )
  );

-- Only owners (of the playlist) can manage members.
-- But how do we know if they are owners without querying playlists?
-- Solution: We MUST query playlists for INSERT/UPDATE/DELETE. 
-- BUT, those operations usually don't trigger the SELECT loop unless RLS check uses SELECT.
-- The loop happens mostly on SELECT.
-- For modifications, we can safe-check:

CREATE POLICY "manage_members" ON public.playlist_members
  FOR ALL USING ( -- covering INSERT, UPDATE, DELETE
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND p.owner_id = auth.uid()
    )
  );


-- 5. PLAYLIST ITEMS Policies
-- Safe to query playlists here, as playlists only queries (safe) members.

CREATE POLICY "select_playlist_items" ON public.playlist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id AND pm.user_id = auth.uid()
      WHERE p.id = playlist_items.playlist_id
      AND (
        p.owner_id = auth.uid() 
        OR p.is_public = true 
        OR pm.status = 'active'
      )
    )
  );

CREATE POLICY "insert_playlist_items" ON public.playlist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id AND pm.user_id = auth.uid()
      WHERE p.id = playlist_id
      AND (
        p.owner_id = auth.uid() 
        OR (pm.role = 'editor' AND pm.status = 'active')
      )
    )
  );

CREATE POLICY "update_playlist_items" ON public.playlist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id AND pm.user_id = auth.uid()
      WHERE p.id = playlist_id
      AND (
        p.owner_id = auth.uid() 
        OR (pm.role = 'editor' AND pm.status = 'active')
      )
    )
  );

CREATE POLICY "delete_playlist_items" ON public.playlist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id AND pm.user_id = auth.uid()
      WHERE p.id = playlist_items.playlist_id
      AND (
        p.owner_id = auth.uid() 
        OR (pm.role = 'editor' AND pm.status = 'active')
      )
    )
  );
