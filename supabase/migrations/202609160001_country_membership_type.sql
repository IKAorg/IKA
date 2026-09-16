alter table public.countries
  add column if not exists membership_type text not null default 'official';

alter table public.countries
  drop constraint if exists countries_membership_type_check;

alter table public.countries
  add constraint countries_membership_type_check
  check (membership_type in ('official', 'associated'));

alter table public.countries
  drop column if exists ika_country_id;

alter table public.countries
  add column ika_country_id text generated always as (
    case
      when membership_type = 'official' then
        'IKA-COUNTRY-' ||
        upper(regexp_replace(code, '[^A-Za-z0-9]+', '', 'g')) ||
        '-' ||
        lpad(member_sequence::text, 4, '0')
      else null
    end
  ) stored;

drop index if exists countries_ika_country_id_idx;

create unique index if not exists countries_ika_country_id_idx
  on public.countries (ika_country_id)
  where ika_country_id is not null;

insert into public.countries (code, status, is_public, membership_type)
values ('FR', 'published', true, 'associated')
on conflict (code) do update
set
  status = excluded.status,
  is_public = excluded.is_public,
  membership_type = excluded.membership_type;

update public.countries
set membership_type = 'associated'
where code in ('CR', 'MY', 'FR');

with france as (
  select id from public.countries where code = 'FR'
),
translations(language_code, name, slug) as (
  values
    ('en', 'France', 'france'),
    ('es', 'Francia', 'francia'),
    ('it', 'Francia', 'francia'),
    ('fr', 'France', 'france'),
    ('ja', 'France', 'france'),
    ('zh', 'France', 'france'),
    ('cs', 'Francie', 'francie'),
    ('id', 'Prancis', 'prancis'),
    ('ms', 'Perancis', 'perancis'),
    ('eu', 'Frantzia', 'frantzia'),
    ('pt', 'Franca', 'franca'),
    ('de', 'Frankreich', 'frankreich')
)
insert into public.country_translations (
  country_id,
  language_code,
  name,
  slug,
  description
)
select france.id, translations.language_code, translations.name, translations.slug, null
from france
cross join translations
on conflict (country_id, language_code) do update
set
  name = excluded.name,
  slug = excluded.slug;
