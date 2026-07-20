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
select
  er.member_id,
  coalesce(nullif(et.title, ''), 'IKA Event') as grade,
  coalesce(e.starts_at::date, current_date) as exam_date,
  nullif(et.location_label, '') as exam_place,
  null::text as examiner,
  'Generated automatically from confirmed event check-in.' as notes,
  case coalesce(e.event_type, 'course')
    when 'seminar' then 'seminar'
    when 'taikai' then 'taikai'
    when 'encounter' then 'encounter'
    when 'busen' then 'busen'
    else 'course'
  end as course_type,
  e.id as source_event_id,
  er.registered_by_profile_id,
  er.registered_by_profile_id
from public.event_registrations er
join public.events e on e.id = er.event_id
join (
  select distinct registration_id
  from public.event_registration_checkins
) c on c.registration_id = er.id
left join lateral (
  select title, location_label
  from public.event_translations et
  where et.event_id = e.id
  order by case when et.language_code = 'es' then 0 else 1 end, et.created_at asc nulls last
  limit 1
) et on true
on conflict (member_id, source_event_id)
do update set
  grade = excluded.grade,
  exam_date = excluded.exam_date,
  exam_place = excluded.exam_place,
  course_type = excluded.course_type,
  updated_by = excluded.updated_by,
  updated_at = now();
