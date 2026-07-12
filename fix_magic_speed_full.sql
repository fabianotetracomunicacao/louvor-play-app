-- 1. Add is_auto_speed column for Magic Speed persistence
DO $$ 
BEGIN
    ALTER TABLE user_song_preferences ADD COLUMN is_auto_speed BOOLEAN DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- 2. Change scroll_speed columns to FLOAT to support decimal speeds (e.g. 7.42)
DO $$ 
BEGIN
    -- Generic
    BEGIN
        ALTER TABLE user_song_preferences ALTER COLUMN scroll_speed TYPE FLOAT;
    EXCEPTION WHEN undefined_column THEN NULL; END;

    -- Mobile
    BEGIN
        ALTER TABLE user_song_preferences ALTER COLUMN mobile_scroll_speed TYPE FLOAT;
    EXCEPTION WHEN undefined_column THEN NULL; END;

    -- Tablet
    BEGIN
        ALTER TABLE user_song_preferences ALTER COLUMN tablet_scroll_speed TYPE FLOAT;
    EXCEPTION WHEN undefined_column THEN NULL; END;

    -- Desktop
    BEGIN
        ALTER TABLE user_song_preferences ALTER COLUMN desktop_scroll_speed TYPE FLOAT;
    EXCEPTION WHEN undefined_column THEN NULL; END;
END $$;
