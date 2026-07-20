alter table public.events
  add column if not exists duration_days integer not null default 1;

alter table public.events
  drop constraint if exists events_duration_days_check;

alter table public.events
  add constraint events_duration_days_check
  check (duration_days >= 1 and duration_days <= 30);

create table if not exists public.event_registration_checkins (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.event_registrations(id) on delete cascade,
  day_number integer not null,
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_id, day_number)
);

alter table public.event_registration_checkins
  drop constraint if exists event_registration_checkins_day_number_check;

alter table public.event_registration_checkins
  add constraint event_registration_checkins_day_number_check
  check (day_number >= 1 and day_number <= 30);

create index if not exists event_registration_checkins_registration_idx
  on public.event_registration_checkins (registration_id, day_number);

alter table public.event_registration_checkins enable row level security;

create policy "members and scoped admins read event registration checkins"
on public.event_registration_checkins for select
using (
  exists (
    select 1
    from public.event_registrations er
    where er.id = registration_id
      and (
        er.member_id = app.current_member_id()
        or app.is_super_admin()
        or app.has_role('global_admin')
        or exists (
          select 1
          from public.events e
          where e.id = er.event_id
            and (
              (e.country_id is not null and app.can_manage_country(e.country_id))
              or (e.dojo_id is not null and app.can_manage_dojo(e.dojo_id))
            )
        )
      )
  )
);

create policy "scoped admins manage event registration checkins"
on public.event_registration_checkins for all
using (
  exists (
    select 1
    from public.event_registrations er
    join public.events e on e.id = er.event_id
    where er.id = registration_id
      and (
        app.is_super_admin()
        or app.has_role('global_admin')
        or (e.country_id is not null and app.can_manage_country(e.country_id))
        or (e.dojo_id is not null and app.can_manage_dojo(e.dojo_id))
      )
  )
)
with check (
  exists (
    select 1
    from public.event_registrations er
    join public.events e on e.id = er.event_id
    where er.id = registration_id
      and (
        app.is_super_admin()
        or app.has_role('global_admin')
        or (e.country_id is not null and app.can_manage_country(e.country_id))
        or (e.dojo_id is not null and app.can_manage_dojo(e.dojo_id))
      )
  )
);
