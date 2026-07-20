alter table public.events
  add column if not exists tshirt_enabled boolean not null default false;

alter table public.event_registrations
  add column if not exists wants_tshirt boolean not null default false,
  add column if not exists tshirt_size text;

alter table public.event_registrations
  drop constraint if exists event_registrations_tshirt_size_check;

alter table public.event_registrations
  add constraint event_registrations_tshirt_size_check
  check (
    tshirt_size is null
    or tshirt_size in ('3XS', '2XS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL')
  );

create index if not exists event_registrations_tshirt_idx
  on public.event_registrations (event_id, wants_tshirt, tshirt_size);
