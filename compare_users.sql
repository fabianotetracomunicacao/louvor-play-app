-- COMPARAÇÃO LIMPA ENTRE O QUE FUNCIONA E O QUE NÃO FUNCIONA
-- Fabiano (Clone) vs TesteSegundo (Fix Script)

SELECT 
    id, 
    email, 
    role, 
    encrypted_password like '$2%' as pass_valid_prefix,
    -- Onde está o segredo: Metadados do App e do Usuário
    raw_app_meta_data, 
    raw_user_meta_data, 
    email_confirmed_at,
    -- Conta quantas identidades tem (deve ser 1)
    (SELECT count(*) FROM auth.identities WHERE user_id = auth.users.id) as identities_count
FROM auth.users 
WHERE email IN ('fabiano@tetracomunicacao.com.br', 'testesegundo@hotmail.com.br');

-- Verifica se a identidade em si está correta (email, provider, etc)
SELECT * FROM auth.identities 
WHERE email IN ('fabiano@tetracomunicacao.com.br', 'testesegundo@hotmail.com.br');
