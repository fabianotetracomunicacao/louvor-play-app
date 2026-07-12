-- FIX PROFILES RLS
-- Allows admins to update any profile (e.g. to change roles)

-- 1. Drop existing policies if they conflict (optional, but safer to just add new one)
-- Ideally we just add the admin policy.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles'
    ) THEN
        CREATE POLICY "Admins can update all profiles" 
        ON public.profiles 
        FOR UPDATE 
        USING (
            exists (
                select 1 from public.profiles 
                where id = auth.uid() 
                and role = 'admin'
            )
        );
    END IF;
END $$;

-- Also verify if we need DELETE policy for profiles?
-- "Admins can delete any profile" is usually handled by deleting auth.users, which cascades.
-- But if we want to update (role), we need UPDATE.

-- Verify:
SELECT * FROM pg_policies WHERE tablename = 'profiles';
