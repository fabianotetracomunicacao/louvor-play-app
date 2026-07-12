/*
  Fix Notifications Table Constraints (with Data Cleanup)

  The existing rows might have invalid types that prevent applying the new constraint.
  This script first normalizes bad data to 'info' and then applies the constraint.
*/

-- 1. Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Clean up invalid data (set them to 'info')
UPDATE notifications 
SET type = 'info' 
WHERE type NOT IN ('info', 'alert', 'warning', 'success', 'error', 'invite', 'song_added', 'system');

-- 3. Add the new constraint
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('info', 'alert', 'warning', 'success', 'error', 'invite', 'song_added', 'system'));
