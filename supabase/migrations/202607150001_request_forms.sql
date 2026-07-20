create table if not exists public.request_forms (
  id uuid primary key default gen_random_uuid(),
  form_type text not null check (form_type in ('country', 'dojo', 'kenshi')),
  title text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  locale text not null default 'en' references public.languages(code),
  country_id uuid references public.countries(id) on delete cascade,
  dojo_id uuid references public.dojos(id) on delete cascade,
  created_by uuid not null references public.users_profiles(id) on delete cascade,
  access_token text not null unique,
  legal_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not (country_id is not null and dojo_id is not null))
);

create index if not exists request_forms_created_by_idx
  on public.request_forms (created_by, form_type, status);

create index if not exists request_forms_country_idx
  on public.request_forms (country_id);

create index if not exists request_forms_dojo_idx
  on public.request_forms (dojo_id);

create table if not exists public.request_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.request_forms(id) on delete cascade,
  submission_type text not null check (submission_type in ('country', 'dojo', 'kenshi')),
  status text not null default 'pending' check (status in ('pending', 'needs_info', 'approved', 'rejected')),
  locale text not null default 'en' references public.languages(code),
  applicant_email text,
  applicant_password text,
  applicant_name text,
  payload jsonb not null default '{}'::jsonb,
  consent_accepted boolean not null default false,
  consent_version text not null default 'IKA-INTL-2026-07',
  review_notes text,
  approved_entity_id uuid,
  reviewed_by uuid references public.users_profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists request_submissions_form_status_idx
  on public.request_submissions (form_id, status, created_at desc);

create index if not exists request_submissions_email_idx
  on public.request_submissions (applicant_email);

create index if not exists request_submissions_reviewed_by_idx
  on public.request_submissions (reviewed_by);

alter table public.request_forms enable row level security;
alter table public.request_submissions enable row level security;

drop policy if exists "admins manage request forms" on public.request_forms;
create policy "admins manage request forms"
on public.request_forms
for all
using (
  exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.users_profiles up on up.id = ur.profile_id
    where up.auth_user_id = auth.uid()
      and r.key in ('super_admin', 'global_admin', 'country_admin', 'dojo_admin')
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.users_profiles up on up.id = ur.profile_id
    where up.auth_user_id = auth.uid()
      and r.key in ('super_admin', 'global_admin', 'country_admin', 'dojo_admin')
  )
);

drop policy if exists "admins manage request submissions" on public.request_submissions;
create policy "admins manage request submissions"
on public.request_submissions
for all
using (
  exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.users_profiles up on up.id = ur.profile_id
    where up.auth_user_id = auth.uid()
      and r.key in ('super_admin', 'global_admin', 'country_admin', 'dojo_admin')
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.users_profiles up on up.id = ur.profile_id
    where up.auth_user_id = auth.uid()
      and r.key in ('super_admin', 'global_admin', 'country_admin', 'dojo_admin')
  )
);
