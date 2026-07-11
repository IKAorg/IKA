alter table public.members
  add column if not exists external_member_id text;

create index if not exists members_external_member_id_idx
  on public.members (external_member_id);
