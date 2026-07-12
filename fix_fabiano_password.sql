-- FIX FINAL: FABIANO (Aplicando a solução validada)
-- O usuário de teste 'teste_supremo' deu VERDE no diagnóstico.
-- Agora vamos aplicar a mesma correção de senha para o 'fabiano'.

DO $$
BEGIN
    -- 1. Regerar o hash da senha usando a função pública (que sabemos que funciona)
    UPDATE auth.users 
    SET encrypted_password = public.crypt('123456', public.gen_salt('bf')),
        updated_at = now(),
        email_confirmed_at = COALESCE(email_confirmed_at, now()), -- Garante confirmado
        role = 'authenticated',
        aud = 'authenticated'
    WHERE email = 'fabiano@tetracomunicacao.com.br';

    RAISE NOTICE '✅ Senha do Fabiano corrigida para "123456".';
    RAISE NOTICE 'Pode tentar logar com ele agora!';
END $$;
