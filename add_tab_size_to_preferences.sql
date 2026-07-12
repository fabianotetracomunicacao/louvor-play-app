-- Migration: Add tab_font_size preferences to user_song_preferences
-- Description: Allows users to save specific tab font sizes per song and device, independent of the main font size.

ALTER TABLE public.user_song_preferences 
ADD COLUMN IF NOT EXISTS mobile_tab_font_size numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tablet_tab_font_size numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS desktop_tab_font_size numeric DEFAULT 0;

-- Note: 0 implies "Auto" (uses main font size * 0.7)
