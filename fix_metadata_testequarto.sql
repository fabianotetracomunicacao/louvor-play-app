-- FIX METADATA (TESTEQUARTO)
-- O login_test (que funciona) tem: '{"provider": "email", "providers": ["email"]}'
-- O testequarto (que falha) pode estar incompleto. Vamos clonar o sucesso.

UPDATE auth.users
SET raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb
WHERE email = 'testequarto@hotmail.com';

SELECT 'Metadata corrigido para padrão Supabase.' as status;
