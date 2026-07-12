/*
  Add Description Column to Playlists
  
  The application expects a 'description' column on the 'playlists' table.
*/

ALTER TABLE playlists ADD COLUMN IF NOT EXISTS description TEXT;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
