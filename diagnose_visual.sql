-- DIAGNÓSTICO VISUAL (Em Tabela)
-- Rode isto e veja a TABELA de resultados abaixo.

SELECT '1. Extensão pgcrypto' as "Checagem", 
       CASE WHEN EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pgcrypto' AND installed_version IS NOT NULL) 
            THEN '✅ INSTALADA' 
            ELSE '❌ FALTANDO' 
       END as "Status",
       'Necessária para login' as "Detalhe"

UNION ALL

SELECT '2. Gatilhos em auth.users',
       (SELECT count(*)::text FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users'),
       'Se > 0 pode ser o problema'

UNION ALL

SELECT '3. RLS em auth.users',
       (SELECT CASE WHEN relrowsecurity THEN '🔒 ATIVO' ELSE '🔓 DESLIGADO' END 
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'auth' AND c.relname = 'users'),
       'Normalmente deveria ser DESLIGADO (ou gerenciado pelo Supabase)'

UNION ALL

SELECT '4. Usuário Teste Criado?',
       CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'teste_supremo@tetracom.com') THEN '✅ SIM' ELSE '❌ NÃO' END,
       'teste_supremo@tetracom.com'

UNION ALL

SELECT '5. Identidade do Teste?',
       CASE WHEN EXISTS (SELECT 1 FROM auth.identities WHERE email = 'teste_supremo@tetracom.com') THEN '✅ OK' ELSE '❌ FALTANDO' END,
       'Se faltando, login falha'

ORDER BY "Checagem";
