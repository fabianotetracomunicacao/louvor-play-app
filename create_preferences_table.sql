-- Create user_song_preferences table
CREATE TABLE IF NOT EXISTS public.user_song_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
    transposition INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, song_id)
);

-- RLS Policies
ALTER TABLE public.user_song_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own preferences" 
ON public.user_song_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_song_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own preferences" 
ON public.user_song_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" 
ON public.user_song_preferences FOR DELETE USING (auth.uid() = user_id);
