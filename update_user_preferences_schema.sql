
DO $$
BEGIN
    -- Add default_display_mode
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'default_display_mode') THEN
        ALTER TABLE user_preferences ADD COLUMN default_display_mode TEXT DEFAULT 'full';
    END IF;

    -- Add default_font_size (FLOAT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'default_font_size') THEN
        ALTER TABLE user_preferences ADD COLUMN default_font_size FLOAT DEFAULT 12;
    END IF;

    -- Add default_line_spacing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'default_line_spacing') THEN
        ALTER TABLE user_preferences ADD COLUMN default_line_spacing FLOAT DEFAULT 0.8;
    END IF;

    -- Add default_letter_spacing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'default_letter_spacing') THEN
        ALTER TABLE user_preferences ADD COLUMN default_letter_spacing FLOAT DEFAULT 0;
    END IF;

    -- Add default_scroll_speed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'default_scroll_speed') THEN
        ALTER TABLE user_preferences ADD COLUMN default_scroll_speed INTEGER DEFAULT 5;
    END IF;

END $$;
