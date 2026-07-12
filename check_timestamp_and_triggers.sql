-- TIMESTAMP E TRIGGERS
-- 1. Ver se o login de fato aconteceu (timestamp)
SELECT email, last_sign_in_at 
FROM auth.users 
WHERE email = 'testeterceiro@hotmail.com';

-- 2. Listar TODAS as triggers da tabela auth.users (Pode ter sobrada alguma quebrada)
SELECT 
    event_object_schema as schema,
    event_object_table as table,
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';
