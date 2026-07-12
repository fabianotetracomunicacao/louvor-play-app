-- Unlock Legacy Songs Script
-- Run this if you have songs that weren't created with a user owner (created_by is NULL).

-- Option 1: Adopt all orphan songs to your current user (Recommended)
-- Replace 'YOUR_USER_ID_HERE' with your actual UUID from the auth.users table.
-- You can find your ID in the browser URL or user profile if implemented.
-- UPDATE public.songs SET created_by = 'YOUR_USER_ID_HERE' WHERE created_by IS NULL;

-- Option 2: Allow editing of legacy songs via Policy (Use this if you don't know your ID)
-- This policy allows ANY authenticated user to update songs that have no owner.

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow update legacy songs" ON public.songs;
    CREATE POLICY "Allow update legacy songs" ON public.songs
        FOR UPDATE
        USING (created_by IS NULL);
        
    -- Also allow Insert/Select as usual
    -- Ensure "Enable all access for authenticated users" covers SELECT, but usually UPDATE needs specific policy if RLS is on.
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verify
-- SELECT id, title, created_by FROM public.songs WHERE created_by IS NULL;
