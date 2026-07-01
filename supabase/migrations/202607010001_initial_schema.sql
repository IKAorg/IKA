-- IKA Platform initial schema
-- Target: Supabase PostgreSQL

create extension if not exists "pgcrypto";

create schema if not exists app;

create type app.profile_status as enum ('active', 'inactive', 'invited', 'blocked');
create type app.content_status as enum ('draft', 'published', 'archived');
create type app.member_status as enum ('active', 'inactive', 'temporary_leave');
create type app.correction_status as enum ('pending', 'in_review', 'approved', 'rejected', 'cancelled');
create type app.legacy_status as enum ('imported', 'needs_review', 'translated', 'published', 'archived');
create type app.media_visibility as enum ('public', 'private');

create table public.users_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  status app.profile_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.languages (
  code text primary key,
  name text not null,
  native_name text not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create unique index languages_one_default_idx on public.languages ((is_default)) where is_default;

create table public.media_library (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null,
  storage_path text not null,
  title text,
  alt_text text,
  mime_type text,
  size_bytes bigint,
  visibility app.media_visibility not null default 'private',
  uploaded_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  flag_media_id uuid references public.media_library(id) on delete set null,
  main_image_media_id uuid references public.media_library(id) on delete set null,
  responsible_person text,
  responsible_email text,
  status app.content_status not null default 'draft',
  is_public boolean not null default false,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.country_translations (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  language_code text not null references public.languages(code),
  name text not null,
  slug text not null,
  description text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, language_code),
  unique (language_code, slug)
);

create table public.dojos (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete restrict,
  city text not null,
  address text,
  responsible_instructor text,
  email text,
  phone text,
  website text,
  main_image_media_id uuid references public.media_library(id) on delete set null,
  status app.content_status not null default 'draft',
  is_public boolean not null default false,
  joined_ika_date date,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dojo_translations (
  id uuid primary key default gen_random_uuid(),
  dojo_id uuid not null references public.dojos(id) on delete cascade,
  language_code text not null references public.languages(code),
  name text not null,
  slug text not null,
  description text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dojo_id, language_code),
  unique (language_code, slug)
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.users_profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  country_id uuid references public.countries(id) on delete cascade,
  dojo_id uuid references public.dojos(id) on delete cascade,
  created_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (not (country_id is not null and dojo_id is not null))
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  template_key text not null default 'default',
  status app.content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.page_translations (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  language_code text not null references public.languages(code),
  title text not null,
  slug text not null,
  summary text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, language_code),
  unique (language_code, slug)
);

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  language_code text references public.languages(code),
  block_type text not null,
  sort_order integer not null default 100,
  data jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  status app.content_status not null default 'draft',
  cover_media_id uuid references public.media_library(id) on delete set null,
  published_at timestamptz,
  country_id uuid references public.countries(id) on delete set null,
  dojo_id uuid references public.dojos(id) on delete set null,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.news_translations (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references public.news(id) on delete cascade,
  language_code text not null references public.languages(code),
  title text not null,
  slug text not null,
  excerpt text,
  body text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (news_id, language_code),
  unique (language_code, slug)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  status app.content_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  country_id uuid references public.countries(id) on delete set null,
  dojo_id uuid references public.dojos(id) on delete set null,
  cover_media_id uuid references public.media_library(id) on delete set null,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_translations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  language_code text not null references public.languages(code),
  title text not null,
  slug text not null,
  excerpt text,
  body text,
  location_label text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, language_code),
  unique (language_code, slug)
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.users_profiles(id) on delete set null,
  ika_sequence bigint generated by default as identity unique,
  ika_number text generated always as ('IKA-' || lpad(ika_sequence::text, 6, '0')) stored unique,
  first_name text not null,
  last_name text not null,
  birth_date date,
  country_id uuid references public.countries(id) on delete set null,
  dojo_id uuid references public.dojos(id) on delete set null,
  main_instructor text,
  email text,
  phone text,
  is_minor boolean not null default false,
  guardian_name text,
  guardian_email text,
  joined_date date,
  status app.member_status not null default 'active',
  current_grade text,
  last_exam_date date,
  consent_accepted boolean not null default false,
  consent_accepted_at timestamptz,
  privacy_policy_version text,
  internal_notes text,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.grade_history (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  grade text not null,
  exam_date date not null,
  exam_place text,
  examiner text,
  certificate_media_id uuid references public.media_library(id) on delete set null,
  notes text,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  requested_by uuid references public.users_profiles(id) on delete set null,
  field_key text not null,
  current_value jsonb,
  requested_value jsonb not null,
  status app.correction_status not null default 'pending',
  reviewed_by uuid references public.users_profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  policy_version text not null,
  accepted_by_profile_id uuid references public.users_profiles(id) on delete set null,
  accepted_at timestamptz not null default now(),
  guardian_name text,
  guardian_email text,
  consent_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.legacy_content (
  id uuid primary key default gen_random_uuid(),
  original_url text not null,
  original_title text,
  original_language_code text references public.languages(code),
  original_content text,
  assigned_page_id uuid references public.pages(id) on delete set null,
  status app.legacy_status not null default 'imported',
  notes text,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.users_profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, app
as $$
  select id from public.users_profiles where auth_user_id = (select auth.uid()) limit 1;
$$;

create or replace function app.has_role(role_key text)
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.profile_id = app.current_profile_id()
      and r.key = role_key
  );
$$;

create or replace function app.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select app.has_role('super_admin');
$$;

create or replace function app.can_manage_country(target_country_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select app.is_super_admin()
    or app.has_role('global_admin')
    or exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.profile_id = app.current_profile_id()
        and r.key = 'country_admin'
        and ur.country_id = target_country_id
    );
$$;

create or replace function app.can_manage_dojo(target_dojo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select app.is_super_admin()
    or app.has_role('global_admin')
    or exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      left join public.dojos d on d.id = target_dojo_id
      where ur.profile_id = app.current_profile_id()
        and (
          (r.key = 'dojo_admin' and ur.dojo_id = target_dojo_id)
          or (r.key = 'country_admin' and ur.country_id = d.country_id)
        )
    );
$$;

create or replace function app.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public, app
as $$
  select id from public.members where profile_id = app.current_profile_id() limit 1;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users_profiles', 'media_library', 'countries', 'country_translations',
    'dojos', 'dojo_translations', 'pages', 'page_translations',
    'content_blocks', 'news', 'news_translations', 'events',
    'event_translations', 'members', 'grade_history', 'correction_requests',
    'legacy_content', 'system_settings'
  ]
  loop
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function app.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

create index users_profiles_auth_user_id_idx on public.users_profiles (auth_user_id);
create index user_roles_profile_id_idx on public.user_roles (profile_id);
create index user_roles_country_id_idx on public.user_roles (country_id);
create index user_roles_dojo_id_idx on public.user_roles (dojo_id);
create unique index user_roles_unique_scope_idx
  on public.user_roles (profile_id, role_id, country_id, dojo_id) nulls not distinct;
create index countries_status_public_idx on public.countries (status, is_public);
create index country_translations_language_slug_idx on public.country_translations (language_code, slug);
create index dojos_country_id_idx on public.dojos (country_id);
create index dojos_status_public_idx on public.dojos (status, is_public);
create index dojo_translations_language_slug_idx on public.dojo_translations (language_code, slug);
create index pages_status_idx on public.pages (status);
create index page_translations_language_slug_idx on public.page_translations (language_code, slug);
create index content_blocks_page_order_idx on public.content_blocks (page_id, language_code, sort_order);
create index news_status_published_idx on public.news (status, published_at);
create index news_country_id_idx on public.news (country_id);
create index news_dojo_id_idx on public.news (dojo_id);
create index news_translations_language_slug_idx on public.news_translations (language_code, slug);
create index events_status_starts_idx on public.events (status, starts_at);
create index events_country_id_idx on public.events (country_id);
create index events_dojo_id_idx on public.events (dojo_id);
create index event_translations_language_slug_idx on public.event_translations (language_code, slug);
create index members_profile_id_idx on public.members (profile_id);
create index members_ika_number_idx on public.members (ika_number);
create index members_country_id_idx on public.members (country_id);
create index members_dojo_id_idx on public.members (dojo_id);
create index members_status_idx on public.members (status);
create index grade_history_member_exam_idx on public.grade_history (member_id, exam_date desc);
create index correction_requests_member_status_idx on public.correction_requests (member_id, status);
create index privacy_consents_member_id_idx on public.privacy_consents (member_id);
create index legacy_content_status_idx on public.legacy_content (status);
create index audit_logs_actor_created_idx on public.audit_logs (actor_profile_id, created_at desc);
create index audit_logs_table_record_idx on public.audit_logs (table_name, record_id);

alter table public.users_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.languages enable row level security;
alter table public.media_library enable row level security;
alter table public.countries enable row level security;
alter table public.country_translations enable row level security;
alter table public.dojos enable row level security;
alter table public.dojo_translations enable row level security;
alter table public.pages enable row level security;
alter table public.page_translations enable row level security;
alter table public.content_blocks enable row level security;
alter table public.news enable row level security;
alter table public.news_translations enable row level security;
alter table public.events enable row level security;
alter table public.event_translations enable row level security;
alter table public.members enable row level security;
alter table public.grade_history enable row level security;
alter table public.correction_requests enable row level security;
alter table public.privacy_consents enable row level security;
alter table public.legacy_content enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;

create policy "public can read active languages"
on public.languages for select
using (is_active = true);

create policy "admins can manage languages"
on public.languages for all
using (app.is_super_admin() or app.has_role('global_admin'))
with check (app.is_super_admin() or app.has_role('global_admin'));

create policy "users can read own profile"
on public.users_profiles for select
using (id = app.current_profile_id() or app.is_super_admin() or app.has_role('global_admin'));

create policy "super admins manage profiles"
on public.users_profiles for all
using (app.is_super_admin())
with check (app.is_super_admin());

create policy "admins read roles"
on public.roles for select
using (app.is_super_admin() or app.has_role('global_admin'));

create policy "super admins manage roles"
on public.roles for all
using (app.is_super_admin())
with check (app.is_super_admin());

create policy "admins read permissions"
on public.permissions for select
using (app.is_super_admin() or app.has_role('global_admin'));

create policy "super admins manage permissions"
on public.permissions for all
using (app.is_super_admin())
with check (app.is_super_admin());

create policy "admins read role permissions"
on public.role_permissions for select
using (app.is_super_admin() or app.has_role('global_admin'));

create policy "super admins manage role permissions"
on public.role_permissions for all
using (app.is_super_admin())
with check (app.is_super_admin());

create policy "admins read user roles"
on public.user_roles for select
using (app.is_super_admin() or app.has_role('global_admin'));

create policy "super admins manage user roles"
on public.user_roles for all
using (app.is_super_admin())
with check (app.is_super_admin());

create policy "public can read public media"
on public.media_library for select
using (visibility = 'public' or app.is_super_admin() or app.has_role('global_admin'));

create policy "admins manage media"
on public.media_library for all
using (app.is_super_admin() or app.has_role('global_admin'))
with check (app.is_super_admin() or app.has_role('global_admin'));

create policy "public can read published countries"
on public.countries for select
using ((status = 'published' and is_public = true) or app.is_super_admin() or app.has_role('global_admin') or app.can_manage_country(id));

create policy "scoped admins manage countries"
on public.countries for all
using (app.can_manage_country(id))
with check (app.can_manage_country(id));

create policy "public can read published country translations"
on public.country_translations for select
using (
  exists (
    select 1 from public.countries c
    where c.id = country_id and c.status = 'published' and c.is_public = true
  )
  or app.can_manage_country(country_id)
);

create policy "scoped admins manage country translations"
on public.country_translations for all
using (app.can_manage_country(country_id))
with check (app.can_manage_country(country_id));

create policy "public can read published dojos"
on public.dojos for select
using ((status = 'published' and is_public = true) or app.can_manage_country(country_id) or app.can_manage_dojo(id));

create policy "scoped admins manage dojos"
on public.dojos for all
using (app.can_manage_dojo(id))
with check (app.can_manage_dojo(id));

create policy "public can read published dojo translations"
on public.dojo_translations for select
using (
  exists (
    select 1 from public.dojos d
    where d.id = dojo_id and d.status = 'published' and d.is_public = true
  )
  or app.can_manage_dojo(dojo_id)
);

create policy "scoped admins manage dojo translations"
on public.dojo_translations for all
using (app.can_manage_dojo(dojo_id))
with check (app.can_manage_dojo(dojo_id));

create policy "public can read published pages"
on public.pages for select
using (status = 'published' or app.is_super_admin() or app.has_role('global_admin'));

create policy "global admins manage pages"
on public.pages for all
using (app.is_super_admin() or app.has_role('global_admin'))
with check (app.is_super_admin() or app.has_role('global_admin'));

create policy "public can read published page translations"
on public.page_translations for select
using (
  exists (select 1 from public.pages p where p.id = page_id and p.status = 'published')
  or app.is_super_admin()
  or app.has_role('global_admin')
);

create policy "global admins manage page translations"
on public.page_translations for all
using (app.is_super_admin() or app.has_role('global_admin'))
with check (app.is_super_admin() or app.has_role('global_admin'));

create policy "public can read visible published content blocks"
on public.content_blocks for select
using (
  is_visible = true
  and exists (select 1 from public.pages p where p.id = page_id and p.status = 'published')
  or app.is_super_admin()
  or app.has_role('global_admin')
);

create policy "global admins manage content blocks"
on public.content_blocks for all
using (app.is_super_admin() or app.has_role('global_admin'))
with check (app.is_super_admin() or app.has_role('global_admin'));

create policy "public can read published news"
on public.news for select
using (
  status = 'published'
  or app.is_super_admin()
  or app.has_role('global_admin')
  or (country_id is not null and app.can_manage_country(country_id))
  or (dojo_id is not null and app.can_manage_dojo(dojo_id))
);

create policy "scoped admins manage news"
on public.news for all
using (
  app.is_super_admin()
  or app.has_role('global_admin')
  or (country_id is not null and app.can_manage_country(country_id))
  or (dojo_id is not null and app.can_manage_dojo(dojo_id))
)
with check (
  app.is_super_admin()
  or app.has_role('global_admin')
  or (country_id is not null and app.can_manage_country(country_id))
  or (dojo_id is not null and app.can_manage_dojo(dojo_id))
);

create policy "public can read published news translations"
on public.news_translations for select
using (
  exists (select 1 from public.news n where n.id = news_id and n.status = 'published')
  or app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1 from public.news n
    where n.id = news_id
      and (
        (n.country_id is not null and app.can_manage_country(n.country_id))
        or (n.dojo_id is not null and app.can_manage_dojo(n.dojo_id))
      )
  )
);

