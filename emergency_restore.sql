-- EMERGENCY RESTORE
-- Something went wrong with the detailed permissions, hiding all playlists.
-- This script resets the "SELECT" (View) policy to the basic "Owner + Public" rule.
-- We will re-add collaboration support in a next step once we confirm this works.

-- 1. Reset Playlists RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant playlists" ON public.playlists;

CREATE POLICY "Users can view relevant playlists" ON public.playlists
    FOR SELECT USING (
        owner_id = auth.uid() -- I own it
        OR
        is_public = true -- It's public
    );

-- 2. Reset Permissions (Just in case)
GRANT ALL ON public.playlists TO authenticated;
GRANT ALL ON public.playlist_members TO authenticated;
