-- FIX: Infinite Recursion in Profiles RLS
-- This migration fixes the 500 Internal Server Errors caused by recursive role checks in policies.

-- 1. Create a Security Definer function to bypass RLS
-- This function runs as the DB owner (ignoring RLS) and safely checks user roles.
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND (role = 'super_admin' OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policies we added
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can delete songs" ON public.songs;
DROP POLICY IF EXISTS "SuperAdmins can view all playlists" ON public.playlists;
DROP POLICY IF EXISTS "SuperAdmins can manage all playlists" ON public.playlists;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "SuperAdmins can manage all playlist items" ON public.playlist_items;

-- 3. Re-create policies using the new function (No Subqueries on Table in Policy)

-- SONGS
CREATE POLICY "admin_manage_songs" ON public.songs
FOR ALL USING ( public.is_admin(auth.uid()) );

-- PROFILES
-- We keep "Public profiles are viewable" as it is (using true).
-- We add management policy for admins only for ALL (Update/Delete/Insert others).
CREATE POLICY "admin_manage_profiles" ON public.profiles
FOR ALL USING ( public.is_admin(auth.uid()) );

-- PLAYLISTS
CREATE POLICY "admin_manage_playlists" ON public.playlists
FOR ALL USING ( public.is_admin(auth.uid()) );

-- PLAYLIST ITEMS
CREATE POLICY "admin_manage_items" ON public.playlist_items
FOR ALL USING ( public.is_admin(auth.uid()) );

-- 4. Audit: If "Public profiles are viewable by everyone" exists, no need for SELECT recursion fix on it.
-- But if we want to be safe, we make sure it's at the top.
-- (The existing policies from supabase_schema.sql are fine for SELECT as they are USING(true)).