create policy "scoped admins manage news translations"
on public.news_translations for all
using (
  app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1 from public.news n
    where n.id = news_id
      and (
        (n.country_id is not null and app.can_manage_country(n.country_id))
        or (n.dojo_id is not null and app.can_manage_dojo(n.dojo_id))
      )
  )
)
with check (
  app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1 from public.news n
    where n.id = news_id
      and (
        (n.country_id is not null and app.can_manage_country(n.country_id))
        or (n.dojo_id is not null and app.can_manage_dojo(n.dojo_id))
      )
  )
);

create policy "public can read published events"
on public.events for select
using (
  status = 'published'
  or app.is_super_admin()
  or app.has_role('global_admin')
  or (country_id is not null and app.can_manage_country(country_id))
  or (dojo_id is not null and app.can_manage_dojo(dojo_id))
);

create policy "scoped admins manage events"
on public.events for all
using (
  app.is_super_admin()
  or app.has_role('global_admin')
  or (country_id is not null and app.can_manage_country(country_id))
  or (dojo_id is not null and app.can_manage_dojo(dojo_id))
)
with check (
  app.is_super_admin()
  or app.has_role('global_admin')
  or (country_id is not null and app.can_manage_country(country_id))
  or (dojo_id is not null and app.can_manage_dojo(dojo_id))
);

