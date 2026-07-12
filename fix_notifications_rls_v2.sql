-- Corrige permissionamento de notificações
-- Primeiro remove as policies antigas para evitar erro de duplicação
drop policy if exists "Users can insert notifications" on notifications;
drop policy if exists "Users can view own notifications" on notifications;

-- Cria novamente com permissão total para usuários autenticados criarem notificações
create policy "Users can insert notifications"
on notifications for insert
to authenticated
with check (true);

-- Garante visualização das próprias notificações
create policy "Users can view own notifications"
on notifications for select
to authenticated
using (auth.uid() = user_id);
