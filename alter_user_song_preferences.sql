ALTER TABLE user_song_preferences
ADD COLUMN IF NOT EXISTS mobile_font_size INTEGER,
ADD COLUMN IF NOT EXISTS mobile_line_spacing NUMERIC,
ADD COLUMN IF NOT EXISTS mobile_letter_spacing NUMERIC,
ADD COLUMN IF NOT EXISTS mobile_scroll_speed INTEGER,

ADD COLUMN IF NOT EXISTS desktop_font_size INTEGER,
ADD COLUMN IF NOT EXISTS desktop_line_spacing NUMERIC,
ADD COLUMN IF NOT EXISTS desktop_letter_spacing NUMERIC,
ADD COLUMN IF NOT EXISTS desktop_scroll_speed INTEGER;
