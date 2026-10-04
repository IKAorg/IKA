alter table public.countries
  add column if not exists representative_logo_media_id uuid
    references public.media_library(id) on delete set null;

create index if not exists countries_representative_logo_media_id_idx
  on public.countries (representative_logo_media_id)
  where representative_logo_media_id is not null;
