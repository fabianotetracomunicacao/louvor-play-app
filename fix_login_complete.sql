-- FIX LOGIN ERROR & MISSING PROVIDER (Complete Repair)

-- 1. FIX THE DATABASE ERROR (RLS Recursion)
-- Re-applying the fix to ensure policies don't loop.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, extensions
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- Drop old policies (Cleaning up)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Visibility" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Delete" ON public.profiles;

-- Create Safe Policies
CREATE POLICY "Profiles Visibility" ON public.profiles FOR SELECT
USING ( auth.uid() = id OR get_my_role() IN ('admin', 'editor') );

CREATE POLICY "Profiles Update" ON public.profiles FOR UPDATE
USING ( auth.uid() = id OR get_my_role() = 'admin' );

CREATE POLICY "Profiles Insert" ON public.profiles FOR INSERT
WITH CHECK ( true );

CREATE POLICY "Profiles Delete" ON public.profiles FOR DELETE
USING ( get_my_role() = 'admin' );

GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated, anon;


-- 2. FIX THE "EMPTY PROVIDER" (Missing Identity)
-- Finds the user and adds the 'email' provider identity if missing.

DO $$
DECLARE
    target_email TEXT := 'fabiano@tetracomunicacao.com.br';
    user_rec RECORD;
BEGIN
    SELECT * INTO user_rec FROM auth.users WHERE email = target_email;

    IF user_rec.id IS NOT NULL THEN
        -- Check if identity exists
        IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = user_rec.id) THEN
            RAISE NOTICE 'Corrigindo falta de identidade para %...', target_email;
            
            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                provider_id,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                user_rec.id, -- use user_id as identity id for email provider usually, or gen_random_uuid()
                user_rec.id,
                jsonb_build_object('sub', user_rec.id, 'email', target_email, 'email_verified', true, 'phone_verified', false),
                'email',
                user_rec.id::text, -- provider_id is usually the user_id for email provider
                now(),
                now(),
                now()
            );
            
            RAISE NOTICE '✅ Identidade criada! O ícone de Carta (Email) deve aparecer no painel agora.';
        ELSE
             RAISE NOTICE 'Identidade já existe normal.';
        END IF;

        -- 3. ENSURE PROFILE EXISTS
        INSERT INTO public.profiles (id, email, role)
        VALUES (user_rec.id, target_email, 'editor')
        ON CONFLICT (id) DO NOTHING;
        
    ELSE
        RAISE NOTICE 'Usuário não encontrado para correção. Verifique se ele foi realmente recriado.';
    END IF;
END $$;
