-- TESTE DE CRIAÇÃO DE SESSÃO (SIMULAÇÃO DE LOGIN)
-- Se o login falha, é porque ele não consegue gravar a sessão.
-- Vamos tentar gravar na mão e ver o erro que estoura.

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Pega o ID do testequarto
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'testequarto@hotmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado!';
  END IF;

  -- Tenta inserir uma sessão (Simulando o Supabase Auth)
  INSERT INTO auth.sessions (id, user_id, created_at, updated_at)
  VALUES (gen_random_uuid(), v_user_id, now(), now());

  RAISE NOTICE 'Sessão criada com sucesso via SQL! O problema não é na tabela sessions.';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERRO AO CRIAR SESSÃO: %', SQLERRM;
END $$;
