-- Add new preference columns to user_song_preferences table
DO $$
BEGIN
    -- Add church_transposition if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_song_preferences' AND column_name = 'church_transposition') THEN
        ALTER TABLE user_song_preferences ADD COLUMN church_transposition INTEGER DEFAULT 0;
    END IF;

    -- Add visual preference columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_song_preferences' AND column_name = 'font_size') THEN
        ALTER TABLE user_song_preferences ADD COLUMN font_size INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_song_preferences' AND column_name = 'line_spacing') THEN
        ALTER TABLE user_song_preferences ADD COLUMN line_spacing FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_song_preferences' AND column_name = 'scroll_speed') THEN
        ALTER TABLE user_song_preferences ADD COLUMN scroll_speed INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_song_preferences' AND column_name = 'letter_spacing') THEN
        ALTER TABLE user_song_preferences ADD COLUMN letter_spacing FLOAT;
    END IF;
    
    -- Add display_mode preference (full, no_tabs, only_tabs)
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_song_preferences' AND column_name = 'display_mode') THEN
        ALTER TABLE user_song_preferences ADD COLUMN display_mode TEXT;
    END IF;

END $$;
