-- SIMULAÇÃO COMPLETA DE LOGIN V2 (ID CORRIGIDO)
-- A tabela refresh_tokens usa ID numérico (BigInt), não UUID.
-- Vamos deixar o banco gerar o ID sozinho (auto-increment).

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

  -- 4. Cria Refresh Token (SEM PASSAR ID, POIS É SERIAL/BIGINT)
  INSERT INTO auth.refresh_tokens (instance_id, token, user_id, session_id, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'token-' || gen_random_uuid(), 
    v_user_id, 
    v_session_id, 
    now(), 
    now()
  );

  RAISE NOTICE 'SUCESSO TOTAL! O banco aceitou todo o fluxo de login (com ID corrigido).';

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'FALHA NA SIMULAÇÃO: %', SQLERRM;
END $$;
