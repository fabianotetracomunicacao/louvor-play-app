-- CAÇA AOS GATILHOS (MODO DEEP SCAN)
-- O erro persiste. Talvez o gatilho ruim não esteja em 'users', mas em 'sessions' ou 'refresh_tokens'.

SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
ORDER BY event_object_table;
