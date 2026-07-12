-- Create RPC function to invite user by email
CREATE OR REPLACE FUNCTION public.invite_user_to_playlist(p_playlist_id UUID, p_email TEXT)
RETURNS JSONB AS $$
DECLARE
    v_target_user_id UUID;
    v_playlist_exists BOOLEAN;
    v_is_owner BOOLEAN;
BEGIN
    -- 1. Check if playlist exists
    SELECT EXISTS (SELECT 1 FROM public.playlists WHERE id = p_playlist_id) INTO v_playlist_exists;
    IF NOT v_playlist_exists THEN
        RAISE EXCEPTION 'Playlist not found';
    END IF;

    -- 2. Check permissions (Caller must be owner)
    -- Note: RLS usually handles this, but since we are SECURITY DEFINER or doing logic, clear check is good.
    -- However, for simple collaboration, we'll let RLS on the INSERT handle it if we weren't SECURITY DEFINER.
    -- But to look up the user ID by email securely (profiles might not be public?), we might need SECURITY DEFINER.
    -- Let's stick to simple logic: Verify caller is owner.
    SELECT (owner_id = auth.uid()) INTO v_is_owner FROM public.playlists WHERE id = p_playlist_id;
    
    IF NOT v_is_owner THEN
        RAISE EXCEPTION 'Only the owner can invite collaborators';
    END IF;

    -- 3. Find user by email
    SELECT id INTO v_target_user_id FROM public.profiles WHERE email = p_email;
    
    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', p_email;
    END IF;

    -- 4. Insert into playlist_members
    INSERT INTO public.playlist_members (playlist_id, user_id, role)
    VALUES (p_playlist_id, v_target_user_id, 'editor')
    ON CONFLICT (playlist_id, user_id) 
    DO UPDATE SET role = 'editor'; -- Upgrade if was viewer

    RETURN jsonb_build_object('success', true, 'user_id', v_target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER needed to look up profiles by email if public access is restricted.

GRANT EXECUTE ON FUNCTION public.invite_user_to_playlist TO authenticated;
