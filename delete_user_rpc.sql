-- Function to delete user by admin
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(
    target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    caller_role public.user_role;
BEGIN
    -- Security Check: Caller must be admin
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role IS DISTINCT FROM 'admin'::public.user_role THEN
        RAISE EXCEPTION 'Access Denied: Only admins can delete users.';
    END IF;

    -- Delete from auth.users
    -- This should cascade to profiles if foreign key is set up with ON DELETE CASCADE
    -- If not, we might need to delete from profiles first, but auth.users is the source of truth.
    DELETE FROM auth.users WHERE id = target_user_id;
    
    -- If no cascade, explicitly delete from profiles (just in case)
    -- DELETE FROM public.profiles WHERE id = target_user_id; 
    
    -- No need to return anything
END;
$$;
