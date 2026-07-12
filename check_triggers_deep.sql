-- VERIFICAÇÃO DE TRIGGERS (NÍVEL DEEP/CATÁLOGO)
-- A information_schema pode mentir. O pg_trigger não mente.

SELECT 
    tgname as nome_trigger,
    proname as nome_funcao,
    relname as tabela
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
AND c.relname = 'users';
