-- Create playlist_comments table if not exists
CREATE TABLE IF NOT EXISTS public.playlist_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.playlist_comments ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Read: Members (viewer/editor) AND Owner
CREATE POLICY "Members and Owner can view comments" ON public.playlist_comments
    FOR SELECT USING (
        -- User is the playlist owner
        EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.owner_id = auth.uid())
        OR
        -- User is a member
        EXISTS (SELECT 1 FROM public.playlist_members pm WHERE pm.playlist_id = playlist_id AND pm.user_id = auth.uid())
        OR
        -- Playlist is public? (Optional: let's restrict comments to members/owners for now to avoid spam on public lists)
        -- If we want public comments, unrestricted:
        -- EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.is_public = true)
        -- Let's stick to Members + Owner for "Collaborative" feel.
        false
    );

-- 2. Insert: Members (viewer/editor) AND Owner
CREATE POLICY "Members and Owner can add comments" ON public.playlist_comments
    FOR INSERT WITH CHECK (
         -- User is the playlist owner
        EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.owner_id = auth.uid())
        OR
        -- User is a member
        EXISTS (SELECT 1 FROM public.playlist_members pm WHERE pm.playlist_id = playlist_id AND pm.user_id = auth.uid())
    );

-- 3. Delete: Comment Author OR Playlist Owner
CREATE POLICY "Author or Owner can delete comments" ON public.playlist_comments
    FOR DELETE USING (
        auth.uid() = user_id -- Author
        OR
        EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.owner_id = auth.uid()) -- Playlist Owner
    );