create policy "public can read published event translations"
on public.event_translations for select
using (
  exists (select 1 from public.events e where e.id = event_id and e.status = 'published')
  or app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1 from public.events e
    where e.id = event_id
      and (
        (e.country_id is not null and app.can_manage_country(e.country_id))
        or (e.dojo_id is not null and app.can_manage_dojo(e.dojo_id))
      )
  )
);

create policy "scoped admins manage event translations"
on public.event_translations for all
using (
  app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1 from public.events e
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
    select 1 from public.events e
    where e.id = event_id
      and (
        (e.country_id is not null and app.can_manage_country(e.country_id))
        or (e.dojo_id is not null and app.can_manage_dojo(e.dojo_id))
      )
  )
);

create policy "members and scoped admins read members"
on public.members for select
using (
  id = app.current_member_id()
  or app.is_super_admin()
  or app.has_role('global_admin')
  or (country_id is not null and app.can_manage_country(country_id))
  or (dojo_id is not null and app.can_manage_dojo(dojo_id))
);

create policy "scoped admins manage members"
on public.members for all
using (
  app.is_super_admin()
  or app.has_role('global_admin')
  or (country_id is not null and app.can_manage_country(country_id))
  or (dojo_id is not null and app.can_manage_dojo(dojo_id))
)
with check (
  app.is_super_admin()
  or app.has_role('global_admin')
  or (country_id is not null and app.can_manage_country(country_id))
  or (dojo_id is not null and app.can_manage_dojo(dojo_id))
);

