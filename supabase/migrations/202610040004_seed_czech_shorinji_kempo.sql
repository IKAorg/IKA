-- Complete the Czech Republic's IKA representation and seed its current dojos.
-- Source: http://shorinjikempo.cz/ (accessed 2026-10-04).

update public.countries
set
  responsible_person = 'Miroslav Ponert Sensei',
  representative_entity = 'SKMP Shorinji Kempo Klub Karlovy Vary z.s.',
  responsible_entity_type = 'club',
  responsible_website = 'http://shorinjikempo.cz/',
  responsible_email = 'miro.ponert@seznam.cz',
  updated_at = now()
where code = 'CZ';

update public.country_translations
set description = case language_code
  when 'es' then 'La República Checa está representada en IKA por SKMP Shorinji Kempo Klub Karlovy Vary z.s., bajo la responsabilidad de Miroslav Ponert Sensei.'
  when 'fr' then 'La République tchèque est représentée au sein de l''IKA par SKMP Shorinji Kempo Klub Karlovy Vary z.s., sous la responsabilité de Miroslav Ponert Sensei.'
  when 'it' then 'La Repubblica Ceca è rappresentata nell''IKA da SKMP Shorinji Kempo Klub Karlovy Vary z.s., sotto la responsabilità di Miroslav Ponert Sensei.'
  when 'cs' then 'Českou republiku v IKA zastupuje SKMP Shorinji Kempo Klub Karlovy Vary z.s. pod vedením Miroslava Ponerta Senseie.'
  else 'The Czech Republic is represented in IKA by SKMP Shorinji Kempo Klub Karlovy Vary z.s., under the responsibility of Miroslav Ponert Sensei.'
end,
updated_at = now()
where country_id = (select id from public.countries where code = 'CZ');

with source_dojos (
  id, city, address, responsible_instructor, email, phone, website
) as (
  values
    (
      'e35d8b0c-7cd8-46de-8791-3e7be1d492a2'::uuid,
      'Karlovy Vary',
      'Budova Městské policie Karlovy Vary, Moskevská 34, Karlovy Vary',
      'Miroslav Ponert Sensei',
      'miro.ponert@seznam.cz',
      '+420 606 604 651',
      'http://shorinjikempo.cz/'
    ),
    (
      '91ff69ba-2c21-4d5c-8e4c-3a06239d234b'::uuid,
      'Praha',
      'Gymnázium Opatov, Konstantinova 1500, Praha 4; vstup do tělocvičny z ulice Křejpského',
      'Miroslav Ponert Sensei',
      'miro.ponert@seznam.cz',
      '+420 606 604 651',
      'http://shorinjikempo.cz/?page_id=844'
    )
)
insert into public.dojos (
  id, country_id, city, address, responsible_instructor, email, phone,
  website, status, is_public
)
select
  source_dojos.id,
  countries.id,
  source_dojos.city,
  source_dojos.address,
  source_dojos.responsible_instructor,
  source_dojos.email,
  source_dojos.phone,
  source_dojos.website,
  'published'::app.content_status,
  true
from source_dojos
join public.countries on countries.code = 'CZ'
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
    '2b34186e-77d9-4d53-b812-a360745a3e7a'::uuid,
    'e35d8b0c-7cd8-46de-8791-3e7be1d492a2'::uuid,
    'cs',
    'Shorinji Kempo Karlovy Vary',
    'shorinji-kempo-karlovy-vary',
    'Tréninky: úterý děti 15:30-16:30 a skupina A 16:45-18:30; čtvrtek přípravka 15:30-16:30 a skupina A 16:45-18:30.'
  ),
  (
    'e3f85439-1cfe-4953-a2c5-c13bc25da811'::uuid,
    'e35d8b0c-7cd8-46de-8791-3e7be1d492a2'::uuid,
    'es',
    'Shorinji Kempo Karlovy Vary',
    'shorinji-kempo-karlovy-vary-es',
    'Entrenamientos: martes, niños de 15:30 a 16:30 y grupo A de 16:45 a 18:30; jueves, iniciación de 15:30 a 16:30 y grupo A de 16:45 a 18:30.'
  ),
  (
    '940e7560-6ecf-4e30-89d7-a741e8e93ccc'::uuid,
    'e35d8b0c-7cd8-46de-8791-3e7be1d492a2'::uuid,
    'en',
    'Shorinji Kempo Karlovy Vary',
    'shorinji-kempo-karlovy-vary-en',
    'Training: Tuesday children 15:30-16:30 and group A 16:45-18:30; Thursday beginners 15:30-16:30 and group A 16:45-18:30.'
  ),
  (
    'e925b6bc-45cb-464b-b19d-478cdaa1c4ca'::uuid,
    '91ff69ba-2c21-4d5c-8e4c-3a06239d234b'::uuid,
    'cs',
    'Shorinji Kempo Praha',
    'shorinji-kempo-praha',
    'Trénink každé pondělí od 18:00. Lekce jsou určeny pro muže, ženy a mládež.'
  ),
  (
    '49414e0f-0e9b-4e7c-9a20-307d11228f3d'::uuid,
    '91ff69ba-2c21-4d5c-8e4c-3a06239d234b'::uuid,
    'es',
    'Shorinji Kempo Praha',
    'shorinji-kempo-praha-es',
    'Entrenamiento todos los lunes desde las 18:00. Clases para hombres, mujeres y jóvenes.'
  ),
  (
    'd48cc513-4443-43df-8cc5-5eb5214b92ee'::uuid,
    '91ff69ba-2c21-4d5c-8e4c-3a06239d234b'::uuid,
    'en',
    'Shorinji Kempo Prague',
    'shorinji-kempo-prague',
    'Training every Monday from 18:00. Classes are open to men, women and young people.'
  )
on conflict (dojo_id, language_code) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();
