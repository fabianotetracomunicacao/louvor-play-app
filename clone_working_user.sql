-- CLONE FINAL (A Técnica do Espelho)
-- Se o usuário antigo funciona, vamos COPIAR ele inteirinho para o novo.
-- Copiando auth.users e auth.identities do 'fabiano_fischer' para o 'fabiano@tetracom'

DO $$
DECLARE
    -- Email de origem (que funciona)
    source_email TEXT := 'fabiano_fischer@hotmail.com';
    -- Email de destino (que vamos consertar)
    target_email TEXT := 'fabiano@tetracomunicacao.com.br';
    
    source_id UUID;
    new_id UUID := gen_random_uuid(); 
    source_pass TEXT;
BEGIN
    -- 1. Pega dados do usuário bom
    SELECT id, encrypted_password INTO source_id, source_pass 
    FROM auth.users 
    WHERE email = source_email;

    IF source_id IS NULL THEN
        RAISE EXCEPTION 'Usuário molde (%) não encontrado!', source_email;
    END IF;

    -- 2. Limpa o usuário ruim (pra nascer de novo)
    DELETE FROM public.profiles WHERE email = target_email;
    DELETE FROM auth.identities WHERE email = target_email;
    DELETE FROM auth.users WHERE email = target_email;

    -- 3. Clona auth.users (TUDO IGUAL, muda só ID e Email)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, 
        recovery_token, recovery_sent_at, email_change_token_new, email_change, 
        email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
        is_super_admin, created_at, updated_at, phone, phone_confirmed_at, 
        phone_change, phone_change_token, phone_change_sent_at, 
        email_change_token_current, email_change_confirm_status, banned_until, 
        reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
    )
    SELECT 
        instance_id, new_id, aud, role, target_email, source_pass, -- Usa a senha do antigo!
        now(), invited_at, confirmation_token, confirmation_sent_at, 
        recovery_token, recovery_sent_at, email_change_token_new, email_change, 
        email_change_sent_at, now(), raw_app_meta_data, raw_user_meta_data, 
        is_super_admin, now(), now(), phone, phone_confirmed_at, 
        phone_change, phone_change_token, phone_change_sent_at, 
        email_change_token_current, email_change_confirm_status, banned_until, 
        reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
    FROM auth.users 
    WHERE id = source_id;

    -- 4. Clona auth.identities
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    SELECT 
        gen_random_uuid(), -- ID novo da identidade
        new_id, -- Link pro User novo
        jsonb_build_object('sub', new_id, 'email', target_email, 'email_verified', true), -- Ajusta email no JSON
        provider, 
        new_id::text, -- Provider ID geralmente é o user ID ou email
        now(), now(), now()
    FROM auth.identities 
    WHERE user_id = source_id
    LIMIT 1; -- Pega só 1 identidade pra garantir

    -- 5. Clona Profile (se precisar)
    INSERT INTO public.profiles (id, email, role, created_at)
    VALUES (new_id, target_email, 'admin', now());

    RAISE NOTICE '✅ Clone realizado com sucesso!';
    RAISE NOTICE 'Tente logar com fabiano@tetracomunicacao.com.br usando a MESMA SENHA do fabiano_fischer.';
END $$;
