alter table public.official_instructors
add column if not exists chief_note_translations jsonb not null default '{}'::jsonb;

update public.official_instructors
set chief_note_translations =
  case
    when coalesce(chief_note, '') <> '' then jsonb_build_object(
      'es',
      jsonb_build_object('note', chief_note)
    )
    else chief_note_translations
  end
where is_chief_instructor = true
  and coalesce(chief_note, '') <> ''
  and chief_note_translations = '{}'::jsonb;
