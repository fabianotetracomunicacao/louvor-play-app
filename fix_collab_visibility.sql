-- FIX COLLABORATIVE PLAYLISTS VISIBILITY & PERMISSIONS
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE playlist_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- 2. PLAYLIST MEMBERS POLICIES -------------------------

-- A. SELECT: Users need to see their own memberships to list "My Playlists"
-- users also need to see members of playlists they own.
DROP POLICY IF EXISTS "Users can view own memberships" ON playlist_members;
CREATE POLICY "Users can view own memberships" 
ON playlist_members FOR SELECT 
TO authenticated 
USING (
    user_id = auth.uid() -- Can see my own rows
    OR 
    EXISTS ( -- Can see rows if I am the owner of the playlist
        SELECT 1 FROM playlists 
        WHERE id = playlist_members.playlist_id AND owner_id = auth.uid()
    )
    OR
    EXISTS ( -- Can see rows if I am a fellow member (to see who else is in the playlist)?
        -- Optional: For showing avatars in the playlist header
        SELECT 1 FROM playlist_members pm2
        WHERE pm2.playlist_id = playlist_members.playlist_id 
        AND pm2.user_id = auth.uid()
        AND pm2.status = 'active'
    )
);

-- B. UPDATE: Invited users need to update 'pending' -> 'active'
DROP POLICY IF EXISTS "Users can update own membership status" ON playlist_members;
CREATE POLICY "Users can update own membership status" 
ON playlist_members FOR UPDATE
TO authenticated 
USING (user_id = auth.uid()) -- Target my own row
WITH CHECK (user_id = auth.uid()); -- Ensure I stay me

-- C. DELETE: 
-- 1. Users can leave (delete own row) - Covered by "Allow users to unfollow playlists" in fix_rls_v2.sql
-- 2. Owners can remove members
DROP POLICY IF EXISTS "Owners can remove members" ON playlist_members;
CREATE POLICY "Owners can remove members" 
ON playlist_members FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM playlists 
        WHERE id = playlist_members.playlist_id AND owner_id = auth.uid()
    )
);


-- 3. PLAYLISTS POLICIES --------------------------------

-- A. SELECT: Members must be able to see the playlist details (name, etc.)
-- Existing policies likely cover "Owners" and "Public". We strictly add "Members".
DROP POLICY IF EXISTS "Members can view private playlists" ON playlists;
CREATE POLICY "Members can view private playlists" 
ON playlists FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM playlist_members 
        WHERE playlist_id = playlists.id 
        AND user_id = auth.uid()
        -- optionally: AND status = 'active' (but maybe they need to see name to accept invite?)
    )
);

-- 4. SONGS/ITEMS POLICIES (If needed) ------------------
-- If playlist_items inherits access, we might need a policy there too?
-- Usually playlist_items are public or rely on playlist access?
-- Let's check if playlist_items has RLS.
-- Assuming playlist_items needs to be visible to members too.
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view playlist items" ON playlist_items;
CREATE POLICY "Members can view playlist items" 
ON playlist_items FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM playlist_members
        WHERE playlist_id = playlist_items.playlist_id
        AND user_id = auth.uid()
    )
    OR
    EXISTS ( -- Owner
        SELECT 1 FROM playlists
        WHERE id = playlist_items.playlist_id
        AND owner_id = auth.uid()
    )
    OR
    EXISTS ( -- Public Playlist
        SELECT 1 FROM playlists
        WHERE id = playlist_items.playlist_id
        AND is_public = true
    )
);

-- Allow Members to ADD/REMOVE songs (Editor Role)
DROP POLICY IF EXISTS "Editors can manage playlist items" ON playlist_items;
CREATE POLICY "Editors can manage playlist items" 
ON playlist_items FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM playlist_members
        WHERE playlist_id = playlist_items.playlist_id
        AND user_id = auth.uid()
        AND role = 'editor'
        AND status = 'active'
    )
    OR
    EXISTS ( -- Owner
        SELECT 1 FROM playlists
        WHERE id = playlist_items.playlist_id
        AND owner_id = auth.uid()
    )
);
