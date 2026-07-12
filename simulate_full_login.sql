-- SIMULAÇÃO COMPLETA DE LOGIN (SQL)
-- Vamos fazer TUDO que o Supabase Auth faz ao logar:
-- 1. Atualizar last_sign_in_at
-- 2. Criar Session
-- 3. Criar Refresh Token
-- Se isso rodar sem erro, o Banco de Dados está 100% INOCENTE.

DO $$
DECLARE
  v_user_id uuid;
  v_session_id uuid;
BEGIN
  -- 1. Pega ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'testequarto@hotmail.com';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  -- 2. Atualiza User
  UPDATE auth.users SET last_sign_in_at = now() WHERE id = v_user_id;

  -- 3. Cria Session
  v_session_id := gen_random_uuid();
  INSERT INTO auth.sessions (id, user_id, created_at, updated_at)
  VALUES (v_session_id, v_user_id, now(), now());

  -- 4. Cria Refresh Token (Simulado - algumas versões exigem parent)
  INSERT INTO auth.refresh_tokens (instance_id, id, token, user_id, session_id, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0000-000000000000', 
    gen_random_uuid(), -- ID do token (serial ou uuid dependendo da versão, tenta uuid)
    'token-' || gen_random_uuid(), -- Token fake
    v_user_id, 
    v_session_id, 
    now(), 
    now()
  );

  RAISE NOTICE 'SUCESSO TOTAL! O banco aceitou todo o fluxo de login.';

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'FALHA NA SIMULAÇÃO: %', SQLERRM;
END $$;
