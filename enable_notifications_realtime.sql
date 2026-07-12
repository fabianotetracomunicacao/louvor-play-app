-- Habilita Realtime para a tabela de notificações
-- Sem isso, o sininho não toca quando chega mensagem nova
alter publication supabase_realtime add table notifications;
