-- VERIFICAR STATUS DO ÚLTIMO USUÁRIO
SELECT 
    email, 
    created_at, 
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMADO (Pode logar)' 
        ELSE 'PENDENTE (Precisa de email)' 
    END as status,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 3;
