-- Policy to allow authenticated users to follow public playlists
-- This allows INSERT into playlist_members if:
-- 1. The user_id being inserted is the authenticated user's ID (cannot force others to follow).
-- 2. The playlist exists and is_public is true.

CREATE POLICY "Allow users to follow public playlists" 
ON playlist_members
FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM playlists
    WHERE id = playlist_id AND is_public = true
  )
);

-- Policy to allow users to UNFOLLOW (Delete their own member row)
-- (This might already exist, but ensuring it)
CREATE POLICY "Allow users to unfollow playlists"
ON playlist_members
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
);
