-- Create playlist_members table
CREATE TABLE IF NOT EXISTS public.playlist_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(playlist_id, user_id)
);

-- Enable RLS
ALTER TABLE public.playlist_members ENABLE ROW LEVEL SECURITY;

-- Policies for playlist_members

-- 1. Read: Public if playlist is public OR if user is member/owner
-- We need to join with playlists to check is_public and owner_id
CREATE POLICY "Members can read own membership" ON public.playlist_members
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.playlists p 
            WHERE p.id = playlist_id AND (p.owner_id = auth.uid() OR p.is_public = true)
        )
    );

-- 2. Insert: 
-- A. Follow (join as viewer): Allowed if playlist is public
-- B. Invite (add others): Allowed if auth user is owner
CREATE POLICY "Allow public follow or owner invite" ON public.playlist_members
    FOR INSERT WITH CHECK (
        -- Case A: Self-join as viewer to public playlist
        (
            auth.uid() = user_id 
            AND role = 'viewer'
            AND EXISTS (
                SELECT 1 FROM public.playlists p 
                WHERE p.id = playlist_id AND p.is_public = true
            )
        )
        OR
        -- Case B: Owner adding someone (role can be anything)
        (
            EXISTS (
                SELECT 1 FROM public.playlists p 
                WHERE p.id = playlist_id AND p.owner_id = auth.uid()
            )
        )
    );

-- 3. Delete:
-- A. Unfollow (leave): Allowed if auth user is the member
-- B. Remove (kick): Allowed if auth user is owner
CREATE POLICY "Allow self-leave or owner removal" ON public.playlist_members
    FOR DELETE USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.playlists p 
            WHERE p.id = playlist_id AND p.owner_id = auth.uid()
        )
    );

-- UPDATE POLICIES FOR EXISTING TABLES (To allow collaboration)

-- Playlists: Update allowed for Owner OR Editor Member
CREATE POLICY "Editors can update playlist metadata" ON public.playlists
    FOR UPDATE USING (
        owner_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.playlist_members pm
            WHERE pm.playlist_id = id AND pm.user_id = auth.uid() AND pm.role = 'editor'
        )
    );


-- Playlist Items: Input/Update/Delete allowed for Owner OR Editor Member
-- note: Supabase might require separate policies for Insert/Update/Delete, or ALL.
-- Existing policies might be "Owner Only". We need to broaden them.

-- We'll create a new policy that covers all item operations for editors
CREATE POLICY "Editors can manage items" ON public.playlist_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.playlists p
            LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id
            WHERE 
                public.playlist_items.playlist_id = p.id
                AND (
                    p.owner_id = auth.uid() -- Owner
                    OR 
                    (pm.user_id = auth.uid() AND pm.role = 'editor') -- Editor
                )
        )
    );
