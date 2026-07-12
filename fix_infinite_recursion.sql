-- FIX INFINITE RECURSION IN RLS (Database Error on Login) -- REVISED

-- 1. Create a helper function to get role WITHOUT triggering RLS
-- SECURITY DEFINER means it runs with the permissions of the creator (postgres/admin), bypassing Row Level Security checks.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, extensions
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Clean up ALL potential old policies on profiles to be safe
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Visibility" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Delete" ON public.profiles;

-- 3. Re-create Optimized Policies

-- READ: Own profile OR Admin/Editor
CREATE POLICY "Profiles Visibility" ON public.profiles
FOR SELECT
USING (
  auth.uid() = id -- I can see myself
  OR 
  get_my_role() IN ('admin', 'editor') -- Admin/Editor can see everyone (via helper)
);

-- UPDATE: Own profile (limited fields usually, but here allowing) OR Admin
CREATE POLICY "Profiles Update" ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id
  OR 
  get_my_role() = 'admin'
);

-- INSERT: Usually handled by triggers or admins, but allowing calling by authenticated
CREATE POLICY "Profiles Insert" ON public.profiles
FOR INSERT
WITH CHECK (
  true
);

-- DELETE: Only Admins
CREATE POLICY "Profiles Delete" ON public.profiles
FOR DELETE
USING (
  get_my_role() = 'admin'
);

-- Grant execute on the helper (Essential)
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role TO anon;
