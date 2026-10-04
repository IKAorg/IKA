-- Complete Indonesia's national FKI information and add the publicly verified
-- FKI dojo in Kendari. FKI publishes 23 provincial boards, but does not publish
-- a complete dojo directory, so provincial organizations are not counted as dojos.
-- Sources (accessed 2026-10-04):
-- https://fki.or.id/about/
-- https://fki.or.id/contact/
-- https://fki.or.id/pusat/
-- https://fki.or.id/provinsi/
-- https://kumparan.com/lapas-kendari/dojo-lapas-kendari-gelar-latihan-kempo-perdana-1zrOFDrX1xp

update public.countries
set
  responsible_person = 'Prof. Yasonna H. Laoly',
  representative_entity = 'Federasi Kempo Indonesia (FKI)',
  responsible_entity_type = 'association',
  responsible_website = 'https://fki.or.id/',
  responsible_email = 'sekretariat@fki.or.id',
  updated_at = now()
where code = 'ID';

update public.country_translations
set
  description = case language_code
    when 'es' then 'Indonesia está representada por la Federasi Kempo Indonesia (FKI), organización nacional fundada el 10 de noviembre de 2018. FKI publica una red territorial de 23 delegaciones provinciales: Aceh, Bali, Banten, DKI Jakarta, Jambi, Jawa Barat, Jawa Tengah, Jawa Timur, Kalimantan Tengah, Kalimantan Timur, Kepulauan Riau, Lampung, Maluku Utara, Nusa Tenggara Barat, Nusa Tenggara Timur, Papua, Riau, Sulawesi Selatan, Sulawesi Tengah, Sulawesi Tenggara, Sumatera Barat, Sumatera Selatan y Sumatera Utara.'
    when 'id' then 'Indonesia diwakili oleh Federasi Kempo Indonesia (FKI), organisasi olahraga Kempo nasional yang didirikan pada 10 November 2018. FKI mencantumkan jaringan 23 Pengurus Provinsi: Aceh, Bali, Banten, DKI Jakarta, Jambi, Jawa Barat, Jawa Tengah, Jawa Timur, Kalimantan Tengah, Kalimantan Timur, Kepulauan Riau, Lampung, Maluku Utara, Nusa Tenggara Barat, Nusa Tenggara Timur, Papua, Riau, Sulawesi Selatan, Sulawesi Tengah, Sulawesi Tenggara, Sumatera Barat, Sumatera Selatan, dan Sumatera Utara.'
    when 'fr' then 'L''Indonésie est représentée par la Federasi Kempo Indonesia (FKI), organisation nationale fondée le 10 novembre 2018. La FKI publie un réseau territorial de 23 organisations provinciales.'
    when 'it' then 'L''Indonesia è rappresentata dalla Federasi Kempo Indonesia (FKI), organizzazione nazionale fondata il 10 novembre 2018. La FKI pubblica una rete territoriale di 23 organizzazioni provinciali.'
    when 'de' then 'Indonesien wird von der Federasi Kempo Indonesia (FKI) vertreten, einem am 10. November 2018 gegründeten nationalen Verband. Die FKI veröffentlicht ein Netzwerk von 23 Provinzorganisationen.'
    when 'pt' then 'A Indonésia é representada pela Federasi Kempo Indonesia (FKI), organização nacional fundada em 10 de novembro de 2018. A FKI publica uma rede territorial de 23 organizações provinciais.'
    when 'ms' then 'Indonesia diwakili oleh Federasi Kempo Indonesia (FKI), organisasi kebangsaan yang ditubuhkan pada 10 November 2018. FKI menyenaraikan rangkaian 23 organisasi wilayah.'
    when 'ja' then 'インドネシアは、2018年11月10日に設立された全国組織Federasi Kempo Indonesia（FKI）が代表しています。FKIは23の州組織からなる地域ネットワークを公開しています。'
    when 'zh' then '印度尼西亚由成立于2018年11月10日的全国性组织印度尼西亚拳法联合会（FKI）代表。FKI公布了由23个省级组织组成的地区网络。'
    when 'cs' then 'Indonésii zastupuje Federasi Kempo Indonesia (FKI), národní organizace založená 10. listopadu 2018. FKI zveřejňuje územní síť 23 provinčních organizací.'
    when 'eu' then 'Indonesia Federasi Kempo Indonesia (FKI) erakunde nazionalak ordezkatzen du; 2018ko azaroaren 10ean sortu zen. FKIk 23 probintzia-erakundeko lurralde-sarea argitaratzen du.'
    else 'Indonesia is represented by Federasi Kempo Indonesia (FKI), a national organization founded on 10 November 2018. FKI publishes a territorial network of 23 provincial organizations.'
  end,
  updated_at = now()
