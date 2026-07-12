-- FIX Playlist Visibility & Collab RLS
-- The previous policies restricted access strictly to the owner.
-- We must allow members (collaborators) to SEE and EDIT the playlists they are part of.

-- 1. Enable RLS (just in case)
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can manage own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Editors can update playlist metadata" ON public.playlists; -- Clean up possibly duplicate/old ones
DROP POLICY IF EXISTS "Public playlists are viewable by everyone" ON public.playlists;

-- 3. Define GRANULAR Policies

-- A. SELECT (Read)
-- Allowed if:
-- 1. I am the Owner
-- 2. The playlist is Public
-- 3. I am a Member (any role: viewer or editor)
CREATE POLICY "Users can view relevant playlists" ON public.playlists
    FOR SELECT USING (
        owner_id = auth.uid() -- Owner
        OR
        is_public = true -- Public
        OR
        EXISTS ( -- Member
            SELECT 1 FROM public.playlist_members pm
            WHERE pm.playlist_id = id AND pm.user_id = auth.uid()
        )
    );

-- B. INSERT (Create)
-- Allowed if: Authenticated users can create playlists.
CREATE POLICY "Users can create playlists" ON public.playlists
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND
        owner_id = auth.uid() -- Determine ownership on creation
    );

-- C. UPDATE (Edit)
-- Allowed if:
-- 1. I am the Owner
-- 2. I am an Editor Member
CREATE POLICY "Owners and Editors can update playlists" ON public.playlists
    FOR UPDATE USING (
        owner_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.playlist_members pm
            WHERE pm.playlist_id = id AND pm.user_id = auth.uid() AND pm.role = 'editor'
        )
    );

-- D. DELETE (Remove)
-- Allowed if:
-- 1. I am the Owner ONLY. Editors cannot delete the whole playlist.
CREATE POLICY "Only owners can delete playlists" ON public.playlists
    FOR DELETE USING (
        owner_id = auth.uid()
    );

-- 4. BONUS: Ensure playlist_items are also accessible
-- The previous simplified policy check was: "playlist_id IN (SELECT id FROM public.playlists)"
-- Since we just updated `public.playlists` visibility, that simplified policy MIGHT Just Work™ because
-- `SELECT id FROM public.playlists` will now return proper shared playlists for the user.
-- However, we'll confirm it here.

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- Re-apply the dynamic "If I can see the playlist, I can see the items" rule?
-- OR be explicit. The `refine_playlist_rls.sql` had:
-- playlist_id IN (SELECT id FROM public.playlists)
-- That logic relies on the recursive check of the `playlists` policy.
-- If I can SELECT the playlist (which I now can as a member), I can SELECT the items.
-- For UPDATE/DELETE items, we might want to restrict to Editors only (not Viewers).

DROP POLICY IF EXISTS "Manage items in my playlists" ON public.playlist_items;

CREATE POLICY "View items in visible playlists" ON public.playlist_items
    FOR SELECT USING (
        playlist_id IN (SELECT id FROM public.playlists)
    );

CREATE POLICY "Manage items in owned or collaborative playlists" ON public.playlist_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.playlists p
            LEFT JOIN public.playlist_members pm ON p.id = pm.playlist_id
            WHERE 
                p.id = playlist_items.playlist_id
                AND (
                    p.owner_id = auth.uid() -- Owner
                    OR 
                    (pm.user_id = auth.uid() AND pm.role = 'editor') -- Editor
                )
        )
    );
