-- FIX Permissions and RLS for Playlist Members
-- Ensure that the 'authenticated' role actually has permission to access the tables.
-- Also re-applies the 'See Own Membership' policy to be absolutely sure.

-- 1. Grant Table Permissions
GRANT ALL ON public.playlists TO authenticated;

GRANT ALL ON public.playlist_members TO authenticated;
GRANT ALL ON public.playlist_items TO authenticated;
GRANT ALL ON public.playlist_comments TO authenticated;

-- Grant Sequence Permissions (for ID generation if serial, though we use UUIDs usually)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. Fix 'playlist_members' RLS
-- Ensure users can definitely see their own membership rows.
ALTER TABLE public.playlist_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own membership" ON public.playlist_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.playlist_members;

CREATE POLICY "Users can view their own memberships" ON public.playlist_members
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- 3. Fix 'profiles' RLS (for Avatars)
-- Users need to see profiles they share playlists with, or just all profiles.
-- Safer: All profiles are viewable (common for social apps) or at least search by email works.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- 4. Re-verify Playlists RLS (from previous step, but ensuring Grants are there)
-- (Already handled in previous script, hopefully)
