/*
  Add Foreign Key for Setlist Creator
  
  Allows fetching the creator's profile directly when querying setlists.
*/

-- 1. Add FK to profiles
ALTER TABLE setlists 
DROP CONSTRAINT IF EXISTS setlists_created_by_profile_fkey;

ALTER TABLE setlists 
ADD CONSTRAINT setlists_created_by_profile_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id);
