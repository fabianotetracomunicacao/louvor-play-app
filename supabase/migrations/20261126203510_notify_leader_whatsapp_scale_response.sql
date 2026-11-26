begin;

create or replace function public.notify_leader_whatsapp_scale_response()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  event_info record;
begin
  if current_user <> 'service_role' or new.whatsapp_omni_invite_claimed_at is null then
    return new;
  end if;

  select s.created_by as leader_id,
         s.playlist_id,
         coalesce(nullif(btrim(s.title), ''), nullif(btrim(s.name), ''), 'Culto') as setlist_name,
         coalesce(nullif(btrim(p.name), ''), nullif(btrim(p.full_name), ''), 'Um músico') as member_name
  into event_info
  from public.setlists s
  left join public.profiles p on p.id = new.user_id
  where s.id = new.setlist_id;

  if not found or event_info.leader_id is null then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, message, data, link, read)
  values (
    event_info.leader_id,
    'info',
    case when new.status = 'CONFIRMED' then 'Presença confirmada' else 'Recusa na escala' end,
    format('%s %s em "%s".', event_info.member_name,
      case when new.status = 'CONFIRMED' then 'confirmou presença' else 'informou que não poderá participar' end,
      event_info.setlist_name),
    jsonb_build_object('event', 'whatsapp_scale_response', 'playlistId', event_info.playlist_id,
      'setlistId', new.setlist_id, 'scaleId', new.id, 'status', new.status),
    '/playlist/' || event_info.playlist_id::text || '?tab=setlists',
    false
  );

  return new;
end;
$$;

revoke execute on function public.notify_leader_whatsapp_scale_response() from public, anon, authenticated;
grant execute on function public.notify_leader_whatsapp_scale_response() to service_role;

create or replace trigger notify_leader_whatsapp_scale_response
  after update of status on public.setlist_scales
  for each row
  when (old.status = 'PENDING' and new.status in ('CONFIRMED', 'DECLINED'))
  execute function public.notify_leader_whatsapp_scale_response();

commit;
