alter table public.grade_history
  add column if not exists course_reference_id text,
  add column if not exists course_fingerprint text;

create or replace function public.generate_course_reference_id()
returns text
language sql
as $$
  select 'CRS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

create or replace function public.build_course_fingerprint(
  p_source_event_id uuid,
  p_course_type text,
  p_grade text,
  p_exam_date date,
  p_exam_place text
)
returns text
language sql
immutable
as $$
  select case
    when p_source_event_id is not null then 'event:' || p_source_event_id::text
    else concat_ws(
      '|',
      coalesce(lower(trim(p_course_type)), 'course'),
      coalesce(lower(trim(p_grade)), ''),
      coalesce(p_exam_date::text, ''),
      coalesce(lower(trim(p_exam_place)), '')
    )
  end;
$$;

create or replace function public.sync_grade_history_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.course_reference_id is null or btrim(new.course_reference_id) = '' then
    new.course_reference_id := public.generate_course_reference_id();
  end if;

  new.course_fingerprint := public.build_course_fingerprint(
    new.source_event_id,
    new.course_type,
    new.grade,
    new.exam_date,
    new.exam_place
  );

  return new;
end;
$$;

update public.grade_history
set
  course_reference_id = coalesce(nullif(course_reference_id, ''), public.generate_course_reference_id()),
  course_fingerprint = public.build_course_fingerprint(
    source_event_id,
    course_type,
    grade,
    exam_date,
    exam_place
  )
where course_reference_id is null
   or course_reference_id = ''
   or course_fingerprint is null
   or course_fingerprint = '';

alter table public.grade_history
  alter column course_reference_id set not null,
  alter column course_fingerprint set not null;

create unique index if not exists grade_history_course_reference_id_idx
  on public.grade_history (course_reference_id);

create unique index if not exists grade_history_member_course_fingerprint_idx
  on public.grade_history (member_id, course_fingerprint);

drop trigger if exists sync_grade_history_identity_trigger
on public.grade_history;

create trigger sync_grade_history_identity_trigger
before insert or update on public.grade_history
for each row
execute function public.sync_grade_history_identity();
