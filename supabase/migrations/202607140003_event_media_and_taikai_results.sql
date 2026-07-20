alter table public.events
  add column if not exists cover_image_url text,
  add column if not exists cover_image_alt text,
  add column if not exists taikai_config jsonb not null default '{}'::jsonb;

alter table public.member_achievements
  add column if not exists modality text,
  add column if not exists award text;
