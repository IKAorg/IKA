alter table public.events
  add column if not exists event_type text not null default 'event',
  add column if not exists is_official_ika boolean not null default false,
  add column if not exists allow_member_registration boolean not null default true,
  add column if not exists registration_open boolean not null default true;

alter table public.events
  drop constraint if exists events_event_type_check;

alter table public.events
  add constraint events_event_type_check
  check (
    event_type in (
      'event',
      'seminar',
      'course',
      'taikai',
      'grading',
      'meeting',
      'encounter',
      'busen'
    )
  );

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  registered_by_profile_id uuid references public.users_profiles(id) on delete set null,
  status text not null default 'registered',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, member_id)
);

alter table public.event_registrations
  drop constraint if exists event_registrations_status_check;

alter table public.event_registrations
  add constraint event_registrations_status_check
  check (status in ('registered', 'cancelled'));

create index if not exists event_registrations_event_idx
  on public.event_registrations (event_id, status, created_at desc);

create index if not exists event_registrations_member_idx
  on public.event_registrations (member_id, created_at desc);

alter table public.event_registrations enable row level security;

create policy "members and scoped admins read event registrations"
on public.event_registrations for select
using (
  member_id = app.current_member_id()
  or app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1
    from public.events e
    where e.id = event_id
      and (
        (e.country_id is not null and app.can_manage_country(e.country_id))
        or (e.dojo_id is not null and app.can_manage_dojo(e.dojo_id))
      )
  )
);

create policy "members insert own open event registrations"
on public.event_registrations for insert
with check (
  member_id = app.current_member_id()
  and exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.status = 'published'
      and e.allow_member_registration = true
      and e.registration_open = true
  )
);

create policy "members update own event registrations"
on public.event_registrations for update
using (member_id = app.current_member_id())
with check (member_id = app.current_member_id());

create policy "scoped admins manage event registrations"
on public.event_registrations for all
using (
  app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1
    from public.events e
    where e.id = event_id
      and (
        (e.country_id is not null and app.can_manage_country(e.country_id))
        or (e.dojo_id is not null and app.can_manage_dojo(e.dojo_id))
      )
  )
)
with check (
  app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1
    from public.events e
    where e.id = event_id
      and (
        (e.country_id is not null and app.can_manage_country(e.country_id))
        or (e.dojo_id is not null and app.can_manage_dojo(e.dojo_id))
      )
  )
);
