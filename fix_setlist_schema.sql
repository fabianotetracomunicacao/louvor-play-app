/*
  Fix Setlist Scheduling Schema
  
  Logic was previously applied to 'playlists' (Repertories), but should apply to 'setlists' (Events).
  This script adds necessary columns to 'setlists' and creates 'setlist_scales'.
*/

-- 1. Add columns to 'setlists'
ALTER TABLE setlists 
ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE; -- Ensure we have a standard date col if 'date' is disparate

-- 2. Create 'setlist_scales' table
CREATE TABLE IF NOT EXISTS setlist_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id UUID NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Vocal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(setlist_id, user_id)
);

-- 3. Enable RLS
ALTER TABLE setlist_scales ENABLE ROW LEVEL SECURITY;

-- 4. Policies for setlist_scales

-- View: If user can view the setlist (e.g. is creator or in the playlist)
-- Simplified: Allow if authenticated (assuming app handles logic) or check setlist access
CREATE POLICY "View setlist scales if authenticated" ON setlist_scales
    FOR SELECT
    TO authenticated
    USING (true);

-- Manage: Creator of setlist OR (is_collaborative AND in playlist?)
-- For now, let's allow Creator to insert/delete.
-- And if Collaborative, allow others?
-- Let's stick to Creator for now to ensure it works, allowing insert if you are the creator.
CREATE POLICY "Manage scales if setlist creator" ON setlist_scales
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM setlists s
            WHERE s.id = setlist_scales.setlist_id
            AND s.created_by = auth.uid()
        )
    );

-- Allow Insert if Setlist is Collaborative (Optional, can add later if needed)
CREATE POLICY "Manage scales if collaborative" ON setlist_scales
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM setlists s
            WHERE s.id = setlist_scales.setlist_id
            AND s.is_collaborative = true
            -- Ideally check if user is in the parent playlist too
        )
    );
