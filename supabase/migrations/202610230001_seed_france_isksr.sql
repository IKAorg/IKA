-- Complete France's associated-member representation and seed the principal
-- clubs published by International Shorinji Kempo Seigido Ryu (ISKSR).
-- Sources (accessed 2026-10-23):
-- https://isksr.org/
-- https://isksr.org/nous-rejoindre/trouver-un-club-isksr/
-- https://isksr.org/federation/bureau-conseil-dadministration/
-- https://isksr.org/federation/commissions-techniques/
-- https://isksr.org/federation/statuts-et-reglements/

insert into public.media_library (
  id, storage_bucket, storage_path, title, alt_text, mime_type, visibility
)
values (
  'fbebf9ba-9b68-401d-84a7-550e9d8e5239'::uuid,
  'public-media',
  'https://secure.gravatar.com/blavatar/bce356352f13d7cd024111be53bcd3ea3405f1d4f2305f68774f96a619a37481?s=512',
  'International Shorinji Kempo Seigido Ryu (ISKSR)',
  'Logo de International Shorinji Kempo Seigido Ryu (ISKSR)',
  'image/jpeg',
  'public'::app.media_visibility
)
on conflict (storage_bucket, storage_path) do update set
  title = excluded.title,
  alt_text = excluded.alt_text,
  mime_type = excluded.mime_type,
  visibility = excluded.visibility,
  updated_at = now();

update public.countries
set
  membership_type = 'associated',
  responsible_person = 'François-Xavier Albertini',
  representative_entity = 'International Shorinji Kempo Seïgido Ryu (ISKSR)',
  responsible_entity_type = 'association',
  responsible_website = 'https://isksr.org/',
  responsible_email = 'isksr@isksr.org',
  representative_logo_media_id = (
    select id
    from public.media_library
    where storage_bucket = 'public-media'
      and storage_path = 'https://secure.gravatar.com/blavatar/bce356352f13d7cd024111be53bcd3ea3405f1d4f2305f68774f96a619a37481?s=512'
  ),
  status = 'published'::app.content_status,
  is_public = true,
  updated_at = now()
where code = 'FR';

insert into public.country_translations (
  country_id, language_code, name, slug, description
)
select
  countries.id,
  languages.code,
  case languages.code
    when 'es' then 'Francia'
    when 'it' then 'Francia'
    when 'cs' then 'Francie'
    when 'de' then 'Frankreich'
    when 'pt' then 'França'
    when 'ja' then 'フランス'
    when 'zh' then '法国'
    when 'eu' then 'Frantzia'
    else 'France'
  end,
  case languages.code
    when 'es' then 'francia'
    when 'it' then 'francia'
    when 'cs' then 'francie'
    when 'de' then 'frankreich'
    when 'pt' then 'franca'
    when 'ja' then 'france-ja'
    when 'zh' then 'france-zh'
    when 'eu' then 'frantzia'
    else 'france'
  end,
  case languages.code
    when 'es' then 'Francia participa en IKA como miembro asociado a través de International Shorinji Kempo Seïgido Ryu (ISKSR), federación fundada en 2000. François-Xavier Albertini es su director técnico internacional e instructor jefe para Francia.'
    when 'fr' then 'La France participe à l''IKA en qualité de membre associé par l''intermédiaire de l''International Shorinji Kempo Seïgido Ryu (ISKSR), fédération fondée en 2000. François-Xavier Albertini en est le directeur technique international et l''instructeur en chef pour la France.'
    when 'it' then 'La Francia partecipa all''IKA come membro associato attraverso l''International Shorinji Kempo Seïgido Ryu (ISKSR), federazione fondata nel 2000. François-Xavier Albertini è il direttore tecnico internazionale e capo istruttore per la Francia.'
    when 'de' then 'Frankreich nimmt über die im Jahr 2000 gegründete International Shorinji Kempo Seïgido Ryu (ISKSR) als assoziiertes Mitglied an der IKA teil. François-Xavier Albertini ist internationaler technischer Direktor und Cheftrainer für Frankreich.'
    when 'pt' then 'A França participa na IKA como membro associado através da International Shorinji Kempo Seïgido Ryu (ISKSR), federação fundada em 2000. François-Xavier Albertini é o diretor técnico internacional e instrutor-chefe em França.'
    when 'cs' then 'Francie se účastní IKA jako přidružený člen prostřednictvím federace International Shorinji Kempo Seïgido Ryu (ISKSR), založené v roce 2000. François-Xavier Albertini je mezinárodním technickým ředitelem a hlavním instruktorem pro Francii.'
    when 'id' then 'Prancis berpartisipasi dalam IKA sebagai anggota asosiasi melalui International Shorinji Kempo Seïgido Ryu (ISKSR), federasi yang didirikan pada tahun 2000. François-Xavier Albertini adalah direktur teknik internasional dan instruktur kepala untuk Prancis.'
    when 'ms' then 'Perancis menyertai IKA sebagai ahli bersekutu melalui International Shorinji Kempo Seïgido Ryu (ISKSR), persekutuan yang ditubuhkan pada tahun 2000. François-Xavier Albertini ialah pengarah teknikal antarabangsa dan ketua pengajar bagi Perancis.'
    when 'ja' then 'フランスは、2000年に設立されたInternational Shorinji Kempo Seïgido Ryu（ISKSR）を通じて、提携会員としてIKAに参加しています。François-Xavier Albertiniが国際技術責任者兼フランス主席指導者を務めています。'
    when 'zh' then '法国通过成立于2000年的International Shorinji Kempo Seïgido Ryu（ISKSR）以准会员身份加入IKA。François-Xavier Albertini担任国际技术总监兼法国总教练。'
    when 'eu' then 'Frantziak IKAko kide elkartu gisa parte hartzen du 2000. urtean sortutako International Shorinji Kempo Seïgido Ryu (ISKSR) federazioaren bidez. François-Xavier Albertini nazioarteko zuzendari teknikoa eta Frantziako instruktore nagusia da.'
    else 'France participates in IKA as an associated member through International Shorinji Kempo Seïgido Ryu (ISKSR), a federation founded in 2000. François-Xavier Albertini is its international technical director and chief instructor for France.'
  end
