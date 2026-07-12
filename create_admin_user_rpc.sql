-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Drop old function
DROP FUNCTION IF EXISTS public.create_user_by_admin(TEXT, TEXT, TEXT);

-- Create corrected function
CREATE OR REPLACE FUNCTION public.create_user_by_admin(
    new_email TEXT, 
    new_password TEXT, 
    new_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    new_id UUID;
    caller_role public.user_role; -- Typed correctly to match table
BEGIN
    -- Security Check
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    -- Cast to text for comparison or compare with enum literal if possible
    IF caller_role IS DISTINCT FROM 'admin'::public.user_role THEN
        RAISE EXCEPTION 'Access Denied: Only admins can create users.';
    END IF;

    -- Check overlap
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = new_email) THEN
        RAISE EXCEPTION 'User with this email already exists.';
    END IF;

    -- Insert Auth User
    new_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, recovery_sent_at, last_sign_in_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', 
        new_email, crypt(new_password, gen_salt('bf')), NOW(), NOW(), NOW(), 
        '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()
    );

    -- Insert Identity (Crucial for Login to work properly in newer Supabase versions)
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        new_id, new_id, 
        jsonb_build_object('sub', new_id, 'email', new_email, 'email_verified', true, 'phone_verified', false),
        'email', new_id::text, 
        NOW(), NOW(), NOW()
    );

    -- Insert Profile
    -- Added explicit cast to public.user_role
    BEGIN
        INSERT INTO public.profiles (id, email, role, created_at)
        VALUES (
            new_id, 
            new_email, 
            new_role::public.user_role, -- CAST HERE
            NOW()
        );
    EXCEPTION WHEN duplicate_object OR unique_violation THEN
        UPDATE public.profiles 
        SET role = new_role::public.user_role -- AND HERE
        WHERE id = new_id;
    END;

    RETURN new_id;
END;
$$;
