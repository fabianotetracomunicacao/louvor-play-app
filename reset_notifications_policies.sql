-- Reseta TODAS as policies da tabela notifications para garantir que não haja regras conflitantes
-- (Às vezes o Supabase cria policies automáticas que exigem user_id = auth.uid(), o que bloqueia o envio para OUTROS usuários)

DO $$ 
DECLARE 
  r RECORD; 
BEGIN 
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' LOOP 
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON notifications'; 
  END LOOP; 
END $$;

-- Recria as policies corretas

-- 1. Qualquer usuário logado pode INSERIR notificações (para qualquer um)
create policy "Enable insert for authenticated users"
on notifications for insert
to authenticated
with check (true);

-- 2. Usuário só pode VER as SUAS próprias notificações
create policy "Enable select for users based on user_id"
on notifications for select
to authenticated
using (auth.uid() = user_id);

-- 3. (Opcional) Usuário pode marcar como lida (UPDATE) as SUAS notificações
create policy "Enable update for users based on user_id"
on notifications for update
to authenticated
using (auth.uid() = user_id);
