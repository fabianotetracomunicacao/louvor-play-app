-- CHECK DO NOME DO TIPO (ROLE)
-- O tipo não é 'app_role'. Vamos descobrir o nome verdadeiro desse Enum.

SELECT 
    column_name, 
    data_type, 
    udt_name, -- Aqui está o nome real do tipo (ex: 'user_role', 'roles', etc)
    udt_schema
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'role';
