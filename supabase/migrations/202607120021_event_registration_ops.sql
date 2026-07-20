alter table public.event_registrations
  add column if not exists payment_status text not null default 'pending',
  add column if not exists checked_in_at timestamptz,
  add column if not exists admin_notes text;

alter table public.event_registrations
  drop constraint if exists event_registrations_payment_status_check;

alter table public.event_registrations
  add constraint event_registrations_payment_status_check
  check (payment_status in ('pending', 'paid', 'waived'));

create index if not exists event_registrations_payment_idx
  on public.event_registrations (event_id, payment_status, created_at desc);
