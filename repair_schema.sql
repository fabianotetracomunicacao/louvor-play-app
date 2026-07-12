-- Repair Schema Script
-- Run this in Supabase SQL Editor to fix missing columns and permissions

-- 1. Ensure 'transposition' column exists in 'songs' table
DO $$ 
BEGIN
    ALTER TABLE public.songs ADD COLUMN transposition integer DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 2. Ensure 'original_key' column exists (it should, but just in case)
DO $$ 
BEGIN
    ALTER TABLE public.songs ADD COLUMN original_key text DEFAULT 'C';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 3. Verify 'created_by' for RLS
DO $$ 
BEGIN
    ALTER TABLE public.songs ADD COLUMN created_by uuid REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 4. Force Policy Refresh (Re-apply Update Policy)
DROP POLICY IF EXISTS "Editors can update own songs" ON public.songs;
CREATE POLICY "Editors can update own songs" ON public.songs FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.songs;
-- Or simpler policy for debugging:
-- CREATE POLICY "Enable all access for authenticated users" ON public.songs FOR ALL USING (auth.role() = 'authenticated');
