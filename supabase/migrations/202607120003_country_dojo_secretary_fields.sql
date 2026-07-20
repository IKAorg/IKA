alter table public.countries
add column if not exists representative_entity text;

alter table public.dojos
add column if not exists responsible_instructor_media_id uuid references public.media_library(id) on delete set null;
