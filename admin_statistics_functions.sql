-- Get total songs count
CREATE OR REPLACE FUNCTION get_total_songs()
RETURNS bigint AS $$
  SELECT COUNT(*) FROM songs WHERE deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get total plays (sum of all song views)
CREATE OR REPLACE FUNCTION get_total_plays()
RETURNS bigint AS $$
  SELECT COALESCE(SUM(views), 0) FROM songs WHERE deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get top 100 most played songs
CREATE OR REPLACE FUNCTION get_top_songs(limit_count int DEFAULT 100)
RETURNS TABLE(id uuid, title text, artist text, views int) AS $$
  SELECT id, title, artist, views 
  FROM songs 
  WHERE deleted_at IS NULL 
  ORDER BY views DESC 
  LIMIT limit_count;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get user counts by role
CREATE OR REPLACE FUNCTION get_user_counts_by_role()
RETURNS TABLE(role text, count bigint) AS $$
  SELECT role, COUNT(*) 
  FROM profiles 
  GROUP BY role;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get playlist counts by type
CREATE OR REPLACE FUNCTION get_playlist_counts()
RETURNS TABLE(type text, count bigint) AS $$
  SELECT 
    CASE 
      WHEN is_public THEN 'public'
      WHEN is_collaborative THEN 'collaborative'
      ELSE 'private'
    END as type,
    COUNT(*)
  FROM playlists
  GROUP BY type;
$$ LANGUAGE sql SECURITY DEFINER;
