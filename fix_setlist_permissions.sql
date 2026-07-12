/*
  Fix Setlist Permissions (RLS)
  
  Addresses the issue where non-collaborative setlists are editable by anyone.
  Enforces stricter rules based on 'is_collaborative', creator ownership, and playlist roles.
*/

-- 1. Enable RLS (Ensure it is on)
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Enable read access for all users" ON setlists;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON setlists;
DROP POLICY IF EXISTS "Enable update for users based on email" ON setlists;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON setlists;
DROP POLICY IF EXISTS "View setlists if playlist member" ON setlists;
DROP POLICY IF EXISTS "Create setlists if playlist member" ON setlists;
DROP POLICY IF EXISTS "Update setlists if creator or colab" ON setlists;
DROP POLICY IF EXISTS "Delete setlists if creator" ON setlists;
-- (Drop generic ones too just in case)
DROP POLICY IF EXISTS "Public view" ON setlists;
DROP POLICY IF EXISTS "Authenticated insert" ON setlists;
DROP POLICY IF EXISTS "Owner update" ON setlists;

DROP POLICY IF EXISTS "Enable read access for all users" ON setlist_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON setlist_items;
DROP POLICY IF EXISTS "Enable update for users based on email" ON setlist_items;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON setlist_items;
DROP POLICY IF EXISTS "View items if can view setlist" ON setlist_items;
DROP POLICY IF EXISTS "Manage items if can manage setlist" ON setlist_items;


-- 3. Define Policies for SETLISTS

-- VIEW: Visible to Playlist Members (Active) OR Playlist Owner OR Public Playlists
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

-- INSERT: Allowed for Playlist Members (Active) OR Playlist Owner
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

-- UPDATE: Allowed if:
-- 1. User is the Creator of the setlist
-- 2. OR User is the Owner of the parent playlist
-- 3. OR Setlist is Collaborative AND User is a Playlist Member
CREATE POLICY "Update setlists" ON setlists
  FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM playlists p
      LEFT JOIN playlist_members pm ON p.id = pm.playlist_id
      WHERE p.id = setlists.playlist_id
      AND (
        p.owner_id = auth.uid() OR -- Playlist Owner
        (setlists.is_collaborative = true AND pm.user_id = auth.uid() AND pm.status = 'active') -- Collaborative & Member
      )
    )
  );

-- DELETE: Allowed if Creator OR Playlist Owner
CREATE POLICY "Delete setlists" ON setlists
  FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = setlists.playlist_id
      AND p.owner_id = auth.uid()
    )
  );


-- 4. Define Policies for SETLIST_ITEMS
-- (Inherit access from the parent setlist)

-- VIEW: If can view setlist
CREATE POLICY "View setlist items" ON setlist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM setlists s
      WHERE s.id = setlist_items.setlist_id
      -- Re-use setlist view logic (simplified: check if setlist is visible)
      -- But recursive policies are tricky. Better to duplicate logic or rely on join.
      -- Let's duplicate the playlist-level check for performance/safety.
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

-- MANAGE (Insert/Update/Delete): If can UPDATE the setlist
-- (Meaning: Creator, Owner, or Member IF Collaborative)
CREATE POLICY "Manage setlist items" ON setlist_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM setlists s
      WHERE s.id = setlist_items.setlist_id
      AND (
        s.created_by = auth.uid() OR -- Setlist Creator
        EXISTS (
          SELECT 1 FROM playlists p
          LEFT JOIN playlist_members pm ON p.id = s.playlist_id
          WHERE (
            p.owner_id = auth.uid() OR -- Playlist Owner
            (s.is_collaborative = true AND pm.user_id = auth.uid() AND pm.status = 'active') -- Collaborative & Member
          )
        )
      )
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
