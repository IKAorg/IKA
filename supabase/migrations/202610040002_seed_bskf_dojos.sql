-- Seed the current British Shorinji Kempo Federation branch list.
-- Source: https://www.bskf.org/locations.html#branchlist (accessed 2026-10-04).

with source_dojos (
  id, city, address, website, status, is_public
) as (
  values
    ('a164fd0c-63fe-468a-9d3b-6ddb86e101ae'::uuid, 'Bristol', 'Totterdown Methodist Church Hall, 3a Winton Street, Bristol, BS4 2EG; Windmill Hill City Farm (John James Room), Philip Street, Bedminster, Bristol, BS3 4EA', 'https://bristolshorinjikempo.org/', 'published'::app.content_status, true),
    ('b0e234a0-35da-413d-981b-f63dbf2599e4'::uuid, 'Cambridge', 'Arbury Community Centre, Campkin Road, Cambridge, CB4 2LD', null, 'published'::app.content_status, true),
    ('831378e1-ba39-4a98-8a8f-4f39a9cc75a6'::uuid, 'Edinburgh', 'North Merchiston Club, Watson Crescent, Edinburgh, EH11 1EP', 'https://www.edinburghkempo.com/', 'published'::app.content_status, true),
    ('dead3459-3203-4670-be7b-05c25c465d6f'::uuid, 'Glasgow', 'Dance Glasgow, 37 Ruthven Lane, Glasgow, G12 9BG', null, 'published'::app.content_status, true),
    ('9e33b745-e8ac-4c69-baff-1976f57990b1'::uuid, 'Leeds', 'Burley Lodge Centre, 42-46 Burley Lodge Road, Leeds, LS6 1QF', 'https://shorinjikempoleeds.wordpress.com/', 'published'::app.content_status, true),
    ('ca2053d7-d0c0-4ef2-ab01-5b1acc5f4479'::uuid, 'London', '21 Effra Parade, Brixton, London, SW2 1PX', 'https://www.brixtonshorinjikempo.com/', 'archived'::app.content_status, false),
    ('b860de8e-bd1f-4eb0-a3d3-383a8bd092be'::uuid, 'London', 'Holborn House Community Centre, 35 Emerald Street, London, WC1N 3QW', 'https://camdenkempo.com/', 'published'::app.content_status, true),
    ('54558ba8-ad34-4169-a0e4-0542ce24cafd'::uuid, 'London', 'Chiswick School Sports Hall, Burlington Lane, London, W4 3UN', 'https://www.chiswickkempodojo.co.uk/', 'published'::app.content_status, true),
    ('bdd340d4-2e38-4ccb-bcce-58f895d93d2e'::uuid, 'London', 'Finsbury Leisure Centre, Norman Street, London, EC1V 3PU', 'https://www.citykempo.com/', 'published'::app.content_status, true),
    ('df352ae9-9092-4bac-8cf2-a4efd1904513'::uuid, 'London', 'Qmotion Sport and Fitness, Godward Square, Mile End, London, E1 4FZ', 'https://www.eastlondonkempo.co.uk/', 'published'::app.content_status, true),
    ('b3838cbb-915f-467a-97d6-2d723b3acbe9'::uuid, 'London', 'Beit Quadrangle, Prince Consort Road, South Kensington, London, SW7 2BB', 'https://www.imperialcollegeunion.org/activities/a-to-z/shorinji-kempo', 'published'::app.content_status, true),
    ('4d4abdef-85d5-4e82-87d6-b95a920fdc9d'::uuid, 'London', 'St Marylebone School, Marylebone High Street, London, W1U 5BA', 'https://www.bskfmayfairbranch.com/', 'published'::app.content_status, true),
    ('6ef762a3-08bd-44b4-b0cc-2409aabb92eb'::uuid, 'London', 'SOAS Main Building, Russell Square, London, WC1H 0XG', 'https://soasunion.org/', 'published'::app.content_status, true),
    ('fdec1c74-f067-4588-bb01-c08e274d236f'::uuid, 'London', 'St. John''s Parish Hall, 139 High Path, South Wimbledon, London, SW19 2JX', 'https://www.wimbledonkempo.com/', 'published'::app.content_status, true)
)
insert into public.dojos (id, country_id, city, address, website, status, is_public)
select source_dojos.id, countries.id, source_dojos.city, source_dojos.address,
  source_dojos.website, source_dojos.status, source_dojos.is_public
from source_dojos
join public.countries on countries.code = 'GB'
on conflict (id) do update set
  country_id = excluded.country_id,
  city = excluded.city,
  address = excluded.address,
  website = excluded.website,
  status = excluded.status,
  is_public = excluded.is_public,
  updated_at = now();

