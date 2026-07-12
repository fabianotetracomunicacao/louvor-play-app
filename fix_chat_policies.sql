-- Reset policies for playlist_comments to ensure DELETE works correctly

-- 1. Drop existing policies to clean slate
DROP POLICY IF EXISTS "Author or Owner can delete comments" ON public.playlist_comments;
DROP POLICY IF EXISTS "Members and Owner can view comments" ON public.playlist_comments;
DROP POLICY IF EXISTS "Members and Owner can add comments" ON public.playlist_comments;

-- 2. Re-create Policies

-- READ: Members (viewer/editor) AND Owner
CREATE POLICY "Members and Owner can view comments" ON public.playlist_comments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.owner_id = auth.uid()) -- Owner
        OR
        EXISTS (SELECT 1 FROM public.playlist_members pm WHERE pm.playlist_id = playlist_id AND pm.user_id = auth.uid()) -- Member
    );

-- INSERT: Members (viewer/editor) AND Owner
CREATE POLICY "Members and Owner can add comments" ON public.playlist_comments
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.owner_id = auth.uid()) -- Owner
        OR
        EXISTS (SELECT 1 FROM public.playlist_members pm WHERE pm.playlist_id = playlist_id AND pm.user_id = auth.uid()) -- Member
    );

-- DELETE: Author OR Playlist Owner (Critical Fix)
CREATE POLICY "Author or Owner can delete comments" ON public.playlist_comments
    FOR DELETE USING (
        auth.uid() = user_id -- Content Author
        OR
        EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.owner_id = auth.uid()) -- Playlist Owner
    );

-- Grant permissions
GRANT ALL ON public.playlist_comments TO authenticated;
GRANT ALL ON public.playlist_comments TO service_role;