where country_id = (select id from public.countries where code = 'ID');

insert into public.dojos (
  id,
  country_id,
  city,
  address,
  responsible_instructor,
  website,
  status,
  is_public
)
select
  '1a02dd46-b9f1-498d-90e4-13da790d47fd'::uuid,
  countries.id,
  'Kendari, Sulawesi Tenggara',
  'Lembaga Pemasyarakatan Kelas IIA Kendari, Kendari, Sulawesi Tenggara',
  'Nasruddin',
  'https://fki.or.id/',
  'published'::app.content_status,
  true
from public.countries
where countries.code = 'ID'
on conflict (id) do update set
  country_id = excluded.country_id,
  city = excluded.city,
  address = excluded.address,
  responsible_instructor = excluded.responsible_instructor,
  website = excluded.website,
  status = excluded.status,
  is_public = excluded.is_public,
  updated_at = now();

insert into public.dojo_translations (dojo_id, language_code, name, slug, description)
select
  '1a02dd46-b9f1-498d-90e4-13da790d47fd'::uuid,
  languages.code,
  'Dojo Lapas Kelas IIA Kendari',
  'dojo-lapas-kelas-iia-kendari',
  case languages.code
    when 'es' then 'Dojo vinculado a FKI Sulawesi Tenggara e inaugurado en 2023 para el entrenamiento regular de personal penitenciario y participantes de la comunidad. Nasruddin, presidente provincial de FKI Sulawesi Tenggara, figura como entrenador responsable.'
    when 'id' then 'Dojo yang didukung FKI Sulawesi Tenggara dan dibuka pada tahun 2023 untuk latihan rutin petugas pemasyarakatan serta peserta umum. Nasruddin, Ketua FKI Sulawesi Tenggara, tercatat sebagai pelatih.'
    when 'fr' then 'Dojo lié à la FKI Sulawesi Tenggara, ouvert en 2023 pour l''entraînement régulier du personnel pénitentiaire et de participants extérieurs. Nasruddin, président provincial de la FKI, est l''entraîneur responsable.'
    when 'it' then 'Dojo collegato alla FKI Sulawesi Tenggara, aperto nel 2023 per l''allenamento regolare del personale penitenziario e di partecipanti esterni. Il responsabile tecnico è Nasruddin, presidente provinciale FKI.'
    when 'de' then 'Mit FKI Sulawesi Tenggara verbundenes Dojo, das 2023 für das regelmäßige Training von Justizvollzugspersonal und externen Teilnehmern eröffnet wurde. Verantwortlicher Trainer ist FKI-Provinzvorsitzender Nasruddin.'
    when 'pt' then 'Dojo ligado à FKI Sulawesi Tenggara, aberto em 2023 para treino regular de funcionários penitenciários e participantes da comunidade. O treinador responsável é Nasruddin, presidente provincial da FKI.'
    when 'ms' then 'Dojo yang disokong oleh FKI Sulawesi Tenggara dan dibuka pada 2023 untuk latihan tetap kakitangan penjara serta peserta awam. Nasruddin, pengerusi wilayah FKI, ialah jurulatih yang bertanggungjawab.'
    when 'ja' then 'FKI南東スラウェシと提携し、刑務所職員および一般参加者の定期稽古のために2023年に開設された道場です。州FKI会長のNasruddinが責任指導者です。'
    when 'zh' then '该道场隶属于东南苏拉威西FKI，于2023年成立，为监狱工作人员及社会参与者提供定期训练。省级FKI主席Nasruddin担任负责人。'
    when 'cs' then 'Dódžó napojené na FKI Sulawesi Tenggara bylo otevřeno v roce 2023 pro pravidelný trénink vězeňského personálu i účastníků z veřejnosti. Odpovědným trenérem je provinční předseda FKI Nasruddin.'
    when 'eu' then 'FKI Sulawesi Tenggarari lotutako dojoa 2023an ireki zen espetxeetako langileen eta komunitateko parte-hartzaileen ohiko entrenamendurako. Nasruddin FKIko probintzia-presidentea da entrenatzaile arduraduna.'
    else 'A dojo linked to FKI Sulawesi Tenggara, opened in 2023 for regular training by prison staff and community participants. Provincial FKI chair Nasruddin is the responsible instructor.'
  end
from public.languages
where languages.is_active = true
on conflict (dojo_id, language_code) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();
