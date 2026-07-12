-- Add Tablet preferences to global user_preferences
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS tablet_font_size INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS tablet_line_spacing NUMERIC DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS tablet_letter_spacing NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS tablet_scroll_speed INTEGER DEFAULT 5;

-- Add Tablet preferences to song-specific overrides (user_song_preferences)
ALTER TABLE user_song_preferences
ADD COLUMN IF NOT EXISTS tablet_font_size INTEGER,
ADD COLUMN IF NOT EXISTS tablet_line_spacing NUMERIC,
ADD COLUMN IF NOT EXISTS tablet_letter_spacing NUMERIC,
ADD COLUMN IF NOT EXISTS tablet_scroll_speed INTEGER;
