alter table public.grade_history
  add column if not exists course_type text not null default 'course';

alter table public.grade_history
  drop constraint if exists grade_history_course_type_check;

alter table public.grade_history
  add constraint grade_history_course_type_check
  check (course_type in ('course', 'seminar', 'taikai', 'encounter', 'busen'));

create table if not exists public.member_achievements (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  course_id uuid references public.grade_history(id) on delete set null,
  title text not null,
  category text,
  result text,
  achieved_on date not null,
  achieved_place text,
  notes text,
  created_by uuid references public.users_profiles(id) on delete set null,
  updated_by uuid references public.users_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists member_achievements_member_date_idx
  on public.member_achievements (member_id, achieved_on desc);

alter table public.member_achievements enable row level security;

drop policy if exists "member_achievements_public_select" on public.member_achievements;
create policy "member_achievements_public_select"
on public.member_achievements for select
using (true);

drop policy if exists "member_achievements_service_all" on public.member_achievements;
create policy "member_achievements_service_all"
on public.member_achievements for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
