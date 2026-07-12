-- NUCLEAR RESET OF PLAYLIST POLICIES
-- Run this in Supabase SQL Editor to clean up recursion issues.

-- 1. Helper Functions (Force Recreate)
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

-- 2. DROP ALL POSSIBLE POLICIES (Aggressive Cleanup)
-- Playlist Members
DROP POLICY IF EXISTS "Users can view own memberships" ON playlist_members;
DROP POLICY IF EXISTS "Allow users to follow public playlists" ON playlist_members;
DROP POLICY IF EXISTS "Allow users to unfollow playlists" ON playlist_members;
DROP POLICY IF EXISTS "Allow collaborative invites" ON playlist_members;
DROP POLICY IF EXISTS "Users can update own membership status" ON playlist_members;
DROP POLICY IF EXISTS "Owners can remove members" ON playlist_members;
-- Playlists
DROP POLICY IF EXISTS "Members can view private playlists" ON playlists;
DROP POLICY IF EXISTS "Public playlists are visible to everyone" ON playlists; -- Potential default?
DROP POLICY IF EXISTS "Users can insert playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can view own playlists" ON playlists;

-- 3. ENABLE RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_members ENABLE ROW LEVEL SECURITY;

-- 4. REBUILD PLAYLISTS POLICIES -------------------------

-- VIEW (Select): Public OR Owner OR Member
-- (The Member check queries playlist_members, which is now safe)
CREATE POLICY "Users can view playlists" 
ON playlists FOR SELECT 
TO authenticated 
USING (
    owner_id = auth.uid()
    OR
    is_public = true
    OR
    EXISTS (
        SELECT 1 FROM playlist_members 
        WHERE playlist_id = playlists.id 
        AND user_id = auth.uid() -- This condition is simple and shouldn't trigger deep recursion if members policy is simple
    )
);

-- INSERT: Authenticated users can create
CREATE POLICY "Users can create playlists" 
ON playlists FOR INSERT 
TO authenticated 
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Only Owner
CREATE POLICY "Users can update own playlists" 
ON playlists FOR UPDATE 
TO authenticated 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- DELETE: Only Owner
CREATE POLICY "Users can delete own playlists" 
ON playlists FOR DELETE 
TO authenticated 
USING (owner_id = auth.uid());


-- 5. REBUILD MEMBERS POLICIES -------------------------

-- SELECT: See own rows OR see rows if Owner (via function) OR see rows if active Member (via function-ish?)
-- To be super safe against recursion, let's simplify:
-- You can see a row if: It's YOUR row. OR You are the Playlist Owner (via function).
-- (We omit "Seeing other members" for now to reduce risk, unless strictly needed for avatars?)
-- Lets keep it simple first.
CREATE POLICY "Users can view playlist memberships" 
ON playlist_members FOR SELECT 
TO authenticated 
USING (
    user_id = auth.uid() 
    OR 
    public.is_playlist_owner(playlist_id) -- Safe function call
    -- Deleted the 'fellow members' check to guarantee no recursion for now.
);

-- INSERT (Follow/Invite)
CREATE POLICY "Users can join/invite to playlists" 
ON playlist_members FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Case 1: Joining Public Playlist (Self-service)
  (user_id = auth.uid() AND public.is_playlist_public(playlist_id))
  OR
  -- Case 2: Owner Inviting someone (Pending)
  (public.is_playlist_owner(playlist_id) AND status = 'pending')
);

-- UPDATE (Accept Invite)
CREATE POLICY "Users can accept invites" 
ON playlist_members FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid()) -- Just me
WITH CHECK (user_id = auth.uid());

-- DELETE (Leave/Remove)
CREATE POLICY "Users can leave or remove members" 
ON playlist_members FOR DELETE 
TO authenticated 
USING (
    user_id = auth.uid() -- Leave
    OR 
    public.is_playlist_owner(playlist_id) -- Kick (Safe function)
);
