-- Function to delete user with optional song transfer
CREATE OR REPLACE FUNCTION public.delete_user_with_transfer(
    target_user_id UUID,
    successor_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    caller_role public.user_role;
    target_song_count INT;
BEGIN
    -- Security Check: Caller must be admin OR deleting self (if we allow self-delete logic here)
    -- For now, enforcing Admin rule as per this file's context, or checking dynamic policies.
    -- Strict Admin check for now to match previous 'delete_user_by_admin'.
    
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role IS DISTINCT FROM 'admin'::public.user_role THEN
        RAISE EXCEPTION 'Access Denied: Only admins can delete users.';
    END IF;

    -- Check if target has songs
    SELECT count(*) INTO target_song_count FROM public.songs WHERE created_by = target_user_id;

    -- Validation: If songs exist, successor MUST be provided
    IF target_song_count > 0 AND successor_id IS NULL THEN
        RAISE EXCEPTION 'User has % songs. You must provide a successor ID to transfer ownership.', target_song_count;
    END IF;

    -- Transfer Songs if successor provided
    IF successor_id IS NOT NULL THEN
        -- Verify successor exists and is eligible (optional, but good practice)
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = successor_id) THEN
            RAISE EXCEPTION 'Successor user not found.';
        END IF;

        UPDATE public.songs 
        SET created_by = successor_id 
        WHERE created_by = target_user_id;
    END IF;

    -- Delete User (Cascade should handle profile, memberships etc)
    DELETE FROM auth.users WHERE id = target_user_id;
    
END;
$$;
