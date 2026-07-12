/*
  Force Reset Setlist Permissions
  
  This script dynamically drops ALL existing policies on 'setlists' and 'setlist_items' 
  to ensure no rogue policies remain. Then it re-applies strict permissions.
*/

-- 1. Ensure RLS is enabled
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_items ENABLE ROW LEVEL SECURITY;

-- 2. Dynamically Drop ALL Policies on 'setlists'
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'setlists' 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON setlists'; 
    END LOOP; 
END $$;

-- 3. Dynamically Drop ALL Policies on 'setlist_items'
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'setlist_items' 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON setlist_items'; 
    END LOOP; 
END $$;


-- 4. Re-create Strict Policies for SETLISTS

-- VIEW: Everyone who has access to the parent playlist
CREATE POLICY "View setlists" ON setlists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists p
      LEFT JOIN playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = setlists.playlist_id
      AND (
        p.owner_id = auth.uid() OR
        p.is_public = true OR
        (pm.user_id = auth.uid() AND pm.status = 'active')
      )
    )
  );

-- INSERT: Playlist Members (Active) OR Playlist Owner
CREATE POLICY "Create setlists" ON setlists
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists p
      LEFT JOIN playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = playlist_id -- playlist_id from new row
      AND (
        p.owner_id = auth.uid() OR
        (pm.user_id = auth.uid() AND pm.status = 'active')
      )
    )
  );

-- UPDATE: STRICTLY Restricted
-- Only Creator OR Playlist Owner can update, UNLESS is_collaborative is explicitly TRUE.
CREATE POLICY "Update setlists" ON setlists
  FOR UPDATE
  USING (
    -- 1. Creator (You created this setlist)
    (created_by = auth.uid()) OR 
    
    -- 2. Playlist Owner
    (EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = setlists.playlist_id
      AND p.owner_id = auth.uid()
    )) OR
    
    -- 3. Collaborative Mode (Setlist MUST have is_collaborative = TRUE)
    (setlists.is_collaborative = true AND EXISTS (
      SELECT 1 FROM playlist_members pm
      WHERE pm.playlist_id = setlists.playlist_id
      AND pm.user_id = auth.uid()
      AND pm.status = 'active'
    ))
  );

-- DELETE: Only Creator OR Playlist Owner
CREATE POLICY "Delete setlists" ON setlists
  FOR DELETE
  USING (
    (created_by = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = setlists.playlist_id
      AND p.owner_id = auth.uid()
    ))
  );


-- 5. Re-create Strict Policies for SETLIST_ITEMS

-- VIEW
CREATE POLICY "View setlist items" ON setlist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM setlists s
      WHERE s.id = setlist_items.setlist_id
      -- Check access to setlist logic
      AND EXISTS (
          SELECT 1 FROM playlists p
          LEFT JOIN playlist_members pm ON p.id = s.playlist_id
          WHERE (
            p.owner_id = auth.uid() OR
            p.is_public = true OR
            (pm.user_id = auth.uid() AND pm.status = 'active')
          )
      )
    )
  );

-- MANAGE (Same restriction as Update Setlist)
CREATE POLICY "Manage setlist items" ON setlist_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM setlists s
      WHERE s.id = setlist_items.setlist_id
      AND (
        (s.created_by = auth.uid()) OR -- Setlist Creator
        
        (EXISTS ( -- Playlist Owner
          SELECT 1 FROM playlists p
          WHERE p.id = s.playlist_id
          AND p.owner_id = auth.uid()
        )) OR
        
        (s.is_collaborative = true AND EXISTS ( -- Collaborative & Member
          SELECT 1 FROM playlist_members pm
          WHERE pm.playlist_id = s.playlist_id
          AND pm.user_id = auth.uid()
          AND pm.status = 'active'
        ))
      )
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
