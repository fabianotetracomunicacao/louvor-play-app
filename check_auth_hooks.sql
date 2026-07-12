-- VERIFICAR: Auth Hooks e Configurações
-- Pode haver hooks ou triggers do Supabase Auth que estão quebrando os usuários.

-- 1. Verificar configurações do Auth
SELECT 
    name,
    setting,
    category,
    short_desc
FROM pg_settings
WHERE name LIKE '%auth%' OR name LIKE '%supabase%'
ORDER BY name;

-- 2. Verificar se há funções customizadas sendo chamadas
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('auth', 'public')
AND p.proname LIKE '%hook%'
ORDER BY n.nspname, p.proname;
