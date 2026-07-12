-- Script to transfer songs from fabiano_fischer@hotmail.com to oficial@louvorplay.com.br
-- This will update the 'created_by' field of the songs.
-- It will NOT break playlists because playlists reference songs by song_id, which does not change.

DO $$
DECLARE
    source_email text := 'fabiano_fischer@hotmail.com';
    target_email text := 'oficial@louvorplay.com.br';
    source_user_id uuid;
    target_user_id uuid;
    rows_updated int;
BEGIN
    -- 1. Get Source User ID
    SELECT id INTO source_user_id FROM auth.users WHERE email = source_email;
    
    -- 2. Get Target User ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    -- 3. Verification
    IF source_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found', source_email;
    END IF;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found. Does the Official account exist?', target_email;
    END IF;

    RAISE NOTICE 'Transferring songs from % (%) to % (%)', source_email, source_user_id, target_email, target_user_id;

    -- 4. Perform Update
    -- Only transfer songs that are owned by the source user
    UPDATE songs
    SET 
        created_by = target_user_id,
        is_official = true -- OPTIONAL: Automatically mark them as official since they are moving to the Official account
    WHERE created_by = source_user_id;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    RAISE NOTICE 'Successfully transferred % songs.', rows_updated;

END $$;
