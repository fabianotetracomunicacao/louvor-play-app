-- LISTAR TRIGGERS COMO TABELA (Para garantir visualização)
-- Se aparecer algum registo aqui, é suspeito.

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';
