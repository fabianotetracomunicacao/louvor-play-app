-- DIAGNÓSTICO DETALHADO DO USUÁRIO
-- Vamos ver exatamente como o usuário Fabiano está gravado no banco.

DO $$
DECLARE
    target_email TEXT := 'fabiano@tetracomunicacao.com.br';
    u_rec RECORD;
    i_count INT;
    p_rec RECORD;
BEGIN
    RAISE NOTICE '=== INÍCIO DO DIAGNÓSTICO PARA % ===', target_email;

    -- 1. Checar auth.users
    SELECT * INTO u_rec FROM auth.users WHERE email = target_email;
    
    IF u_rec.id IS NULL THEN
        RAISE NOTICE '❌ ERRO: Usuário não encontrado na tabela auth.users!';
    ELSE
        RAISE NOTICE '✅ auth.users encontrado. ID: %', u_rec.id;
        RAISE NOTICE '   Email Confirmed At: %', u_rec.email_confirmed_at;
        RAISE NOTICE '   Last Sign In: %', u_rec.last_sign_in_at;
        RAISE NOTICE '   Encrypted User: %', (u_rec.encrypted_password IS NOT NULL);
        RAISE NOTICE '   Role: %', u_rec.role;
        RAISE NOTICE '   Instance ID: %', u_rec.instance_id;
    END IF;

    -- 2. Checar auth.identities
    SELECT count(*) INTO i_count FROM auth.identities WHERE user_id = u_rec.id;
    
    IF i_count = 0 THEN
        RAISE NOTICE '❌ ERRO: Nenhuma identidade (auth.identities) encontrada! O Login falhará.';
    ELSE
        RAISE NOTICE '✅ Identidades encontradas: %', i_count;
    END IF;

    -- 3. Checar public.profiles
    SELECT * INTO p_rec FROM public.profiles WHERE id = u_rec.id;
    
    IF p_rec.id IS NULL THEN
        RAISE NOTICE '⚠️ AVISO: Perfil (public.profiles) não encontrado.';
    ELSE
        RAISE NOTICE '✅ Perfil encontrado. Role: %', p_rec.role;
    END IF;

    -- 4. Teste de RLS (Simulado)
    -- Tenta ler o perfil "como se fosse" o usuário (mas aqui somos admin, então é só para garantir que a tabela responde)
    BEGIN
        PERFORM * FROM public.profiles WHERE id = u_rec.id;
        RAISE NOTICE '✅ Leitura de profiles OK (Sem erro de banco).';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO AO LER PROFILES: %', SQLERRM;
    END;

    RAISE NOTICE '=== FIM DO DIAGNÓSTICO ===';
END $$;
