-- EXTRAIR DADOS COMPLETOS: testequinto@hotmail.com
-- Vamos capturar TODOS os campos exatamente como o App criou.

-- 1. Dados de auth.users
SELECT 
    'auth.users' as tabela,
    jsonb_pretty(to_jsonb(u.*)) as dados_completos
FROM auth.users u
WHERE email = 'testequinto@hotmail.com';

-- 2. Dados de auth.identities
SELECT 
    'auth.identities' as tabela,
    jsonb_pretty(to_jsonb(i.*)) as dados_completos
FROM auth.identities i
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testequinto@hotmail.com');

-- 3. Dados de public.profiles
SELECT 
    'public.profiles' as tabela,
    jsonb_pretty(to_jsonb(p.*)) as dados_completos
FROM public.profiles p
WHERE id = (SELECT id FROM auth.users WHERE email = 'testequinto@hotmail.com');

-- 4. Comparação lado a lado com um que funciona
SELECT 
    'COMPARAÇÃO' as info,
    u1.email as email_funciona,
    u2.email as email_falha,
    u1.instance_id = u2.instance_id as instance_id_igual,
    u1.aud = u2.aud as aud_igual,
    u1.role = u2.role as role_igual,
    u1.raw_app_meta_data = u2.raw_app_meta_data as app_metadata_igual,
    u1.raw_user_meta_data = u2.raw_user_meta_data as user_metadata_igual,
    (u1.email_confirmed_at IS NOT NULL) = (u2.email_confirmed_at IS NOT NULL) as email_confirmed_igual,
    (u1.confirmation_sent_at IS NULL) = (u2.confirmation_sent_at IS NULL) as confirmation_sent_igual
FROM auth.users u1, auth.users u2
WHERE u1.email = 'novapessoa2@hotmail.com' 
AND u2.email = 'testequinto@hotmail.com';
