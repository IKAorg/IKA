alter table public.official_instructors
add column if not exists country_id uuid references public.countries(id) on delete set null;

create index if not exists official_instructors_country_id_idx
  on public.official_instructors (country_id);

update public.official_instructors oi
set country_id = c.id
from public.countries c
join public.country_translations ct
  on ct.country_id = c.id
where oi.country_id is null
  and lower(trim(oi.country_name)) = lower(trim(ct.name));
