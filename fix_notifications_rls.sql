-- Permite que qualquer usuário autenticado crie notificações (para outros usuários)
create policy "Users can insert notifications"
on notifications for insert
to authenticated
with check (true);

-- Garante que o usuário possa ver as próprias notificações (já deve existir, mas reforçando)
create policy "Users can view own notifications"
on notifications for select
to authenticated
using (auth.uid() = user_id);
