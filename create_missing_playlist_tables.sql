-- Create playlist_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.playlist_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('viewer', 'editor', 'owner')) DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(playlist_id, user_id)
);

-- Create playlist_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.playlist_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.playlist_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_comments ENABLE ROW LEVEL SECURITY;

-- Policies for playlist_members
CREATE POLICY "Members can view members" ON public.playlist_members
    FOR SELECT USING (
        playlist_id IN (
            SELECT id FROM public.playlists WHERE is_public = true OR owner_id = auth.uid()
            UNION
            SELECT playlist_id FROM public.playlist_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage members" ON public.playlist_members
    FOR ALL USING (
        playlist_id IN (SELECT id FROM public.playlists WHERE owner_id = auth.uid())
    );

-- Policies for playlist_comments
CREATE POLICY "Members can view comments" ON public.playlist_comments
    FOR SELECT USING (
        playlist_id IN (
            SELECT id FROM public.playlists WHERE is_public = true OR owner_id = auth.uid()
            UNION
            SELECT playlist_id FROM public.playlist_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Members can add comments" ON public.playlist_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        playlist_id IN (
            SELECT id FROM public.playlists WHERE is_public = true OR owner_id = auth.uid()
            UNION
            SELECT playlist_id FROM public.playlist_members WHERE user_id = auth.uid()
        )
    );
    
-- Grant permissions
GRANT ALL ON public.playlist_members TO authenticated;
GRANT ALL ON public.playlist_comments TO authenticated;
GRANT ALL ON public.playlist_members TO service_role;
GRANT ALL ON public.playlist_comments TO service_role;
