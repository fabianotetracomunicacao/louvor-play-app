-- Update Profiles Table
DO $$ 
BEGIN 
    -- Avatar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;

    -- Phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;

    -- Church
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'church_name') THEN
        ALTER TABLE public.profiles ADD COLUMN church_name TEXT;
    END IF;

    -- Favorite Style
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'favorite_style') THEN
        ALTER TABLE public.profiles ADD COLUMN favorite_style TEXT;
    END IF;
END $$;

-- Update User Preferences Table
DO $$ 
BEGIN 
    -- Default Tone Mode
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'default_tone_mode') THEN
        ALTER TABLE public.user_preferences ADD COLUMN default_tone_mode TEXT DEFAULT 'original'; -- 'original' or 'personal'
    END IF;

    -- Allow Collab Invites
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'allow_collab_invites') THEN
        ALTER TABLE public.user_preferences ADD COLUMN allow_collab_invites BOOLEAN DEFAULT true;
    END IF;

    -- Newsletter Opt-in
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'newsletter_opt_in') THEN
        ALTER TABLE public.user_preferences ADD COLUMN newsletter_opt_in BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Ensure RLS allows updates
-- Policy for profiles 'Users can update own profile' likely exists, ensuring it covers new columns (implicitly yes).
-- Policy for user_preferences needs to exist.
-- Let's enable RLS and add policies just in case they are missing or strict.

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view own preferences') THEN
        CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can insert own preferences') THEN
        CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can update own preferences') THEN
        CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

GRANT ALL ON TABLE public.user_preferences TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;
