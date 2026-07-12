-- ENABLE REALTIME FOR NOTIFICATIONS
-- Run this in Supabase SQL Editor

-- 1. Add table to publication (This matches the UI toggle)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end;
$$;

-- 2. Verify Replica Identity (Required for UPDATE/DELETE, default is usually fine for INSERT)
ALTER TABLE notifications REPLICA IDENTITY FULL;
