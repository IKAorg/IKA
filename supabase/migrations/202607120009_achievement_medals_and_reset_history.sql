alter table public.member_achievements
  add column if not exists medal_type text,
  add column if not exists podium_position integer;

alter table public.member_achievements
  drop constraint if exists member_achievements_medal_type_check;

alter table public.member_achievements
  add constraint member_achievements_medal_type_check
  check (medal_type is null or medal_type in ('gold', 'silver', 'bronze', 'finalist', 'participant'));

alter table public.member_achievements
  drop constraint if exists member_achievements_podium_position_check;

alter table public.member_achievements
  add constraint member_achievements_podium_position_check
  check (podium_position is null or podium_position between 1 and 99);

delete from public.member_achievements;
delete from public.grade_history;
