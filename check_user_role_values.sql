-- CHECK DE VALORES VÁLIDOS (ENUM)
-- O banco disse que 'member' não existe. Quais são os valores permitidos para 'user_role'?

SELECT e.enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'user_role';
