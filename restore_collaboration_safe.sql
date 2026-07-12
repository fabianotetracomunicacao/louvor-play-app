-- RESTORE COLLABORATION (Safe Version)
-- Now that standard playlists are visible, we re-enable collaboration support properly.
-- We use a fresh function name to ensure no conflicts with previous failures.

-- 1. Create/Replace the Membership Check Function (SECURITY DEFINER)
-- This function runs as admin, so it can check playlist_members without causing permission errors or loops.
CREATE OR REPLACE FUNCTION public.check_is_member_safe(
    p_playlist_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.playlist_members 
        WHERE playlist_id = p_playlist_id 
        AND user_id = p_user_id
    );
END;
$$;

-- 2. Update the Playlist Visibility Policy
-- We allow viewing if: You Own it OR It's Public OR You are a Member.
DROP POLICY IF EXISTS "Users can view relevant playlists" ON public.playlists;

CREATE POLICY "Users can view relevant playlists" ON public.playlists
    FOR SELECT USING (
        owner_id = auth.uid() -- Owner
        OR
        is_public = true -- Public
        OR
        public.check_is_member_safe(id, auth.uid()) -- Collaborative Member
    );

-- 3. Ensure Authenticated Users can execute the check
GRANT EXECUTE ON FUNCTION public.check_is_member_safe TO authenticated;

-- 4. Re-apply Editor Update Policy (Safe check)
-- This allows editors to rename/update the playlist metadata.
DROP POLICY IF EXISTS "Owners and Editors can update playlists" ON public.playlists;

CREATE OR REPLACE FUNCTION public.check_is_editor_safe(
    p_playlist_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.playlist_members 
        WHERE playlist_id = p_playlist_id 
        AND user_id = p_user_id
        AND role = 'editor'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_is_editor_safe TO authenticated;

CREATE POLICY "Owners and Editors can update playlists" ON public.playlists
    FOR UPDATE USING (
        owner_id = auth.uid()
        OR
        public.check_is_editor_safe(id, auth.uid())
    );
