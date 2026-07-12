-- Create user_likes table if not exists
CREATE TABLE IF NOT EXISTS public.user_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, song_id)
);

-- RLS Policies
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow re-running script without errors
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.user_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.user_likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON public.user_likes;

-- Create Policies
CREATE POLICY "Users can insert their own likes" 
ON public.user_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.user_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own likes" 
ON public.user_likes FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON TABLE public.user_likes TO authenticated;
GRANT ALL ON TABLE public.user_likes TO service_role;
