-- Add chord color preferences to user_preferences table

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS chord_color_light VARCHAR(20) DEFAULT '#d97706', -- amber-600
ADD COLUMN IF NOT EXISTS chord_color_dark VARCHAR(20) DEFAULT '#d97706'; -- amber-600

-- Comment on columns
COMMENT ON COLUMN user_preferences.chord_color_light IS 'Custom chord color for light mode';
COMMENT ON COLUMN user_preferences.chord_color_dark IS 'Custom chord color for dark mode';
