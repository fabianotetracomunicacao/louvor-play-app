-- Check for duplicates
SELECT user_id, song_id, COUNT(*) 
FROM user_song_preferences 
GROUP BY user_id, song_id 
HAVING COUNT(*) > 1;

-- Check constraints
SELECT *
FROM information_schema.table_constraints
WHERE table_name = 'user_song_preferences';
