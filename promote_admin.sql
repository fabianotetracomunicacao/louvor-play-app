-- PROMOCAO PARA SUPER ADMIN
-- Este script pega o último usuário criado (você) e o transforma em Admin.

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
    SELECT id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- Confirmação
SELECT u.email, p.role, p.name
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 1;
