-- Copyright (c) 2026 QRslice. All rights reserved.
-- QRslice — inbound + tickets
create table if not exists public.whatsapp_inbound_messages(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.restaurants(id) on delete cascade,
  remote_jid text not null, push_name text, message_type text, body text, media_url text, raw jsonb, received_at timestamptz default now(), inbound_id text unique
);
create table if not exists public.whatsapp_tickets(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_jid text not null, customer_phone text, push_name text, status text check(status in ('open','closed')) default 'open', last_message_at timestamptz default now(), last_outbound_at timestamptz, unread_count int default 1, created_at timestamptz default now(),
  unique(tenant_id, customer_jid)
);
-- Backfill FK from 02 now that target exists (idempotent)
do $$
begin
  if not exists (select 1 from pg_constraint where conname='whatsapp_messages_inbound_id_fkey') then
    alter table public.whatsapp_messages
      add constraint whatsapp_messages_inbound_id_fkey foreign key (inbound_id) references public.whatsapp_inbound_messages(id);
  end if;
end $$;

-- Storage bucket (idempotent)
insert into storage.buckets(id,name,public) values('whatsapp-media','whatsapp-media',false) on conflict(id) do nothing;
notify pgrst, 'reload schema';