with translations (id, dojo_id, language_code, name, slug, description) as (
  values
    ('7d3bad9a-53f8-4d7a-95ce-92857d83312c'::uuid, 'a164fd0c-63fe-468a-9d3b-6ddb86e101ae'::uuid, 'en', 'Bristol Shorinji Kempo', 'bristol-shorinji-kempo', 'Training: Friday 19:00-21:00, Saturday 10:00-12:30 and Monday 18:00-20:00.'),
    ('e3351493-cd91-48ab-8f92-04f37c7b8de9'::uuid, 'b0e234a0-35da-413d-981b-f63dbf2599e4'::uuid, 'en', 'Cambridge Shorinji Kempo', 'cambridge-shorinji-kempo', 'Training: Tuesday 18:30-20:30.'),
    ('b22edd3c-f70a-497d-957a-b449b5f415ee'::uuid, '831378e1-ba39-4a98-8a8f-4f39a9cc75a6'::uuid, 'en', 'Edinburgh Shorinji Kempo', 'edinburgh-shorinji-kempo', 'Training: Thursday 19:30-21:00.'),
    ('c49e4b9d-6333-4fa5-89c1-a9fa140e8fb9'::uuid, 'dead3459-3203-4670-be7b-05c25c465d6f'::uuid, 'en', 'Glasgow Shorinji Kempo', 'glasgow-shorinji-kempo', 'Training: Tuesday 19:15-21:15.'),
    ('4be5a0f0-3779-4f07-8283-e28137d1be5a'::uuid, '9e33b745-e8ac-4c69-baff-1976f57990b1'::uuid, 'en', 'Leeds Shorinji Kempo', 'leeds-shorinji-kempo', 'Training: Wednesday 19:00-21:00.'),
    ('7b90b31c-4419-40db-8199-966987dff3ce'::uuid, 'ca2053d7-d0c0-4ef2-ab01-5b1acc5f4479'::uuid, 'en', 'Brixton Shorinji Kempo', 'brixton-shorinji-kempo', 'Temporarily closed, according to the current BSKF branch list.'),
    ('6256827d-bc5e-4e00-8079-6474c22e7089'::uuid, 'b860de8e-bd1f-4eb0-a3d3-383a8bd092be'::uuid, 'en', 'Camden Shorinji Kempo', 'camden-shorinji-kempo', 'Training: Thursday 19:00-20:30 and Sunday 17:30-19:00.'),
    ('bb019c1c-674a-4405-a45c-495c6d833ddb'::uuid, '54558ba8-ad34-4169-a0e4-0542ce24cafd'::uuid, 'en', 'Chiswick Shorinji Kempo', 'chiswick-shorinji-kempo', 'Training: Monday 19:30-20:30 and Wednesday 19:30-21:00.'),
    ('ca85cd6e-65dd-4507-aa61-7a1b61cee31a'::uuid, 'bdd340d4-2e38-4ccb-bcce-58f895d93d2e'::uuid, 'en', 'City University Shorinji Kempo', 'city-university-shorinji-kempo', 'Training: Tuesday and Thursday 18:00-20:00.'),
    ('0b16e455-39ad-4abf-9bdf-fa95806399a2'::uuid, 'df352ae9-9092-4bac-8cf2-a4efd1904513'::uuid, 'en', 'East London Shorinji Kempo', 'east-london-shorinji-kempo', 'Training: Wednesday 19:00-21:00 and Saturday 12:30-14:00.'),
    ('7112f880-514a-4669-9aa0-efdd2c9f286c'::uuid, 'b3838cbb-915f-467a-97d6-2d723b3acbe9'::uuid, 'en', 'Imperial College Shorinji Kempo', 'imperial-college-shorinji-kempo', 'Training: Wednesday 18:30-20:30 and Saturday 12:00-14:00.'),
    ('5bee5c3f-aba6-4d62-9fc0-cfd1af33d0a0'::uuid, '4d4abdef-85d5-4e82-87d6-b95a920fdc9d'::uuid, 'en', 'Marylebone Shorinji Kempo', 'marylebone-shorinji-kempo', 'Training: Tuesday 19:30-21:00.'),
    ('09b83aa1-87c5-439f-ba80-527232c5f73e'::uuid, '6ef762a3-08bd-44b4-b0cc-2409aabb92eb'::uuid, 'en', 'SOAS Shorinji Kempo', 'soas-shorinji-kempo', 'Training: Friday 19:00-21:30.'),
    ('4174b837-4fdf-433a-a9fc-6b66eb54f928'::uuid, 'fdec1c74-f067-4588-bb01-c08e274d236f'::uuid, 'en', 'South Wimbledon Shorinji Kempo', 'south-wimbledon-shorinji-kempo', 'Training: Monday and Thursday 19:30-21:30.')
)
insert into public.dojo_translations (id, dojo_id, language_code, name, slug, description)
select id, dojo_id, language_code, name, slug, description from translations
on conflict (dojo_id, language_code) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();
