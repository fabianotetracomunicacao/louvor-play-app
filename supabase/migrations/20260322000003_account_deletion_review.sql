-- Migration to handle account deletion transfer
-- 1. Add column to songs table
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS pending_admin_review BOOLEAN DEFAULT false;

-- 2. Create RPC function for deleting a user and sending songs to review
CREATE OR REPLACE FUNCTION public.delete_user_and_transfer_to_review(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    caller_role text;
    oficial_id UUID;
    oficial_email TEXT := 'oficial@louvorplay.com.br';
    successor_id UUID;
    playlist_record RECORD;
BEGIN
    -- Security Check: Only the user themselves or a super_admin can trigger this
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF auth.uid() != target_user_id AND caller_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access Denied: Only super admins or the user themselves can delete an account.';
    END IF;

    -- 1. Find or Create the official account ID
    SELECT id INTO oficial_id FROM public.profiles WHERE email = oficial_email LIMIT 1;
    
    -- If official account doesn't exist, we must create it or throw error.
    -- For safety, we will throw an error if it doesn't exist, as creating an auth user from RPC is complex.
    -- The SuperAdmin should ensure this account exists.
    IF oficial_id IS NULL THEN
        RAISE EXCEPTION 'A conta oficial (%) não foi encontrada. Crie esta conta antes de excluir usuários.', oficial_email;
    END IF;

    -- 2. Transfer collaborative playlists where target is owner
    -- Find playlists owned by target that have other members
    -- Transfer ownership to the oldest member (excluding target)
    FOR playlist_record IN (SELECT id FROM public.playlists WHERE owner_id = target_user_id) LOOP
        -- Find the oldest member (excluding target)
        SELECT user_id INTO successor_id 
        FROM public.playlist_members 
        WHERE playlist_id = playlist_record.id 
          AND user_id != target_user_id 
          AND status = 'active'
        ORDER BY created_at ASC 
        LIMIT 1;

        IF successor_id IS NOT NULL THEN
            -- Transfer ownership
            UPDATE public.playlists SET owner_id = successor_id WHERE id = playlist_record.id;
            -- Remove target from members (to avoid FK violation during user delete if cascade isn't used)
            DELETE FROM public.playlist_members WHERE playlist_id = playlist_record.id AND user_id = target_user_id;
        ELSE
            -- If no successor, the playlist will be deleted by cascade when auth.users is deleted
            -- No action needed if cascade is set up, otherwise:
            DELETE FROM public.playlists WHERE id = playlist_record.id;
        END IF;
    END LOOP;

    -- 3. Transfer songs and mark for review
    UPDATE public.songs
    SET created_by = oficial_id,
        pending_admin_review = true,
        updated_at = timezone('utc'::text, now())
    WHERE created_by = target_user_id;

    -- 4. Delete the user (this cascades to profiles, history, etc if foreign keys are set up correctly)
    -- Supabase auth.users deletion:
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
