-- ESCANEAMENTO COMPLETO DE TRIGGERS (AUTH)
-- Procura triggers em TODAS as tabelas do schema auth, via catálogo do sistema.

SELECT 
    c.relname as tabela,
    t.tgname as trigger_nome,
    p.proname as funcao_chamada
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
ORDER BY c.relname;
