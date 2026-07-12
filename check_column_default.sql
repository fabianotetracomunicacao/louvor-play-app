SELECT 
    column_name, 
    column_default, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
  AND table_name = 'users' 
  AND column_name = 'email_confirmed_at';
