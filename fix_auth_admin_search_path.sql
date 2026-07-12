-- CORREÇÃO DE SEARCH_PATH DO ADMIN (CRÍTICO)
-- Se o robô não souber que existe a pasta 'extensions', ele não acha as ferramentas.

-- 1. Define o caminho de busca padrão para o usuário de autenticação
ALTER ROLE supabase_auth_admin SET search_path = public, extensions;

-- 2. Define também para o postgres (garantia)
ALTER ROLE postgres SET search_path = public, extensions;

-- 3. Define para o banco de dados como um todo
ALTER DATABASE postgres SET search_path = public, extensions;

-- 4. Garante permissão (de novo, pra garantir)
GRANT USAGE ON SCHEMA extensions TO supabase_auth_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO supabase_auth_admin;

-- 5. Teste VISUAL (Retorna uma linha)
SELECT 
    rolname, 
    rolconfig 
FROM pg_roles 
WHERE rolname = 'supabase_auth_admin';
