-- Corrige a atualização em tempo real para deleções
-- Permite que o ID da playlist seja enviado mesmo quando um item é removido
ALTER TABLE playlist_items REPLICA IDENTITY FULL;
