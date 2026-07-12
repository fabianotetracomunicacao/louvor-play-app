-- Add default_magic_speed_enabled to user_preferences
DO $$ 
BEGIN
    ALTER TABLE user_preferences ADD COLUMN default_magic_speed_enabled BOOLEAN DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Ensure default_scroll_speed is FLOAT
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE user_preferences ALTER COLUMN default_scroll_speed TYPE FLOAT;
    EXCEPTION WHEN undefined_column THEN NULL; END;
END $$;
