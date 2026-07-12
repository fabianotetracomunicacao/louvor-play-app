-- FIX RLS FOR PLAYLIST FOLLOWING (V2)
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow users to follow public playlists" ON playlist_members;
DROP POLICY IF EXISTS "Allow users to unfollow playlists" ON playlist_members;

-- 2. Create INSERT policy
-- Allows any authenticated user to insert a row IF:
-- - They are inserting their own user_id (user_id = auth.uid())
-- - The playlist is PUBLIC (is_public = true)
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

-- 3. Create DELETE policy
-- Allows users to remove their own row (Unfollow)
CREATE POLICY "Allow users to unfollow playlists"
ON playlist_members
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
);

-- 4. Enable RLS (Just in case)
ALTER TABLE playlist_members ENABLE ROW LEVEL SECURITY;
