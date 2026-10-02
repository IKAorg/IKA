alter table public.countries
  add column if not exists responsible_entity_type text,
  add column if not exists responsible_website text;

alter table public.countries
  drop constraint if exists countries_responsible_entity_type_check;

alter table public.countries
  add constraint countries_responsible_entity_type_check
  check (
    responsible_entity_type is null
    or responsible_entity_type in ('association', 'dojo', 'club', 'group', 'other')
  );
