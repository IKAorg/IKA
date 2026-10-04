-- Add Switzerland's second verified IKA dojo.
-- Sources (accessed 2026-10-04):
-- https://www.kampfkunst-aarau.ch/
-- https://www.kampfkunst-aarau.ch/training/

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
  '56acb8a2-6b6f-4f87-aed9-caf8f333d3ac'::uuid,
  countries.id,
  'Aarau',
  'Rohrerstrasse 80, 5000 Aarau',
  'Jurg Bommer, Ben Bronnimann and Arthur Roscha',
  'info@swisskempo.ch',
  null,
  'https://www.kampfkunst-aarau.ch/',
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
    '8127999a-86b7-40e3-ad04-db41ce69ee23'::uuid,
    '56acb8a2-6b6f-4f87-aed9-caf8f333d3ac'::uuid,
    'en',
    'Kampfkunst Aarau',
    'kampfkunst-aarau',
    'Swiss Kempo and IKA-affiliated dojo. Training takes place on Mondays from 20:00 to 21:30 at Rohrerstrasse 80 in Aarau.'
  ),
  (
    'e6bbf1c8-76ee-4be6-b4c8-2d292ef62709'::uuid,
    '56acb8a2-6b6f-4f87-aed9-caf8f333d3ac'::uuid,
    'es',
    'Kampfkunst Aarau',
    'kampfkunst-aarau-es',
    'Dojo afiliado a Swiss Kempo y a IKA. Entrenamiento los lunes de 20:00 a 21:30 en Rohrerstrasse 80, Aarau.'
  ),
  (
    '17f969cb-b35c-41ba-aea2-d8c17b1ddc2a'::uuid,
    '56acb8a2-6b6f-4f87-aed9-caf8f333d3ac'::uuid,
    'fr',
    'Kampfkunst Aarau',
    'kampfkunst-aarau-fr',
    'Dojo affilié à Swiss Kempo et à l''IKA. Entraînement le lundi de 20h00 à 21h30 à Rohrerstrasse 80, Aarau.'
  ),
  (
    '5e2a9777-83ef-4457-8781-79d35c0db86b'::uuid,
    '56acb8a2-6b6f-4f87-aed9-caf8f333d3ac'::uuid,
    'de',
    'Kampfkunst Aarau',
    'kampfkunst-aarau-de',
    'Swiss Kempo und IKA angeschlossenes Dojo. Training montags von 20:00 bis 21:30 Uhr an der Rohrerstrasse 80 in Aarau.'
  )
on conflict (dojo_id, language_code) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();