create policy "members and scoped admins read grade history"
on public.grade_history for select
using (
  member_id = app.current_member_id()
  or exists (
    select 1 from public.members m
    where m.id = member_id
      and (
        app.is_super_admin()
        or app.has_role('global_admin')
        or (m.country_id is not null and app.can_manage_country(m.country_id))
        or (m.dojo_id is not null and app.can_manage_dojo(m.dojo_id))
      )
  )
);

create policy "scoped admins manage grade history"
on public.grade_history for all
using (
  exists (
    select 1 from public.members m
    where m.id = member_id
      and (
        app.is_super_admin()
        or app.has_role('global_admin')
        or (m.country_id is not null and app.can_manage_country(m.country_id))
        or (m.dojo_id is not null and app.can_manage_dojo(m.dojo_id))
      )
  )
)
with check (
  exists (
    select 1 from public.members m
    where m.id = member_id
      and (
        app.is_super_admin()
        or app.has_role('global_admin')
        or (m.country_id is not null and app.can_manage_country(m.country_id))
        or (m.dojo_id is not null and app.can_manage_dojo(m.dojo_id))
      )
  )
);

create policy "members read own correction requests"
on public.correction_requests for select
using (
  member_id = app.current_member_id()
  or app.is_super_admin()
  or app.has_role('global_admin')
);

