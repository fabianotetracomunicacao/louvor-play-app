-- Add mobile and desktop specific preferences to user_preferences table
-- This allows users to have different player settings for mobile and desktop devices

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS mobile_font_size INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS mobile_line_spacing DECIMAL(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mobile_letter_spacing DECIMAL(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS mobile_scroll_speed INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS desktop_font_size INTEGER DEFAULT 22,
ADD COLUMN IF NOT EXISTS desktop_line_spacing DECIMAL(3,1) DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS desktop_letter_spacing DECIMAL(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS desktop_scroll_speed INTEGER DEFAULT 5;

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.mobile_font_size IS 'Font size in pixels for mobile player (10-30)';
COMMENT ON COLUMN user_preferences.mobile_line_spacing IS 'Line spacing multiplier for mobile player (1.0-3.0)';
COMMENT ON COLUMN user_preferences.mobile_letter_spacing IS 'Letter spacing multiplier for mobile player (0.5-2.0)';
COMMENT ON COLUMN user_preferences.mobile_scroll_speed IS 'Auto-scroll speed for mobile player (1-20)';
COMMENT ON COLUMN user_preferences.desktop_font_size IS 'Font size in pixels for desktop player (10-30)';
COMMENT ON COLUMN user_preferences.desktop_line_spacing IS 'Line spacing multiplier for desktop player (1.0-3.0)';
COMMENT ON COLUMN user_preferences.desktop_letter_spacing IS 'Letter spacing multiplier for desktop player (0.5-2.0)';
COMMENT ON COLUMN user_preferences.desktop_scroll_speed IS 'Auto-scroll speed for desktop player (1-20)';
