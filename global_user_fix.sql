-- FIX GERAL DE USUÁRIOS (O Grande Conserto)
-- Esse script vai passar por TODOS os usuários que estão "quebrados" e aplicar a solução que funcionou pro Fabiano.
-- 1. Confirma o E-mail (Se você suspeita disso, mal não faz).
-- 2. Preenche os Metadados (O tal do campo "sub" que faltava).
-- 3. Reseta a senha para '123456' (Porque as senhas antigas foram criadas com o sistema bugado e não funcionam mais).

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, email FROM auth.users LOOP
        RAISE NOTICE '🔧 Consertando usuário: %', r.email;

        -- 1. Confirmar E-mail & 2. Metadados & 3. Senha Nova
        -- Usamos public.crypt direto para garantir que o hash seja válido.
        UPDATE auth.users
        SET 
            email_confirmed_at = COALESCE(email_confirmed_at, now()), -- Confirma se não estiver confirmado
            raw_user_meta_data = jsonb_build_object(
                'sub', r.id, 
                'email', r.email,
                'email_verified', true
            ),
            raw_app_meta_data = jsonb_build_object(
                'provider', 'email', 
                'providers', jsonb_build_array('email')
            ),
            encrypted_password = public.crypt('123456', public.gen_salt('bf')),
            updated_at = now(),
            role = 'authenticated',
            aud = 'authenticated'
        WHERE id = r.id;
        
        
        -- 4. Garante que tem Perfil com Nome (se não tiver)
        INSERT INTO public.profiles (id, email, name, role, created_at)
        VALUES (r.id, r.email, split_part(r.email, '@', 1), 'musician', now())
        ON CONFLICT (id) DO UPDATE 
        SET name = COALESCE(public.profiles.name, split_part(r.email, '@', 1));

        -- 5. CRUCIAL: Garante que existe auth.identities (Login falha sem isso!)
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        )
        VALUES (
            gen_random_uuid(), 
            r.id, 
            jsonb_build_object('sub', r.id, 'email', r.email, 'email_verified', true, 'phone_verified', false),
            'email', 
            r.id::text, -- Provider ID geralmente é o User ID para provider 'email' no Supabase
            now(), now(), now()
        )
        ON CONFLICT (provider_id, provider) DO NOTHING; -- Se já existe, não mexe

    END LOOP;

    RAISE NOTICE '✅ TODOS OS USUÁRIOS FORAM CONSERTADOS!';
    RAISE NOTICE '⚠️ Agora TODOS usam a senha: "123456". Avise a equipe.';
END $$;
