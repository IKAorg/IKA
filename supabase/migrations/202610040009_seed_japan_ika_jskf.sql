-- Complete Japan's IKA representation and seed the three training locations
-- published by the Japan Selfdefence Kempo Federation (JSKF).
-- Sources (accessed 2026-10-04):
-- https://jskfgogokempo2015.jimdoweb.com/
-- https://jskfgogokempo2015.jimdoweb.com/ｉ-ｋ-ａ-ｊａｐａｎ/
-- https://jskfgogokempo2015.jimdoweb.com/支部紹介/
-- https://www.city.minamiawaji.hyogo.jp/uploaded/attachment/323880.pdf
-- https://www.city.minamiawaji.hyogo.jp/map/shisetsu-049.html

update public.countries
set
  responsible_person = 'Yuki Kawamura (川村 友喜)',
  representative_entity = 'IKA Japan / Japan Selfdefence Kempo Federation (JSKF)',
  responsible_entity_type = 'association',
  responsible_website = 'https://jskfgogokempo2015.jimdoweb.com/',
  responsible_email = null,
  updated_at = now()
where code = 'JP';

update public.country_translations
set
  description = case language_code
    when 'es' then 'Japón está representado por IKA Japan, la rama nacional de la International Kempo Association. Su organización principal es la Japan Selfdefence Kempo Federation (JSKF, 一般社団法人 日本護身拳法連盟), fundada el 1 de abril de 2015 e incorporada como asociación general el 24 de mayo de 2016. Está presidida por Yuki Kawamura y se dedica a la defensa personal, la formación del carácter, la salud y el intercambio internacional.'
    when 'ja' then '日本は国際拳法協会の国内支部であるIKA Japanによって代表されています。中心団体は一般社団法人日本護身拳法連盟（JSKF）で、2015年4月1日に設立され、2016年5月24日に一般社団法人として登記されました。代表は川村友喜氏で、護身技術、人格形成、健康増進、国際交流を目的として活動しています。'
    when 'fr' then 'Le Japon est représenté par IKA Japan, branche nationale de l''International Kempo Association. Son organisation principale est la Japan Selfdefence Kempo Federation (JSKF), fondée le 1er avril 2015 et constituée en association générale le 24 mai 2016. Elle est présidée par Yuki Kawamura.'
    when 'it' then 'Il Giappone è rappresentato da IKA Japan, ramo nazionale dell''International Kempo Association. La sua organizzazione principale è la Japan Selfdefence Kempo Federation (JSKF), fondata il 1º aprile 2015 e costituita come associazione generale il 24 maggio 2016. È presieduta da Yuki Kawamura.'
    when 'de' then 'Japan wird durch IKA Japan, den nationalen Zweig der International Kempo Association, vertreten. Die wichtigste Organisation ist die Japan Selfdefence Kempo Federation (JSKF), gegründet am 1. April 2015 und am 24. Mai 2016 als allgemeiner Verband eingetragen. Präsident ist Yuki Kawamura.'
    when 'pt' then 'O Japão é representado pela IKA Japan, filial nacional da International Kempo Association. A sua principal organização é a Japan Selfdefence Kempo Federation (JSKF), fundada em 1 de abril de 2015 e constituída como associação geral em 24 de maio de 2016. É presidida por Yuki Kawamura.'
    when 'id' then 'Jepang diwakili oleh IKA Japan, cabang nasional International Kempo Association. Organisasi utamanya adalah Japan Selfdefence Kempo Federation (JSKF), didirikan pada 1 April 2015 dan berbadan hukum asosiasi umum pada 24 Mei 2016. Organisasi ini dipimpin oleh Yuki Kawamura.'
    when 'ms' then 'Jepun diwakili oleh IKA Japan, cawangan kebangsaan International Kempo Association. Organisasi utamanya ialah Japan Selfdefence Kempo Federation (JSKF), ditubuhkan pada 1 April 2015 dan diperbadankan sebagai persatuan am pada 24 Mei 2016. Ia dipimpin oleh Yuki Kawamura.'
    when 'zh' then '日本由国际拳法协会的日本分会IKA Japan代表。其主要组织是日本护身拳法联盟（JSKF），成立于2015年4月1日，并于2016年5月24日注册为一般社团法人，由川村友喜担任代表。'
    when 'cs' then 'Japonsko zastupuje IKA Japan, národní pobočka International Kempo Association. Hlavní organizací je Japan Selfdefence Kempo Federation (JSKF), založená 1. dubna 2015 a zapsaná jako obecné sdružení 24. května 2016. Vede ji Yuki Kawamura.'
    when 'eu' then 'Japonia IKA Japanek ordezkatzen du, International Kempo Association erakundearen adar nazionalak. Erakunde nagusia Japan Selfdefence Kempo Federation (JSKF) da; 2015eko apirilaren 1ean sortu eta 2016ko maiatzaren 24an elkarte orokor gisa erregistratu zen. Yuki Kawamura da presidentea.'
    else 'Japan is represented by IKA Japan, the national branch of the International Kempo Association. Its principal organization is the Japan Selfdefence Kempo Federation (JSKF), founded on 1 April 2015 and incorporated as a general association on 24 May 2016. It is led by Yuki Kawamura.'
  end,
  updated_at = now()
