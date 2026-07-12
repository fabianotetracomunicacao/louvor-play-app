select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from
  pg_policies
where
  tablename = 'playlist_items';
