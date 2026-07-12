-- ==============================================================================
-- SETUP CLEAN PROJECT (Consolidated Script)
-- ==============================================================================
-- Use this script to initialize a FRESH Supabase project.
-- It works best on an empty database.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'musician', 'super_admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. TABLES

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  role user_role DEFAULT 'musician'::user_role,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SONGS
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  content TEXT, -- HTML content
  original_key TEXT,
  font_size INTEGER DEFAULT 12,
  line_spacing FLOAT DEFAULT 1.0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PLAYLISTS
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PLAYLIST ITEMS
CREATE TABLE IF NOT EXISTS public.playlist_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  custom_transposition INTEGER DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- MUSICAL STYLES
CREATE TABLE IF NOT EXISTS public.musical_styles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SONG FUNCTIONS
CREATE TABLE IF NOT EXISTS public.song_functions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- USER PREFERENCES
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    preferred_keys JSONB DEFAULT '{}'::jsonb,
    theme TEXT DEFAULT 'dark',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.musical_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4.2 Songs Policies
CREATE POLICY "Songs are viewable by everyone" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Authenticated can create songs" ON public.songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Editors can update own songs" ON public.songs FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all songs" ON public.songs FOR UPDATE USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
CREATE POLICY "Admins can delete songs" ON public.songs FOR DELETE USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 4.3 Playlists Policies
CREATE POLICY "Public playlists are viewable by everyone" ON public.playlists FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own playlists" ON public.playlists FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own playlists" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own playlists" ON public.playlists FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own playlists" ON public.playlists FOR DELETE USING (auth.uid() = owner_id);

-- 4.4 Playlist Items Policies
CREATE POLICY "Items viewable if playlist viewable" ON public.playlist_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_items.playlist_id AND (p.is_public = true OR p.owner_id = auth.uid()))
);

CREATE POLICY "Users can manage own playlist items" ON public.playlist_items FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM public.playlists WHERE id = playlist_id)
) WITH CHECK (
    auth.uid() IN (SELECT owner_id FROM public.playlists WHERE id = playlist_id)
);

-- 4.5 Metadata Policies
CREATE POLICY "Enable read access for all users" ON public.musical_styles FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON public.musical_styles FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.song_functions FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON public.song_functions FOR ALL USING (auth.role() = 'authenticated');

-- 4.6 Preferences Policies
CREATE POLICY "Users manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. FUNCTIONS & TRIGGERS

-- Handle New User (Create Profile)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name)
  VALUES (
    new.id, 
    new.email, 
    'musician'::user_role, -- Default role
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Profile Creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 6. SEED DATA (Metadata)
INSERT INTO public.musical_styles (name) VALUES
    ('Pop Rock'), ('Rock 6/8'), ('Rock n´Roll'), ('Balada'), ('Worship'), 
    ('Folk'), ('Samba'), ('Pagode'), ('Baião'), ('Forró'), ('Xote'), 
    ('Sertanejo'), ('Sertanejo pop'), ('MPB'), ('Guarânia'), ('Soul / R&B'), 
    ('Reggae'), ('Blues'), ('Jazz'), ('Marcha'), ('Valsa'), ('Chamamé'), 
    ('Vaneira'), ('Vanerão'), ('Milonga'), ('Xote Gaúcho'), ('Rancheira'), ('Bugio')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.song_functions (name) VALUES
    ('Abertura'), ('Adoração'), ('Ceia'), ('Exaltação'), ('Clamor'), 
    ('Congregacional'), ('Encerramento'), ('Profético'), ('Contemplação'), 
    ('Avivamento'), ('Ofertas'), ('Instrumental'), ('Infantil')
ON CONFLICT (name) DO NOTHING;

-- 7. SETUP ADMIN USER (Optional - Uncomment and run manually if needed)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_ADMIN_EMAIL@example.com';
