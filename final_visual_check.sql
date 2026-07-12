-- DIAGNÓSTICO VISUAL FINAL (Tabela de Verdade)
-- Retorna uma tabela com o status real do login e triggers.

WITH check_password AS (
    -- Tenta validar a senha '123456' para o usuário de teste
    SELECT COUNT(*) as valid 
    FROM auth.users 
    WHERE email = 'teste_supremo@tetracom.com' 
    AND encrypted_password = public.crypt('123456', encrypted_password)
),
session_triggers AS (
    SELECT COUNT(*) as cnt FROM information_schema.triggers 
    WHERE event_object_schema = 'auth' AND event_object_table = 'sessions'
),
user_triggers AS (
    SELECT COUNT(*) as cnt FROM information_schema.triggers 
    WHERE event_object_schema = 'auth' AND event_object_table = 'users'
),
profiles_triggers AS (
    SELECT COUNT(*) as cnt FROM information_schema.triggers 
    WHERE event_object_schema = 'public' AND event_object_table = 'profiles'
)
SELECT 
    CASE WHEN (SELECT valid FROM check_password) = 1 THEN '✅ SUCESSO' ELSE '❌ SENHA INVÁLIDA' END as "Teste de Senha",
    (SELECT cnt FROM session_triggers) as "Triggers Sessão (Deve ser 0)",
    (SELECT cnt FROM user_triggers) as "Triggers User (Deve ser 0)",
    (SELECT cnt FROM profiles_triggers) as "Triggers Perfil (Recomendado 0)",
    'Se a senha deu SUCESSO e triggers estão zerados, o banco está 100%.' as "Conclusão";
