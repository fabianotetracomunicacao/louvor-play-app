-- Fix RLS for playlist_scales

-- Drop existing policies
DROP POLICY IF EXISTS "View scales if can view playlist" ON playlist_scales;
DROP POLICY IF EXISTS "Manage scales if owner or editor" ON playlist_scales;

-- 1. SELECT Policy
-- Visible if you can view the playlist (Owner, Linked Member, or Public)
CREATE POLICY "Enable read access for playlist viewers" ON playlist_scales
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM playlists p
        WHERE p.id = playlist_scales.playlist_id
        AND (
            p.owner_id = auth.uid() 
            OR p.is_public = true
            OR EXISTS (
                SELECT 1 FROM playlist_members pm 
                WHERE pm.playlist_id = p.id AND pm.user_id = auth.uid()
            )
        )
    )
);

-- 2. INSERT Policy
-- Allowed if Owner OR Editor OR Collaborative Member
CREATE POLICY "Enable insert for owners and editors" ON playlist_scales
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM playlists p
        WHERE p.id = playlist_scales.playlist_id
        AND (
            p.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM playlist_members pm 
                WHERE pm.playlist_id = p.id 
                AND pm.user_id = auth.uid()
                AND (pm.role IN ('editor', 'admin') OR p.is_collaborative = true)
            )
        )
    )
);

-- 3. DELETE Policy
-- Allowed if Owner OR Editor OR Collaborative Member
CREATE POLICY "Enable delete for owners and editors" ON playlist_scales
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM playlists p
        WHERE p.id = playlist_scales.playlist_id
        AND (
            p.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM playlist_members pm 
                WHERE pm.playlist_id = p.id 
                AND pm.user_id = auth.uid()
                AND (pm.role IN ('editor', 'admin') OR p.is_collaborative = true)
            )
        )
    )
);
