-- Add default_instrument to user_preferences
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'default_instrument') THEN
        ALTER TABLE public.user_preferences ADD COLUMN default_instrument TEXT DEFAULT 'guitar';
    END IF;
END $$;
