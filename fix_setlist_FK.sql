/*
  Fix Setlist Scales Foreign Key
  
  Previously setlist_scales referenced auth.users directly.
  To support Supabase joining with 'profiles', we must reference 'profiles(id)'.
*/

-- 1. Drop existing table (safe since no data was successfully added yet)
DROP TABLE IF EXISTS setlist_scales;

-- 2. Re-create 'setlist_scales' table with correct FK
CREATE TABLE setlist_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id UUID NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- CHANGED: Reference profiles(id)
    role TEXT DEFAULT 'Vocal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(setlist_id, user_id)
);

-- 3. Enable RLS
ALTER TABLE setlist_scales ENABLE ROW LEVEL SECURITY;

-- 4. Re-apply Policies

-- View: Authenticated users can view scales
CREATE POLICY "View setlist scales if authenticated" ON setlist_scales
    FOR SELECT
    TO authenticated
    USING (true);

-- Manage: Creator of setlist
CREATE POLICY "Manage scales if setlist creator" ON setlist_scales
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM setlists s
            WHERE s.id = setlist_scales.setlist_id
            AND s.created_by = auth.uid()
        )
    );

-- Manage: Collaborative
CREATE POLICY "Manage scales if collaborative" ON setlist_scales
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM setlists s
            WHERE s.id = setlist_scales.setlist_id
            AND s.is_collaborative = true
        )
    );
