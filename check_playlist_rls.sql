-- Check existing policies on playlist_members
select * from pg_policies where table_name = 'playlist_members';

-- We need a policy that allows a user to INSERT themselves if the playlist is public.
-- Current policies probably restrict INSERT to playlist owners.

-- Proposed Policy:
-- CREATE POLICY "Allow users to follow public playlists" ON playlist_members
-- FOR INSERT
-- WITH CHECK (
--   user_id = auth.uid() AND
--   EXISTS (
--     SELECT 1 FROM playlists
--     WHERE id = playlist_id AND is_public = true
--   )
-- );
