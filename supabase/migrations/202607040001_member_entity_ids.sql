create sequence if not exists public.countries_member_sequence_seq;
create sequence if not exists public.dojos_member_sequence_seq;

alter table public.countries
  add column if not exists member_sequence bigint unique
    default nextval('public.countries_member_sequence_seq'),
  add column if not exists membership_type text not null default 'official',
  add column if not exists ika_country_id text generated always as (
    case
      when membership_type = 'official' then
        'IKA-COUNTRY-' ||
        upper(regexp_replace(code, '[^A-Za-z0-9]+', '', 'g')) ||
        '-' ||
        lpad(member_sequence::text, 4, '0')
      else null
    end
  ) stored;

alter table public.countries
  drop constraint if exists countries_membership_type_check;

alter table public.countries
  add constraint countries_membership_type_check
  check (membership_type in ('official', 'associated'));

alter table public.dojos
  add column if not exists member_sequence bigint unique
    default nextval('public.dojos_member_sequence_seq'),
  add column if not exists ika_dojo_id text generated always as (
    'IKA-DOJO-' || lpad(member_sequence::text, 6, '0')
  ) stored;

create unique index if not exists countries_ika_country_id_idx
  on public.countries (ika_country_id)
  where ika_country_id is not null;

create unique index if not exists dojos_ika_dojo_id_idx
  on public.dojos (ika_dojo_id);
