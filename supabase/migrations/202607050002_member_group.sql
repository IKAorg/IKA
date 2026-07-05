alter table public.members
  add column if not exists member_group text;

create index if not exists members_member_group_idx
  on public.members (member_group);
