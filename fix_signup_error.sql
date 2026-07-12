-- FIX SIGNUP ERROR (Robust Handle New User)

-- 1. Ensure Enum Exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'musician', 'super_admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ensure Table Exists and has correct permissions
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  role user_role DEFAULT 'musician'::user_role,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions to the function owner (usually postgres) and authenticated
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- 3. Recreate Function with EXPLICIT search_path (Critical for Security Definer)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name)
  VALUES (
    new.id, 
    new.email, 
    'musician'::user_role,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário')
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Capture error in log but allow signup to proceed (fallback)
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$;

-- 4. Recreate Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Test Query (Does not run trigger, just checks syntax)
SELECT 'Ready to retry signup' as status;
