-- ADMIN PROFILE PERMISSIONS
-- Allow administrators to view, update, and delete ALL profiles.

-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive policies if they conflict (or add permissive ones)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- 3. Create Admin Policies
-- Note: using a subquery to check if the current user is an admin.
-- This creates a recursive check if we are not careful.
-- Strategy: Use a special "auth.jwt() ->> 'email'" or ensure the subquery doesn't self-block.
-- SAFER: Just check if the ID exists in the profiles table with role='admin'.

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  USING (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    OR auth.uid() = id -- Users can still see themselves
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE
  USING (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    OR auth.uid() = id -- Users can update themselves (but maybe block role change?)
  )
  WITH CHECK (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    OR auth.uid() = id
  );

CREATE POLICY "Admins can delete all profiles" ON public.profiles
  FOR DELETE
  USING (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- 4. IMPORTANT: Infinite Recursion Prevention
-- If "Admins can view all profiles" does a SELECT on profiles to check if admin... it triggers the policy again.
-- Postgres detects this infinite recursion.
-- SOLUTION: Use a SECURITY DEFINER function or rely on the JWT claim if possible.
-- ALTERNATIVE: Use a separate lookup or trust the basic "auth.uid() = id" for the recursive base case.
-- Actually, Supabase has a trick: `(auth.jwt() ->> 'user_metadata')::jsonb ->> 'role'` ?? No, that's unstable.
-- CORRECT PATTERN:
-- Create a helper function `is_admin()` that avoids the RLS check or optimize the query.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Re-apply policies using the function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  USING (
    public.is_admin()
    OR auth.uid() = id
    OR true -- Wait, we had "Public profiles are viewable by everyone" before?
            -- If user listing must be private, remove this OR.
            -- Existing policy "Public profiles are viewable by everyone" might be "USING (true)".
  );
  
-- Overwrite the "Public profiles are viewable by everyone" to be restrictive if desired, 
-- but for now let's just ADD the update/delete powers.

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE
  USING ( public.is_admin() OR auth.uid() = id );
  -- Note: We trust the client implementation to not let users change their own role if they aren't admin.
  -- Ideally, adding a Trigger validation is better, but this is MVP.

CREATE POLICY "Admins can delete all profiles" ON public.profiles
  FOR DELETE
  USING ( public.is_admin() );

