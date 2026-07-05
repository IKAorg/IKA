alter table public.members
  add column if not exists portal_invite_sent_at timestamptz,
  add column if not exists portal_invite_sent_to text,
  add column if not exists portal_invite_sent_by uuid references public.users_profiles(id) on delete set null;
