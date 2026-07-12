-- ANÁLISE FOCADA: Campos que DIFEREM
-- Baseado na imagem, vou focar nos campos que parecem diferentes

SELECT 
    email,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    email_change_confirm_status,
    reauthentication_token,
    reauthentication_sent_at
FROM auth.users
WHERE email IN (
    'login_test@teste.com',
    'testequarto@hotmail.com',
    'novapessoa2@hotmail.com'
)
ORDER BY created_at;
