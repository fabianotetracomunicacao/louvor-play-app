-- Function to update user password by admin
CREATE OR REPLACE FUNCTION public.update_user_password_by_admin(
    target_user_id UUID,
    new_password TEXT
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
        RAISE EXCEPTION 'Access Denied: Only admins can change passwords.';
    END IF;

    -- Update Password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- No need to return anything
END;
$$;
