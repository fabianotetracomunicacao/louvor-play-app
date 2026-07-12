-- FIX INFINITE RECURSION IN RLS POLICIES (COMPREHENSIVE)
-- Run this in Supabase SQL Editor

-- 1. Create Helper Functions with SECURITY DEFINER
-- These functions bypass RLS to check Playlist attributes safely.

CREATE OR REPLACE FUNCTION public.is_playlist_owner(_playlist_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM playlists 
    WHERE id = _playlist_id 
    AND owner_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_playlist_public(_playlist_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM playlists 
    WHERE id = _playlist_id 
    AND is_public = true
  );
END;
$$;

-- 2. Update 'playlist_members' SELECT Policy
DROP POLICY IF EXISTS "Users can view own memberships" ON playlist_members;
CREATE POLICY "Users can view own memberships" 
ON playlist_members FOR SELECT 
TO authenticated 
USING (
    user_id = auth.uid() 
    OR 
    public.is_playlist_owner(playlist_id) -- Safe check
    OR
    EXISTS (
        SELECT 1 FROM playlist_members pm2
        WHERE pm2.playlist_id = playlist_members.playlist_id 
        AND pm2.user_id = auth.uid()
        AND pm2.status = 'active'
    )
);

-- 3. Update 'playlist_members' INSERT Policies (The "Follow" and "Invite" logic)
-- A. Follow Public Playlists
DROP POLICY IF EXISTS "Allow users to follow public playlists" ON playlist_members;
CREATE POLICY "Allow users to follow public playlists" 
ON playlist_members FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  public.is_playlist_public(playlist_id) -- Safe check
);

-- B. Invites (Owner adding members)
DROP POLICY IF EXISTS "Allow collaborative invites" ON playlist_members;
CREATE POLICY "Allow collaborative invites" 
ON playlist_members FOR INSERT 
TO authenticated 
WITH CHECK (
  public.is_playlist_owner(playlist_id) AND -- Safe check
  status = 'pending'
);


-- 4. Update 'playlist_members' DELETE Policy
DROP POLICY IF EXISTS "Owners can remove members" ON playlist_members;
CREATE POLICY "Owners can remove members" 
ON playlist_members FOR DELETE 
TO authenticated 
USING (
    public.is_playlist_owner(playlist_id) -- Safe check
);
-- Note: "Allow users to unfollow playlists" (delete own) is fine as implies user_id check only.


-- 5. Update 'playlists' SELECT Policy
DROP POLICY IF EXISTS "Members can view private playlists" ON playlists;
CREATE POLICY "Members can view private playlists" 
ON playlists FOR SELECT 
TO authenticated 
USING (
    owner_id = auth.uid()
    OR
    is_public = true
    OR
    EXISTS ( 
        -- This queries playlist_members. playlist_members policies must NOT query playlists directly anymore.
        -- We fixed playlist_members to use functions. So this is safe.
        SELECT 1 FROM playlist_members 
        WHERE playlist_id = playlists.id 
        AND user_id = auth.uid()
    )
);
