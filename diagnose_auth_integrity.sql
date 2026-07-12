-- DIAGNÓSTICO PROFUNDO (DATA INTEGRITY)
-- O problema não é senha, nem permissão, nem perfil.
-- Sobrou: Instance ID incorreto ou Identidade corrompida.

SELECT 
    u.email,
    u.instance_id, -- CRÍTICO: Deve ser '00000000-0000-0000-0000-000000000000'
    count(i.id) as qtd_identities,
    u.created_at,
    u.last_sign_in_at
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email IN ('login_test@teste.com', 'testequarto@hotmail.com')
GROUP BY u.email, u.instance_id, u.created_at, u.last_sign_in_at;
