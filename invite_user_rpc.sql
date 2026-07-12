-- Secure function to invite a user by email
CREATE OR REPLACE FUNCTION public.invite_user_to_playlist(
    p_playlist_id UUID,
    p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    target_user_id UUID;
    caller_id UUID;
    v_playlist_owner UUID;
BEGIN
    caller_id := auth.uid();
    
    -- 1. Check if playlist exists and caller is owner
    SELECT owner_id INTO v_playlist_owner
    FROM public.playlists
    WHERE id = p_playlist_id;

    IF v_playlist_owner IS NULL THEN
        RAISE EXCEPTION 'Playlist not found.';
    END IF;

    IF v_playlist_owner != caller_id THEN
        RAISE EXCEPTION 'Access Denied: Only the owner can invite collaborators.';
    END IF;

    -- 2. Find target user by email (Case insensitive)
    -- We can check public.profiles if it syncs with auth.users
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE lower(email) = lower(p_email);

    IF target_user_id IS NULL THEN
        -- Fallback: check auth.users directly if profiles is out of sync (requires security definer)
        SELECT id INTO target_user_id
        FROM auth.users
        WHERE lower(email) = lower(p_email);
    END IF;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with this email.';
    END IF;

    -- 3. Prevent self-invite
    IF target_user_id = caller_id THEN
         RAISE EXCEPTION 'You cannot invite yourself.';
    END IF;

    -- 4. Insert into playlist_members (Role 'editor' for collaborators)
    -- On conflict, update role to editor if they were just a viewer
    INSERT INTO public.playlist_members (playlist_id, user_id, role)
    VALUES (p_playlist_id, target_user_id, 'editor')
    ON CONFLICT (playlist_id, user_id) 
    DO UPDATE SET role = 'editor';

    RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
END;
$$;
