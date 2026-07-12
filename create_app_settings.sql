-- Create the app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Anyone can read app_settings" 
    ON public.app_settings 
    FOR SELECT 
    USING (true);

-- Allow only super_admin to update settings
CREATE POLICY "Super Admins can insert app_settings" 
    ON public.app_settings 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'super_admin'
        )
    );

CREATE POLICY "Super Admins can update app_settings" 
    ON public.app_settings 
    FOR UPDATE 
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'super_admin'
        )
    );

CREATE POLICY "Super Admins can delete app_settings" 
    ON public.app_settings 
    FOR DELETE 
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'super_admin'
        )
    );

-- Insert initial maintenance mode setting
INSERT INTO public.app_settings (key, value, description)
VALUES ('maintenance_mode', 'false'::jsonb, 'Ativa ou desativa o modo de manutenção global do site.')
ON CONFLICT (key) DO NOTHING;
