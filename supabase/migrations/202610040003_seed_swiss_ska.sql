-- Complete Switzerland's IKA representation and seed its published SKA dojo.
-- Source: https://www.shorinjikemposka.org/ (accessed 2026-10-04).

update public.countries
set
  responsible_person = 'Bazz Smith Sensei',
  representative_entity = 'Swiss Kempo Association (SKA)',
  responsible_entity_type = 'association',
  responsible_website = 'https://www.shorinjikemposka.org/',
  responsible_email = 'smith.bazz25@gmail.com',
  updated_at = now()
where code = 'CH';

update public.country_translations
set description = case language_code
  when 'es' then 'Suiza está representada en IKA por la Swiss Kempo Association (SKA), bajo la responsabilidad de Bazz Smith Sensei.'
  when 'fr' then 'La Suisse est représentée au sein de l''IKA par la Swiss Kempo Association (SKA), sous la responsabilité de Bazz Smith Sensei.'
  when 'it' then 'La Svizzera è rappresentata nell''IKA dalla Swiss Kempo Association (SKA), sotto la responsabilità di Bazz Smith Sensei.'
  when 'cs' then 'Švýcarsko v IKA zastupuje Swiss Kempo Association (SKA) pod vedením Bazz Smith Senseie.'
  else 'Switzerland is represented in IKA by the Swiss Kempo Association (SKA), under the responsibility of Bazz Smith Sensei.'
end,
updated_at = now()
where country_id = (select id from public.countries where code = 'CH');

insert into public.dojos (
  id,
  country_id,
  city,
  address,
  responsible_instructor,
  email,
  phone,
  website,
  status,
  is_public
)
select
  '2ef8df60-bb52-470e-8d8a-fc20932eec68'::uuid,
  countries.id,
  'Neuchâtel',
  'Salle de gymnastique du CPNE; salle de gymnastique du Collège de la Promenade, Neuchâtel',
  'Bazz Smith Sensei',
  'smith.bazz25@gmail.com',
  '079 589 97 10',
  'https://www.shorinjikemposka.org/',
  'published'::app.content_status,
  true
from public.countries
where countries.code = 'CH'
on conflict (id) do update set
  country_id = excluded.country_id,
  city = excluded.city,
  address = excluded.address,
  responsible_instructor = excluded.responsible_instructor,
  email = excluded.email,
  phone = excluded.phone,
  website = excluded.website,
  status = excluded.status,
  is_public = excluded.is_public,
  updated_at = now();

insert into public.dojo_translations (
  id, dojo_id, language_code, name, slug, description
)
values
  (
    'e929849e-035b-42d5-ac93-11932d0f2430'::uuid,
    '2ef8df60-bb52-470e-8d8a-fc20932eec68'::uuid,
    'en',
    'Shorinji Kempo SKA Neuchâtel',
    'shorinji-kempo-ska-neuchatel',
    'Classes: Monday 20:00-22:00 at the CPNE gymnasium and Saturday 10:00-12:00 at the Collège de la Promenade gymnasium.'
  ),
  (
    '4477b99f-b71c-412e-8829-87d3693b91af'::uuid,
    '2ef8df60-bb52-470e-8d8a-fc20932eec68'::uuid,
    'es',
    'Shorinji Kempo SKA Neuchâtel',
    'shorinji-kempo-ska-neuchatel-es',
    'Clases: lunes de 20:00 a 22:00 en el gimnasio CPNE y sábados de 10:00 a 12:00 en el gimnasio del Collège de la Promenade.'
  ),
  (
    '94dd6e1e-6a60-43e1-a7e3-e70f8f004413'::uuid,
    '2ef8df60-bb52-470e-8d8a-fc20932eec68'::uuid,
    'fr',
    'Shorinji Kempo SKA Neuchâtel',
    'shorinji-kempo-ska-neuchatel-fr',
    'Cours : lundi de 20h00 à 22h00 à la salle de gymnastique du CPNE et samedi de 10h00 à 12h00 à la salle de gymnastique du Collège de la Promenade.'
  )
on conflict (dojo_id, language_code) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();
