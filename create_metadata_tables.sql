-- Create table for Musical Styles
CREATE TABLE IF NOT EXISTS public.musical_styles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for Song Functions
CREATE TABLE IF NOT EXISTS public.song_functions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.musical_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_functions ENABLE ROW LEVEL SECURITY;

-- Policies for Musical Styles
-- Everyone can read
CREATE POLICY "Enable read access for all users" ON public.musical_styles
    FOR SELECT USING (true);

-- Only admins/editors can insert/delete (simplified to authenticated for now, or check profile role)
-- Let's stick to authenticated users with role check ideally, but for now simple authenticated write
CREATE POLICY "Enable write access for authenticated users" ON public.musical_styles
    FOR ALL USING (auth.role() = 'authenticated');


-- Policies for Song Functions
CREATE POLICY "Enable read access for all users" ON public.song_functions
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for authenticated users" ON public.song_functions
    FOR ALL USING (auth.role() = 'authenticated');

-- Seed Data - Styles
INSERT INTO public.musical_styles (name) VALUES
    ('Pop Rock'), ('Rock 6/8'), ('Rock n´Roll'), ('Balada'), ('Worship'), 
    ('Folk'), ('Samba'), ('Pagode'), ('Baião'), ('Forró'), ('Xote'), 
    ('Sertanejo'), ('Sertanejo pop'), ('MPB'), ('Guarânia'), ('Soul / R&B'), 
    ('Reggae'), ('Blues'), ('Jazz'), ('Marcha'), ('Valsa'), ('Chamamé'), 
    ('Vaneira'), ('Vanerão'), ('Milonga'), ('Xote Gaúcho'), ('Rancheira'), ('Bugio')
ON CONFLICT (name) DO NOTHING;

-- Seed Data - Functions
INSERT INTO public.song_functions (name) VALUES
    ('Abertura'), ('Adoração'), ('Ceia'), ('Exaltação'), ('Clamor'), 
    ('Congregacional'), ('Encerramento'), ('Profético'), ('Contemplação'), 
    ('Avivamento'), ('Ofertas'), ('Instrumental'), ('Infantil')
ON CONFLICT (name) DO NOTHING;
