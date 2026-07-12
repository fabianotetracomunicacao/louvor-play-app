/*
    Add Setlist Scheduling Features
    
    1. Add `scheduled_date` to `playlists`
    2. Create `playlist_scales` table for assigning users to a setlist
*/

-- 1. Add scheduled_date to playlists
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;

-- 2. Create playlist_scales table
CREATE TABLE IF NOT EXISTS playlist_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT, -- e.g. 'Vocals', 'Guitar', 'Drums'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(playlist_id, user_id)
);

-- Enable RLS
ALTER TABLE playlist_scales ENABLE ROW LEVEL SECURITY;

-- Policies for playlist_scales
-- View: Members of the playlist (or public if public) can view scales?
-- Actually, let's keep it simple: Access depends on playlist access.
-- If you can view the playlist, you can view the scale.

CREATE POLICY "View scales if can view playlist" ON playlist_scales
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            LEFT JOIN playlist_members pm ON p.id = pm.playlist_id
            WHERE p.id = playlist_scales.playlist_id
            AND (
                p.owner_id = auth.uid() OR
                p.is_public = true OR
                pm.user_id = auth.uid()
            )
        )
    );

-- Edit: Only Owner or Editors can manage scales
CREATE POLICY "Manage scales if owner or editor" ON playlist_scales
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            LEFT JOIN playlist_members pm ON p.id = pm.playlist_id
            WHERE p.id = playlist_scales.playlist_id
            AND (
                p.owner_id = auth.uid() OR
                (pm.user_id = auth.uid() AND pm.role = 'editor') OR
                (p.is_collaborative = true AND pm.user_id = auth.uid()) -- If collaborative, any member can edit?
            )
        )
    );