from public.countries
cross join public.languages
where countries.code = 'FR'
  and languages.is_active = true
on conflict (country_id, language_code) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();

with source_dojos(id, city, name, slug) as (
  values
    ('55888da0-0ce3-46aa-bcc4-fcf1b80beaf3'::uuid, 'Villebon-sur-Yvette (91)', 'Association Villebonnaise Shorinji Kempo Seïgido Ryu', 'association-villebonnaise-shorinji-kempo-seigido-ryu'),
    ('bcaccacc-b67f-4516-94e9-4bd5b7c0570a'::uuid, 'Croissy-sur-Seine (78)', 'Croissy Shorinji Kempo Seïgido Ryu', 'croissy-shorinji-kempo-seigido-ryu'),
    ('c47a9c4e-ced4-423b-8f39-b8b2eb159c7f'::uuid, 'Nersac (16)', 'Dojo Tadashi', 'dojo-tadashi'),
    ('e967c6c0-97f2-4dc5-b1d7-4a4569cbc418'::uuid, 'Saint-Lubin-des-Joncherets (28)', 'Dojo de la Vallée de l''Eure', 'dojo-vallee-eure'),
    ('8ff85aa3-2d95-4ef5-bdda-ae812737b578'::uuid, 'Lognes (77)', 'Lognes SKSR', 'lognes-sksr'),
    ('4b6a15a7-287d-4f53-9fab-b28b7acbad50'::uuid, 'Saint-Gondon (45)', 'Shorinji Kempo Seïgido Ryu Hombu Dojo', 'shorinji-kempo-seigido-ryu-hombu-dojo'),
    ('afe5b8f6-7afd-4ba8-a960-902125a2697d'::uuid, 'La Chapelle-Saint-Mesmin (45)', 'Shorinji Kempo Seïgido Ryu Val de Loire', 'shorinji-kempo-seigido-ryu-val-de-loire'),
    ('6023fc39-8e69-4000-b44c-65c6a8e4de2d'::uuid, 'Orléans (45)', 'Shorinji Kempo Seïgido Ryu Dojo Asahi', 'shorinji-kempo-seigido-ryu-dojo-asahi'),
    ('17848ccb-af4d-4b57-b910-95b061eac826'::uuid, 'Saint-Pathus (77)', 'SKSR Dojo Daruma', 'sksr-dojo-daruma')
)
insert into public.dojos (
  id, country_id, city, website, status, is_public
)
select
  source_dojos.id,
  countries.id,
  source_dojos.city,
  'https://isksr.org/nous-rejoindre/trouver-un-club-isksr/',
  'published'::app.content_status,
  true
