-- Ver o código completo da função handle_new_user
SELECT 
    'FUNCTION CODE' as info,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';
