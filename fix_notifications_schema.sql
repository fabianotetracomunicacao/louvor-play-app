/*
  Fix Notifications Table Schema
  
  The 'notifications' table seems missing the 'read' column (PGRST204).
  This ensures the column exists and reloads the schema cache.
*/

-- 1. Ensure columns exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "read" BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- 2. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
