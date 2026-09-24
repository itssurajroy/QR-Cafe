-- Copyright (c) 2026 QRslice. All rights reserved.
-- QRslice — A1+A2 payload on outbox
alter table public.whatsapp_messages
  add column if not exists media_url text,
  add column if not exists media_type text check (media_type in ('image','document','video','audio')),
  add column if not exists caption text,
  add column if not exists buttons jsonb,
  add column if not exists inbound_id uuid;

-- FK to whatsapp_inbound_messages — table is created in 20260926000003; add constraint idempotently when present
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='whatsapp_inbound_messages')
     and not exists (select 1 from pg_constraint where conname='whatsapp_messages_inbound_id_fkey') then
    alter table public.whatsapp_messages
      add constraint whatsapp_messages_inbound_id_fkey foreign key (inbound_id) references public.whatsapp_inbound_messages(id);
  end if;
end $$;

notify pgrst, 'reload schema';
