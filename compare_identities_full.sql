-- Comparar TODOS os campos de identities
SELECT 
    'testeoitavo (FALHA)' as origem,
    i.*
FROM auth.identities i
JOIN auth.users u ON u.id = i.user_id
WHERE u.email = 'testeoitavo@hotmail.com'

UNION ALL

SELECT 
    'testesetimo (FUNCIONA)' as origem,
    i.*
FROM auth.identities i
JOIN auth.users u ON u.id = i.user_id
WHERE u.email = 'testesetimo@hotmail.com';
