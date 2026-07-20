insert into public.official_instructors (
  full_name,
  grade,
  country_name,
  photo_url,
  photo_alt,
  sort_order,
  is_visible
)
select *
from (
  values
    ('T. Mizuno', null, 'Japan', null, 'T. Mizuno', 100, true),
    ('Bazz Smith', null, 'United Kingdom', null, 'Bazz Smith', 200, true),
    ('Alvaro Calvo Pineira', '4 Dan', 'Spain', null, 'Alvaro Calvo Pineira', 300, true)
) as seed(full_name, grade, country_name, photo_url, photo_alt, sort_order, is_visible)
where not exists (
  select 1 from public.official_instructors
);