create policy "members create own correction requests"
on public.correction_requests for insert
with check (member_id = app.current_member_id());

create policy "admins manage correction requests"
on public.correction_requests for all
using (app.is_super_admin() or app.has_role('global_admin'))
with check (app.is_super_admin() or app.has_role('global_admin'));

create policy "members read own privacy consents"
on public.privacy_consents for select
using (member_id = app.current_member_id() or app.is_super_admin() or app.has_role('global_admin'));

create policy "admins manage privacy consents"
on public.privacy_consents for all
using (app.is_super_admin() or app.has_role('global_admin'))
with check (app.is_super_admin() or app.has_role('global_admin'));

create policy "admins manage legacy content"
on public.legacy_content for all
using (app.is_super_admin() or app.has_role('global_admin'))
with check (app.is_super_admin() or app.has_role('global_admin'));

create policy "super admins read audit logs"
on public.audit_logs for select
using (app.is_super_admin());

create policy "admins create audit logs"
on public.audit_logs for insert
with check (app.current_profile_id() is not null);

create policy "super admins manage system settings"
on public.system_settings for all
using (app.is_super_admin())
with check (app.is_super_admin());

insert into public.languages (code, name, native_name, is_active, is_default, sort_order)
values
  ('en', 'English', 'English', true, true, 1),
  ('es', 'Spanish', 'Español', true, false, 2),
  ('it', 'Italian', 'Italiano', true, false, 3),
  ('fr', 'French', 'Français', true, false, 4),
  ('ja', 'Japanese', '日本語', true, false, 5),
  ('zh', 'Chinese', '中文', true, false, 6),
  ('cs', 'Czech', 'Čeština', true, false, 7);

insert into public.roles (key, name, description)
values
  ('super_admin', 'Super Admin IKA', 'Full platform access.'),
  ('global_admin', 'Global Admin', 'Global content and operational administration.'),
  ('country_admin', 'Country Admin', 'Scoped country administration.'),
  ('dojo_admin', 'Dojo Admin', 'Scoped dojo administration.'),
  ('kenshi', 'Kenshi', 'Private member portal access.');

insert into public.permissions (key, description)
values
  ('cms.manage', 'Manage global CMS content.'),
  ('countries.manage', 'Manage countries.'),
  ('dojos.manage', 'Manage dojos.'),
  ('members.manage', 'Manage members.'),
  ('members.read', 'Read member records.'),
  ('roles.manage', 'Manage roles and permissions.'),
  ('settings.manage', 'Manage critical system settings.'),
  ('audit.read', 'Read audit logs.');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'super_admin';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'cms.manage',
  'countries.manage',
  'dojos.manage',
  'members.manage',
  'members.read',
  'audit.read'
)
where r.key = 'global_admin';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'countries.manage',
  'dojos.manage',
  'members.manage',
  'members.read'
)
where r.key = 'country_admin';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'dojos.manage',
  'members.read'
)
where r.key = 'dojo_admin';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('members.read')
where r.key = 'kenshi';
