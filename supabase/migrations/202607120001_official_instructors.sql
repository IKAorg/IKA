create table if not exists public.official_instructors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  grade text,
  country_name text not null,
  photo_url text,
  photo_alt text,
  sort_order integer not null default 100,
  is_visible boolean not null default true,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists official_instructors_visible_order_idx
  on public.official_instructors (is_visible, sort_order, created_at);

drop trigger if exists set_official_instructors_updated_at on public.official_instructors;
create trigger set_official_instructors_updated_at
before update on public.official_instructors
for each row execute function app.set_updated_at();

alter table public.official_instructors enable row level security;

drop policy if exists "public can read visible official instructors" on public.official_instructors;
create policy "public can read visible official instructors"
on public.official_instructors for select
using (is_visible = true or app.is_super_admin());

drop policy if exists "super admins manage official instructors" on public.official_instructors;
create policy "super admins manage official instructors"
on public.official_instructors for all
using (app.is_super_admin())
with check (app.is_super_admin());
