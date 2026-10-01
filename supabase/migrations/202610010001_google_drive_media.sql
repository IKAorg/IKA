create table if not exists public.google_drive_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'google_drive' unique,
  account_email text,
  encrypted_refresh_token text not null,
  token_iv text not null,
  token_auth_tag text not null,
  root_folder_id text not null,
  folder_map jsonb not null default '{}'::jsonb,
  connected_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drive_media_assets (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text unique,
  drive_folder_id text,
  category text not null,
  visibility text not null check (visibility in ('public', 'private')),
  member_id uuid references public.members(id) on delete set null,
  file_name text not null,
  mime_type text not null default 'image/webp',
  byte_size bigint,
  width integer,
  height integer,
  etag text,
  source_url text,
  source_key text not null unique,
  migration_status text not null default 'pending'
    check (migration_status in ('pending', 'copied', 'verified', 'switched', 'failed')),
  error_message text,
  created_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drive_media_assets_drive_file_idx
  on public.drive_media_assets (drive_file_id);
create index if not exists drive_media_assets_migration_idx
  on public.drive_media_assets (migration_status, created_at);
create index if not exists drive_media_assets_member_idx
  on public.drive_media_assets (member_id, created_at desc)
  where member_id is not null;
create index if not exists drive_media_assets_category_idx
  on public.drive_media_assets (category, visibility, created_at desc);

alter table public.google_drive_connections enable row level security;
alter table public.drive_media_assets enable row level security;

revoke all on table public.google_drive_connections from anon, authenticated;
revoke all on table public.drive_media_assets from anon, authenticated;

drop trigger if exists google_drive_connections_updated_at on public.google_drive_connections;
create trigger google_drive_connections_updated_at
before update on public.google_drive_connections
for each row execute function app.set_updated_at();

drop trigger if exists drive_media_assets_updated_at on public.drive_media_assets;
create trigger drive_media_assets_updated_at
before update on public.drive_media_assets
for each row execute function app.set_updated_at();

