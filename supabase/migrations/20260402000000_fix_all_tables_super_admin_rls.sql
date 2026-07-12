-- Fix RLS policies to include 'super_admin' role
-- Generated on 2026-04-02

-- 1. Fix SONGS Table Policies
-- We drop and recreate to ensure 'super_admin' is included in administrative checks.

DROP POLICY IF EXISTS "Admins can update all songs" ON public.songs;
CREATE POLICY "Admins can update all songs" 
ON public.songs 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
    )
);

DROP POLICY IF EXISTS "Admins can delete songs" ON public.songs;
CREATE POLICY "Admins can delete songs" 
ON public.songs 
FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
    )
);

-- 2. Fix PLAYLISTS Table Policies
-- Allow super_admins to view and manage any playlist for administrative oversight.

DROP POLICY IF EXISTS "SuperAdmins can view all playlists" ON public.playlists;
CREATE POLICY "SuperAdmins can view all playlists" 
ON public.playlists 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin')
    )
);

DROP POLICY IF EXISTS "SuperAdmins can manage all playlists" ON public.playlists;
CREATE POLICY "SuperAdmins can manage all playlists" 
ON public.playlists 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin')
    )
);

-- 3. Fix PROFILES Table Policies
-- Allow super_admins to manage user roles and profiles.

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
    )
);

-- 4. Fix PLAYLIST_ITEMS Table Policies (Consistency)
DROP POLICY IF EXISTS "SuperAdmins can manage all playlist items" ON public.playlist_items;
CREATE POLICY "SuperAdmins can manage all playlist items" 
ON public.playlist_items 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin')
    )
);

-- Final Check: Ensure everyone can still see public data
-- (These already exist but repeating for clarity if they were dropped)
-- create policy "Songs are viewable by everyone" on songs for select using (true);
