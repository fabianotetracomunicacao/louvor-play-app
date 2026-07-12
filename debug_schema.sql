-- DEBUG SCRIPT: CHECK DATA INGRETY
-- Run this in Supabase SQL Editor

-- 1. Check if the Foreign Key exists
SELECT 
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='playlist_items';

-- 2. Try a manual join to see if IDs match
SELECT 
    pi.id as item_id, 
    pi.song_id, 
    s.title as song_title 
FROM public.playlist_items pi
LEFT JOIN public.songs s ON pi.song_id = s.id;

-- 3. Check RLS policies on Songs
select * from pg_policies where tablename = 'songs';
