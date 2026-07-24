alter table public.official_instructors
add column if not exists role_category text not null default 'instructor';

alter table public.official_instructors
drop constraint if exists official_instructors_role_category_check;

alter table public.official_instructors
add constraint official_instructors_role_category_check
check (role_category in ('instructor', 'examiner', 'judge'));

update public.official_instructors
set role_category = 'instructor'
where role_category is null;

drop index if exists official_instructors_visible_order_idx;
create index if not exists official_instructors_category_visible_order_idx
  on public.official_instructors (role_category, is_visible, sort_order, created_at);

drop index if exists official_instructors_one_chief_idx;
drop index if exists official_instructors_one_chief_instructor_idx;
create unique index if not exists official_instructors_one_chief_instructor_idx
  on public.official_instructors ((is_chief_instructor))
  where is_chief_instructor = true and role_category = 'instructor';
