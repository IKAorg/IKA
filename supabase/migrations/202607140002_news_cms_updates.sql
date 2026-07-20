alter table public.news
  add column if not exists expires_at timestamptz,
  add column if not exists cover_image_url text,
  add column if not exists cover_image_alt text;