from source_dojos
join public.countries on countries.code = 'FR'
on conflict (id) do update set
  country_id = excluded.country_id,
  city = excluded.city,
  website = excluded.website,
  status = excluded.status,
  is_public = excluded.is_public,
  updated_at = now();

with source_dojos(dojo_id, city, name, slug) as (
  values
    ('55888da0-0ce3-46aa-bcc4-fcf1b80beaf3'::uuid, 'Villebon-sur-Yvette', 'Association Villebonnaise Shorinji Kempo Seïgido Ryu', 'association-villebonnaise-shorinji-kempo-seigido-ryu'),
    ('bcaccacc-b67f-4516-94e9-4bd5b7c0570a'::uuid, 'Croissy-sur-Seine', 'Croissy Shorinji Kempo Seïgido Ryu', 'croissy-shorinji-kempo-seigido-ryu'),
    ('c47a9c4e-ced4-423b-8f39-b8b2eb159c7f'::uuid, 'Nersac', 'Dojo Tadashi', 'dojo-tadashi'),
    ('e967c6c0-97f2-4dc5-b1d7-4a4569cbc418'::uuid, 'Saint-Lubin-des-Joncherets', 'Dojo de la Vallée de l''Eure', 'dojo-vallee-eure'),
    ('8ff85aa3-2d95-4ef5-bdda-ae812737b578'::uuid, 'Lognes', 'Lognes SKSR', 'lognes-sksr'),
    ('4b6a15a7-287d-4f53-9fab-b28b7acbad50'::uuid, 'Saint-Gondon', 'Shorinji Kempo Seïgido Ryu Hombu Dojo', 'shorinji-kempo-seigido-ryu-hombu-dojo'),
    ('afe5b8f6-7afd-4ba8-a960-902125a2697d'::uuid, 'La Chapelle-Saint-Mesmin', 'Shorinji Kempo Seïgido Ryu Val de Loire', 'shorinji-kempo-seigido-ryu-val-de-loire'),
    ('6023fc39-8e69-4000-b44c-65c6a8e4de2d'::uuid, 'Orléans', 'Shorinji Kempo Seïgido Ryu Dojo Asahi', 'shorinji-kempo-seigido-ryu-dojo-asahi'),
    ('17848ccb-af4d-4b57-b910-95b061eac826'::uuid, 'Saint-Pathus', 'SKSR Dojo Daruma', 'sksr-dojo-daruma')
)
insert into public.dojo_translations (
  dojo_id, language_code, name, slug, description
)
select
  source_dojos.dojo_id,
  languages.code,
  source_dojos.name,
  source_dojos.slug,
  case languages.code
    when 'es' then source_dojos.name || ' es uno de los clubes principales publicados por ISKSR en ' || source_dojos.city || ', Francia.'
    when 'fr' then source_dojos.name || ' fait partie des principaux clubs publiés par l''ISKSR à ' || source_dojos.city || ', en France.'
    when 'it' then source_dojos.name || ' è uno dei club principali pubblicati da ISKSR a ' || source_dojos.city || ', Francia.'
    when 'de' then source_dojos.name || ' gehört zu den von ISKSR veröffentlichten Hauptvereinen in ' || source_dojos.city || ', Frankreich.'
    when 'pt' then source_dojos.name || ' é um dos principais clubes publicados pela ISKSR em ' || source_dojos.city || ', França.'
    when 'cs' then source_dojos.name || ' patří mezi hlavní kluby zveřejněné ISKSR ve městě ' || source_dojos.city || ' ve Francii.'
    when 'id' then source_dojos.name || ' adalah salah satu klub utama yang diterbitkan ISKSR di ' || source_dojos.city || ', Prancis.'
    when 'ms' then source_dojos.name || ' ialah salah satu kelab utama yang diterbitkan oleh ISKSR di ' || source_dojos.city || ', Perancis.'
    when 'ja' then source_dojos.name || 'は、フランスの' || source_dojos.city || 'にあるISKSR公式掲載の主要クラブです。'
    when 'zh' then source_dojos.name || '是ISKSR公布的法国' || source_dojos.city || '主要俱乐部之一。'
    when 'eu' then source_dojos.name || ' ISKSRk ' || source_dojos.city || ' hirian, Frantzian, argitaratutako klub nagusietako bat da.'
    else source_dojos.name || ' is one of the principal clubs published by ISKSR in ' || source_dojos.city || ', France.'
  end
from source_dojos
cross join public.languages
where languages.is_active = true
on conflict (dojo_id, language_code) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();
