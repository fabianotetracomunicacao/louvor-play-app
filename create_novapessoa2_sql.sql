-- CRIAÇÃO MANUAL: novapessoa2@hotmail.com
-- Objetivo: Provar que o banco aceita logins SE o usuário for criado via SQL.

BEGIN;

DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  -- 1. Inserir Usuário
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_super_admin,
    phone,
    phone_confirmed_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'novapessoa2@hotmail.com',
    public.crypt('123456', public.gen_salt('bf')), -- Senha criptografada corretamente
    now(), -- Email confirmado automatico
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Nova Pessoa SQL"}', -- Trigger deve pegar isso
    now(),
    now(),
    null,null,null,'','','','' 
  );

  -- 2. Inserir Identidade (Obrigatório para o Supabase reconhecer)
  INSERT INTO auth.identities (
    provider_id,
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    'novapessoa2@hotmail.com', -- provider_id é o email para provider 'email'
    v_user_id, -- ID da identity geralmente é igual ao user_id para email provider
    v_user_id,
    jsonb_build_object('sub', v_user_id, 'email', 'novapessoa2@hotmail.com'),
    'email',
    now(),
    now(),
    now()
  );

  RAISE NOTICE 'Usuário NovaPessoa2 criado com sucesso! ID: %', v_user_id;
END $$;

COMMIT;
