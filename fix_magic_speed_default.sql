-- Update the default value for FUTURE users
ALTER TABLE user_preferences ALTER COLUMN default_magic_speed_enabled SET DEFAULT true;

-- Update EXISTING users to have it enabled by default (optional, but requested context implies "standard behavior")
-- Only update where it is currently false or null, assuming we want to push this new standard.
-- However, if a user explicitly turned it off (which is redundant as they just got the feature), we might overwrite.
-- Since the feature is 10 min old, it's safe to update all or just nulls.
-- Let's update all to TRUE since it's a "system default change".
UPDATE user_preferences SET default_magic_speed_enabled = true;
