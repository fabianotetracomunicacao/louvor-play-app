begin;

alter table public.setlist_scales
  add column if not exists whatsapp_omni_invite_claimed_at timestamptz,
  add column if not exists whatsapp_omni_message_id text,
  add column if not exists whatsapp_omni_decline_claimed_at timestamptz;

create unique index if not exists setlist_scales_omni_message_idx
  on public.setlist_scales (whatsapp_omni_message_id)
  where whatsapp_omni_message_id is not null;

create or replace function public.protect_omni_scale_delivery()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.whatsapp_omni_invite_claimed_at is not null
        or new.whatsapp_omni_message_id is not null
        or new.whatsapp_omni_decline_claimed_at is not null then
      raise exception 'Only the server can record WhatsApp deliveries' using errcode = '42501';
    end if;
  elsif new.whatsapp_omni_invite_claimed_at is distinct from old.whatsapp_omni_invite_claimed_at
      or new.whatsapp_omni_message_id is distinct from old.whatsapp_omni_message_id
      or new.whatsapp_omni_decline_claimed_at is distinct from old.whatsapp_omni_decline_claimed_at then
    raise exception 'Only the server can record WhatsApp deliveries' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_omni_scale_delivery on public.setlist_scales;
create trigger protect_omni_scale_delivery
  before insert or update on public.setlist_scales
  for each row execute function public.protect_omni_scale_delivery();

revoke execute on function public.protect_omni_scale_delivery() from public, anon, authenticated;

create or replace function public.process_omni_scale_response(
  p_phone text,
  p_status text,
  p_scale_id uuid default null,
  p_reply_to text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target public.setlist_scales%rowtype;
  next_status public.setlist_scales.status%type;
  next_whatsapp_status public.setlist_scales.whatsapp_status%type;
  sender text := public.normalize_br_phone(p_phone);
  answered_at timestamptz := now();
  service record;
  member_name text;
  schedule_text text;
  roster text;
begin
  if sender = '' or p_status is null or p_status not in ('CONFIRMED', 'DECLINED')
      or (p_scale_id is null and coalesce(p_reply_to, '') = '') then
    return jsonb_build_object('ignored', true);
  end if;

  next_status := p_status;
  next_whatsapp_status := p_status;

  update public.setlist_scales as scale
  set status = next_status,
      whatsapp_status = next_whatsapp_status,
      confirmed_at = case when p_status = 'CONFIRMED' then answered_at else scale.confirmed_at end,
      declined_at = case when p_status = 'DECLINED' then answered_at else scale.declined_at end,
      decline_reason = case when p_status = 'DECLINED' then 'Resposta recebida via WhatsApp' else scale.decline_reason end,
      whatsapp_omni_decline_claimed_at = case
        when p_status = 'DECLINED' then answered_at else scale.whatsapp_omni_decline_claimed_at end
  where scale.status = 'PENDING'
    and scale.whatsapp_omni_invite_claimed_at is not null
    and (
      (p_scale_id is not null and scale.id = p_scale_id)
      or (p_scale_id is null and scale.whatsapp_omni_message_id = p_reply_to)
    )
    and exists (
      select 1 from public.profiles as profile
      where profile.id = scale.user_id
        and sender in (
          public.normalize_br_phone(profile.whatsapp),
          public.normalize_br_phone(profile.phone)
        )
    )
  returning scale.* into target;

  if not found then
    return jsonb_build_object('ignored', true);
  end if;

  select coalesce(nullif(setlist.title, ''), nullif(setlist.name, ''), 'Culto') as title,
         setlist.date,
         setlist.service_time,
         coalesce(nullif(leader.whatsapp, ''), leader.phone) as leader_phone,
         coalesce(member.name, member.full_name, 'Músico') as musician_name
  into service
  from public.setlists as setlist
  join public.profiles as member on member.id = target.user_id
  left join public.profiles as leader on leader.id = setlist.created_by
  where setlist.id = target.setlist_id;

  if not found then
    return jsonb_build_object('success', true);
  end if;

  member_name := service.musician_name;
  schedule_text := concat(
    '📌 ', service.title,
    case when service.date is not null then
      E'\n📅 ' || to_char(service.date, 'DD/MM/YYYY') ||
      case when service.service_time is not null then ' às ' || to_char(service.service_time, 'HH24:MI') else '' end
    else '' end
  );

  select string_agg(
      case scale.status when 'CONFIRMED' then '✅ ' when 'DECLINED' then '❌ ' else '⏳ ' end ||
      coalesce(member.name, member.full_name, 'Músico') ||
      case when coalesce(scale.role, '') <> '' then ' — ' || scale.role else '' end,
      E'\n' order by scale.status, coalesce(member.name, member.full_name, '')
  )
  into roster
  from public.setlist_scales as scale
  join public.profiles as member on member.id = scale.user_id
  where scale.setlist_id = target.setlist_id;

  return jsonb_build_object(
    'success', true,
    'musician_phone', sender,
    'musician_message', concat(
      case when p_status = 'CONFIRMED' then '✅ Presença confirmada!' else '❌ Recusa registrada.' end,
      E'\n\nObrigado, ', member_name, E'.\n', schedule_text
    ),
    'leader_phone', service.leader_phone,
    'leader_message', concat(
      case when p_status = 'CONFIRMED' then '✅ Confirmação recebida' else '❌ Recusa recebida' end,
      E'\n\n', member_name, E'\n', schedule_text, E'\n\n', left(coalesce(roster, ''), 3000)
    )
  );
end;
$$;

revoke execute on function public.process_omni_scale_response(text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.process_omni_scale_response(text, text, uuid, text) to service_role;

-- Remove access to the previous webhook and its credentials as part of the cutover.
revoke execute on function public.process_zapi_scale_response(text, text, text, text) from public, anon, authenticated;

drop policy if exists "Protect legacy WhatsApp credentials" on public.app_settings;
create policy "Protect legacy WhatsApp credentials"
  on public.app_settings as restrictive
  for all to anon, authenticated
  using (key not in ('zapi_instance_id', 'zapi_instance_token', 'zapi_client_token', 'zapi_webhook_secret'))
  with check (key not in ('zapi_instance_id', 'zapi_instance_token', 'zapi_client_token', 'zapi_webhook_secret'));

commit;
