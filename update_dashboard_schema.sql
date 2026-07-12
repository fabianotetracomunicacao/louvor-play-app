-- 1. ADD VIEWS TO SONGS
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2. CREATE HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.user_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, song_id) -- Ensures 1 entry per song per user, just update viewed_at
);

-- 3. RLS FOR HISTORY
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own history" 
ON public.user_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history" 
ON public.user_history FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own history" 
ON public.user_history FOR SELECT USING (auth.uid() = user_id);

-- 4. FUNCTION TO INCREMENT VIEWS
CREATE OR REPLACE FUNCTION increment_song_view(song_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.songs
  SET views = COALESCE(views, 0) + 1
  WHERE id = song_id;
END;
$$;
