-- Set default values for new user registrations
-- This ensures all new users start with optimized player settings

-- Update default values for user_preferences table
ALTER TABLE user_preferences 
ALTER COLUMN mobile_font_size SET DEFAULT 12,
ALTER COLUMN mobile_line_spacing SET DEFAULT 1.0,
ALTER COLUMN mobile_letter_spacing SET DEFAULT 1.0,
ALTER COLUMN mobile_scroll_speed SET DEFAULT 5,
ALTER COLUMN desktop_font_size SET DEFAULT 22,
ALTER COLUMN desktop_line_spacing SET DEFAULT 0.8,
ALTER COLUMN desktop_letter_spacing SET DEFAULT 1.0,
ALTER COLUMN desktop_scroll_speed SET DEFAULT 5,
ALTER COLUMN default_display_mode SET DEFAULT 'full',
ALTER COLUMN default_tone_mode SET DEFAULT 'original';

-- For existing users without preferences, update them with defaults
UPDATE user_preferences 
SET 
    mobile_font_size = COALESCE(mobile_font_size, 12),
    mobile_line_spacing = COALESCE(mobile_line_spacing, 1.0),
    mobile_letter_spacing = COALESCE(mobile_letter_spacing, 1.0),
    mobile_scroll_speed = COALESCE(mobile_scroll_speed, 5),
    desktop_font_size = COALESCE(desktop_font_size, 22),
    desktop_line_spacing = COALESCE(desktop_line_spacing, 0.8),
    desktop_letter_spacing = COALESCE(desktop_letter_spacing, 1.0),
    desktop_scroll_speed = COALESCE(desktop_scroll_speed, 5),
    default_display_mode = COALESCE(default_display_mode, 'full'),
    default_tone_mode = COALESCE(default_tone_mode, 'original')
WHERE mobile_font_size IS NULL 
   OR mobile_line_spacing IS NULL 
   OR mobile_letter_spacing IS NULL
   OR desktop_font_size IS NULL
   OR desktop_line_spacing IS NULL
   OR desktop_letter_spacing IS NULL;
