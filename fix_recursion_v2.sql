-- FIX INFINITE RECURSION V2 (Reverse Logic) - CORRIGIDO
-- Run this in Supabase SQL Editor

-- 0. Clean up previous attempts (Use CASCADE to remove dependent policies automatically)
DROP FUNCTION IF EXISTS public.is_playlist_owner CASCADE;
DROP FUNCTION IF EXISTS public.is_playlist_public CASCADE;
DROP FUNCTION IF EXISTS public.check_user_membership CASCADE;
DROP FUNCTION IF EXISTS public.check_playlist_ownership CASCADE;

-- Also explicitly drop policies just in case they were not linked to the functions
DROP POLICY IF EXISTS "Users can view playlists" ON playlists;
DROP POLICY IF EXISTS "Members can view private playlists" ON playlists;
DROP POLICY IF EXISTS "Users can create playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can view playlist memberships" ON playlist_members;
DROP POLICY IF EXISTS "Users can join/invite to playlists" ON playlist_members;
DROP POLICY IF EXISTS "Users can accept invites" ON playlist_members;
DROP POLICY IF EXISTS "Users can leave or remove members" ON playlist_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON playlist_members;

-- 1. Create Helper Function: Check Membership (SECURITY DEFINER)
-- This allows checking membership WITHOUT triggering 'playlist_members' RLS.
CREATE OR REPLACE FUNCTION public.check_user_membership(_playlist_id UUID, _user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM playlist_members 
    WHERE playlist_id = _playlist_id 
    AND user_id = _user_id
  );
END;
$$;

-- 2. Create Helper Function: Check Playlist Ownership (SECURITY DEFINER)
-- Bypasses 'playlists' RLS
CREATE OR REPLACE FUNCTION public.check_playlist_ownership(_playlist_id UUID, _user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM playlists 
    WHERE id = _playlist_id 
    AND owner_id = _user_id
  );
END;
$$;


-- 3. PLAYLISTS POLICIES

-- SELECT Policy using the New Function
CREATE POLICY "Users can view playlists" 
ON playlists FOR SELECT 
TO authenticated 
USING (
    owner_id = auth.uid()
    OR
    is_public = true
    OR
    -- Use Function to check membership (Bypasses playlist_members RLS)
    public.check_user_membership(id, auth.uid())
);

-- WRITE Policies (Standard)
CREATE POLICY "Users can create playlists" ON playlists FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own playlists" ON playlists FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Users can delete own playlists" ON playlists FOR DELETE TO authenticated USING (owner_id = auth.uid());


-- 4. PLAYLIST MEMBERS POLICIES

-- SELECT: Can see if it's MY row OR if I own the playlist (via function)
CREATE POLICY "Users can view playlist memberships" 
ON playlist_members FOR SELECT 
TO authenticated 
USING (
    user_id = auth.uid() 
    OR 
    public.check_playlist_ownership(playlist_id, auth.uid()) -- Bypasses playlists RLS
);

-- INSERT: Join Public (Function check) OR Owner Invite (Function check)
CREATE POLICY "Users can join/invite to playlists" 
ON playlist_members FOR INSERT 
TO authenticated 
WITH CHECK (
  (user_id = auth.uid() AND EXISTS(SELECT 1 FROM playlists WHERE id=playlist_id AND is_public=true))
  OR
  (public.check_playlist_ownership(playlist_id, auth.uid()) AND status = 'pending')
);

-- UPDATE: Accept Invite
CREATE POLICY "Users can accept invites" 
ON playlist_members FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- DELETE: Leave or Remove
CREATE POLICY "Users can leave or remove members" 
ON playlist_members FOR DELETE 
TO authenticated 
USING (
    user_id = auth.uid() 
    OR 
    public.check_playlist_ownership(playlist_id, auth.uid())
);
