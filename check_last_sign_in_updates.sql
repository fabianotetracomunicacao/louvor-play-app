-- CHECK DE TIMESTAMP (DETETIVE)
-- Vamos ver se o "carimbo" de login está mudando quando dá erro 500.

SELECT 
    email,
    last_sign_in_at,
    updated_at,
    now() as hora_atual
FROM auth.users 
WHERE email = 'testeterceiro@hotmail.com';
