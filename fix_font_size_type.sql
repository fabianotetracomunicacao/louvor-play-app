
DO $$
BEGIN
    ALTER TABLE user_song_preferences ALTER COLUMN font_size TYPE FLOAT;
END $$;
