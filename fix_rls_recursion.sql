-- Fix Infinite Recursion in RLS by using a Security Definer function

-- 1. Create a secure function to check membership (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_playlist_member(_playlist_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.playlist_members 
    WHERE playlist_id = _playlist_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view members" ON public.playlist_members;
DROP POLICY IF EXISTS "Members can view comments" ON public.playlist_comments;
DROP POLICY IF EXISTS "Members can add comments" ON public.playlist_comments;

-- 3. Re-create policies using the secure function

-- Playlist Members Policy
CREATE POLICY "Members can view members" ON public.playlist_members
    FOR SELECT USING (
        user_id = auth.uid() -- Can always see self
        OR
        playlist_id IN (SELECT id FROM public.playlists WHERE owner_id = auth.uid()) -- Owner sees all
        OR
        playlist_id IN (SELECT id FROM public.playlists WHERE is_public = true) -- Public visible
        OR
        public.is_playlist_member(playlist_id) -- Members see other members (Secure check)
    );

-- Playlist Comments Policy
CREATE POLICY "Members can view comments" ON public.playlist_comments
    FOR SELECT USING (
        playlist_id IN (SELECT id FROM public.playlists WHERE owner_id = auth.uid())
        OR
        playlist_id IN (SELECT id FROM public.playlists WHERE is_public = true)
        OR
        public.is_playlist_member(playlist_id)
    );

CREATE POLICY "Members can add comments" ON public.playlist_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            playlist_id IN (SELECT id FROM public.playlists WHERE owner_id = auth.uid())
            OR
            playlist_id IN (SELECT id FROM public.playlists WHERE is_public = true)
            OR
            public.is_playlist_member(playlist_id)
        )
    );
