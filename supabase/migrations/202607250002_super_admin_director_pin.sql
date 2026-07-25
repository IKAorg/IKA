create table if not exists public.super_admin_directors (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  pin_hash text,
  is_active boolean not null default true,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.super_admin_director_sessions (
  id uuid primary key default gen_random_uuid(),
  director_id uuid not null references public.super_admin_directors(id) on delete cascade,
  super_admin_profile_id uuid not null references public.users_profiles(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  ip_address text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.audit_logs
add column if not exists director_profile_id uuid references public.super_admin_directors(id) on delete set null;

create index if not exists super_admin_directors_active_idx
  on public.super_admin_directors (is_active, display_name);

create index if not exists super_admin_director_sessions_token_idx
  on public.super_admin_director_sessions (token_hash);

create index if not exists super_admin_director_sessions_expiry_idx
  on public.super_admin_director_sessions (expires_at)
  where revoked_at is null;

create index if not exists audit_logs_director_created_idx
  on public.audit_logs (director_profile_id, created_at desc);

alter table public.super_admin_directors enable row level security;
alter table public.super_admin_director_sessions enable row level security;

drop policy if exists "super admins manage director pin profiles" on public.super_admin_directors;
create policy "super admins manage director pin profiles"
on public.super_admin_directors for all
using (app.is_super_admin())
with check (app.is_super_admin());

drop policy if exists "super admins manage director pin sessions" on public.super_admin_director_sessions;
create policy "super admins manage director pin sessions"
on public.super_admin_director_sessions for all
using (app.is_super_admin())
with check (app.is_super_admin());

create extension if not exists pgcrypto with schema extensions;

drop trigger if exists super_admin_directors_updated_at on public.super_admin_directors;
create trigger super_admin_directors_updated_at
before update on public.super_admin_directors
for each row
execute function app.set_updated_at();
