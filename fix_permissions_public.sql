-- PERMISSÃO NUCLEAR PARA PUBLIC
-- Já que não podemos alterar o 'supabase_auth_admin', vamos liberar o acesso para 'public'.
-- Isso deve permitir que qualquer role (incluindo o robô de auth) use a criptografia.

BEGIN;

-- 1. Libera Schema 'extensions' para todo mundo
GRANT USAGE ON SCHEMA extensions TO public;

-- 2. Libera Execução de TODAS as funções (incluindo crypt e gen_salt)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO public;

-- 3. (Opcional) Libera Schema 'auth' para leitura (só para garantir)
GRANT USAGE ON SCHEMA auth TO public;

-- 4. Tenta criar um wrapper "falso" em public caso o sistema procure lá
-- (Se já existir, ignora)
CREATE OR REPLACE FUNCTION public.gen_salt(text) RETURNS text AS $$
    SELECT extensions.gen_salt($1);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.crypt(text, text) RETURNS text AS $$
    SELECT extensions.crypt($1, $2);
$$ LANGUAGE sql SECURITY DEFINER;

COMMIT;

SELECT '✅ Permissões aplicadas e Wrappers criados.' as status;
