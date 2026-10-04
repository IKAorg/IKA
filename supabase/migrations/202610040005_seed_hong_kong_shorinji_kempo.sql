-- Complete Hong Kong's IKA representation and seed its published dojo.
-- Sources: https://www.facebook.com/hongkongkempo/ and
-- https://www.hongkongkempo.com/ (accessed 2026-10-04).

update public.countries
set
  responsible_person = 'Felix Lee / Will Ng',
  representative_entity = 'Hong Kong Shorinji Kempo Federation',
  responsible_entity_type = 'association',
  responsible_website = 'https://www.hongkongkempo.com/',
  responsible_email = 'hk.shorinjikempo@gmail.com',
  updated_at = now()
where code = 'HK';

update public.country_translations
set description = case language_code
  when 'es' then 'Hong Kong está representado en IKA por la Hong Kong Shorinji Kempo Federation, fundada por Felix Lee y Will Ng.'
  when 'fr' then 'Hong Kong est représenté au sein de l''IKA par la Hong Kong Shorinji Kempo Federation, fondée par Felix Lee et Will Ng.'
  when 'it' then 'Hong Kong è rappresentata nell''IKA dalla Hong Kong Shorinji Kempo Federation, fondata da Felix Lee e Will Ng.'
  when 'cs' then 'Hongkong v IKA zastupuje Hong Kong Shorinji Kempo Federation, kterou založili Felix Lee a Will Ng.'
  else 'Hong Kong is represented in IKA by the Hong Kong Shorinji Kempo Federation, founded by Felix Lee and Will Ng.'
end,
updated_at = now()
where country_id = (select id from public.countries where code = 'HK');

insert into public.dojos (
  id,
  country_id,
  city,
  address,
  responsible_instructor,
  email,
  website,
  status,
  is_public
)
select
  '6684f456-17fb-441b-8e61-4a4df29bebea'::uuid,
  countries.id,
  'Aberdeen, Hong Kong',
  '13/F Unit A, Kwai Bo Industrial Building, 40 Wong Chuk Hang Road, Aberdeen, Hong Kong; 13A 貴寶工業大廈, 黃竹坑道40號, 香港仔',
  'Felix Lee / Will Ng',
  'hk.shorinjikempo@gmail.com',
  'https://www.hongkongkempo.com/',
  'published'::app.content_status,
  true
from public.countries
where countries.code = 'HK'
on conflict (id) do update set
  country_id = excluded.country_id,
  city = excluded.city,
  address = excluded.address,
  responsible_instructor = excluded.responsible_instructor,
  email = excluded.email,
  website = excluded.website,
  status = excluded.status,
  is_public = excluded.is_public,
  updated_at = now();

insert into public.dojo_translations (
  id, dojo_id, language_code, name, slug, description
)
values
  (
    '7c261b40-36ad-47fc-86dd-24f467b353e4'::uuid,
    '6684f456-17fb-441b-8e61-4a4df29bebea'::uuid,
    'en',
    'Hong Kong Shorinji Kempo',
    'hong-kong-shorinji-kempo',
    'Training every Tuesday from 19:30 to 21:30. The dojo is less than five minutes from Wong Chuk Hang MTR station, Exit B.'
  ),
  (
    '924e0d73-0e05-46b1-855e-a2da9cbf88f9'::uuid,
    '6684f456-17fb-441b-8e61-4a4df29bebea'::uuid,
    'es',
    'Hong Kong Shorinji Kempo',
    'hong-kong-shorinji-kempo-es',
    'Entrenamiento todos los martes de 19:30 a 21:30. El dojo está a menos de cinco minutos de la estación MTR Wong Chuk Hang, salida B.'
  ),
  (
    'e9e7b6ec-7b42-4252-be9f-fbbe8153e4df'::uuid,
    '6684f456-17fb-441b-8e61-4a4df29bebea'::uuid,
    'zh',
    '香港少林寺拳法總會',
    'hong-kong-shorinji-kempo-zh',
    '逢星期二晚上 7:30 至 9:30 訓練。道場距離黃竹坑港鐵站 B 出口步行少於五分鐘。'
  )
on conflict (dojo_id, language_code) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();