where country_id = (select id from public.countries where code = 'JP');

insert into public.dojos (
  id, country_id, city, address, responsible_instructor, phone, website, status, is_public
)
select values_to_insert.id, countries.id, values_to_insert.city,
  values_to_insert.address, values_to_insert.instructor, values_to_insert.phone,
  'https://jskfgogokempo2015.jimdoweb.com/支部紹介/',
  'published'::app.content_status, true
from public.countries
cross join (values
  (
    '8611e500-c1a4-46e5-9887-7e8f39cc84a6'::uuid,
    'Nagoya, Aichi',
    'Higashi-Nagoya, Nagoya, Aichi',
    'Hidetoshi Tomita (冨田 英俊)',
    '090-9196-9848'
  ),
  (
    '45668517-0a1a-4f80-87a2-7cf342b18d32'::uuid,
    'Minamiawaji, Hyogo',
    'Kita-Ama, Minamiawaji, Hyogo',
    'Toshiharu Imai (今井 敏治)',
    '080-4075-7511'
  ),
  (
    '2bb1334d-c8f0-4580-86bd-c80486174935'::uuid,
    'Minamiawaji, Hyogo',
    'Matsuho Community Center, Matsuho Takaya Hei 100-1, 656-0315 Minamiawaji, Hyogo',
    'Toshiharu Imai (今井 敏治)',
    '080-4075-7511'
  )
) as values_to_insert(id, city, address, instructor, phone)
where countries.code = 'JP'
on conflict (id) do update set
  country_id = excluded.country_id,
  city = excluded.city,
  address = excluded.address,
  responsible_instructor = excluded.responsible_instructor,
  phone = excluded.phone,
  website = excluded.website,
  status = excluded.status,
  is_public = excluded.is_public,
  updated_at = now();

with dojo_source(dojo_id, name_en, name_ja, slug_base, description_en, description_es, description_ja) as (
  values
    (
      '8611e500-c1a4-46e5-9887-7e8f39cc84a6'::uuid,
      'JSKF Higashi-Nagoya Branch',
      '日本護身拳法連盟 東名古屋支部',
      'jskf-higashi-nagoya',
      'The Higashi-Nagoya branch published by JSKF, led by Hidetoshi Tomita.',
      'Rama Higashi-Nagoya publicada por JSKF y dirigida por Hidetoshi Tomita.',
      'JSKFが公開している東名古屋支部。支部長は冨田英俊氏です。'
    ),
    (
      '45668517-0a1a-4f80-87a2-7cf342b18d32'::uuid,
      'JSKF Kita-Ama Dojo',
      '日本護身拳法連盟 北阿万道場',
      'jskf-kita-ama-dojo',
      'Kita-Ama Dojo of the JSKF Hyogo Minamiawaji Branch, led by Toshiharu Imai.',
      'Dojo Kita-Ama de la rama JSKF Hyogo Minamiawaji, dirigido por Toshiharu Imai.',
      'JSKF兵庫南あわじ支部の北阿万道場。支部長は今井敏治氏です。'
    ),
    (
      '2bb1334d-c8f0-4580-86bd-c80486174935'::uuid,
      'Awaji Self-Defence Club - Matsuho Dojo',
      'あわじ護身術クラブ 松帆道場',
      'jskf-matsuho-dojo',
      'Active JSKF Hyogo Minamiawaji training location at Matsuho Community Center. Current municipal information lists sessions on the first, third and fourth Fridays from 19:00 to 21:00 and Saturdays from 10:00 to 13:00.',
      'Centro activo de la rama JSKF Hyogo Minamiawaji en el Matsuho Community Center. La información municipal vigente indica clases el primer, tercer y cuarto viernes de 19:00 a 21:00 y los sábados de 10:00 a 13:00.',
      '松帆活性化センターで活動するJSKF兵庫南あわじ支部の稽古場所です。市の最新情報では、第1・第3・第4金曜日19:00～21:00、土曜日10:00～13:00に活動しています。'
    )
)
insert into public.dojo_translations (dojo_id, language_code, name, slug, description)
select
  dojo_source.dojo_id,
  languages.code,
  case when languages.code = 'ja' then dojo_source.name_ja else dojo_source.name_en end,
  dojo_source.slug_base,
  case languages.code
    when 'es' then dojo_source.description_es
    when 'ja' then dojo_source.description_ja
    else dojo_source.description_en
  end
from dojo_source
cross join public.languages
where languages.is_active = true
on conflict (dojo_id, language_code) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();
