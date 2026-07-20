alter table public.grade_history
  add column if not exists source_event_id uuid references public.events(id) on delete set null;

create unique index if not exists grade_history_member_source_event_idx
  on public.grade_history (member_id, source_event_id);

create or replace function public.sync_grade_history_from_event_checkin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_registration public.event_registrations%rowtype;
  target_event public.events%rowtype;
  target_title text;
  target_place text;
  normalized_course_type text;
begin
  if tg_op = 'INSERT' then
    select *
    into target_registration
    from public.event_registrations
    where id = new.registration_id;

    if target_registration.id is null then
      return new;
    end if;

    select *
    into target_event
    from public.events
    where id = target_registration.event_id;

    if target_event.id is null then
      return new;
    end if;

    select et.title, et.location_label
    into target_title, target_place
    from public.event_translations et
    where et.event_id = target_event.id
    order by case when et.language_code = 'es' then 0 else 1 end, et.created_at asc nulls last
    limit 1;

    normalized_course_type :=
      case coalesce(target_event.event_type, 'course')
        when 'seminar' then 'seminar'
        when 'taikai' then 'taikai'
        when 'encounter' then 'encounter'
        when 'busen' then 'busen'
        else 'course'
      end;

    insert into public.grade_history (
      member_id,
      grade,
      exam_date,
      exam_place,
      examiner,
      notes,
      course_type,
      source_event_id,
      created_by,
      updated_by
    )
    values (
      target_registration.member_id,
      coalesce(nullif(target_title, ''), 'IKA Event'),
      coalesce(target_event.starts_at::date, current_date),
      nullif(target_place, ''),
      null,
      'Generated automatically from confirmed event check-in.',
      normalized_course_type,
      target_event.id,
      target_registration.registered_by_profile_id,
      target_registration.registered_by_profile_id
    )
    on conflict (member_id, source_event_id)
    do update set
      grade = excluded.grade,
      exam_date = excluded.exam_date,
      exam_place = excluded.exam_place,
      course_type = excluded.course_type,
      updated_by = excluded.updated_by,
      updated_at = now();

    return new;
  end if;

  if tg_op = 'DELETE' then
    select *
    into target_registration
    from public.event_registrations
    where id = old.registration_id;

    if target_registration.id is null then
      return old;
    end if;

    if not exists (
      select 1
      from public.event_registration_checkins c
      where c.registration_id = old.registration_id
    ) then
      delete from public.grade_history
      where member_id = target_registration.member_id
        and source_event_id = target_registration.event_id;
    end if;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists sync_grade_history_from_event_checkin_insert
on public.event_registration_checkins;

create trigger sync_grade_history_from_event_checkin_insert
after insert on public.event_registration_checkins
for each row
execute function public.sync_grade_history_from_event_checkin();

drop trigger if exists sync_grade_history_from_event_checkin_delete
on public.event_registration_checkins;

create trigger sync_grade_history_from_event_checkin_delete
after delete on public.event_registration_checkins
for each row
execute function public.sync_grade_history_from_event_checkin();
