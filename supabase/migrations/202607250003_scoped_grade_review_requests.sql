drop policy if exists "members read own correction requests" on public.correction_requests;
drop policy if exists "members create own correction requests" on public.correction_requests;
drop policy if exists "admins manage correction requests" on public.correction_requests;

create policy "members and scoped admins read correction requests"
on public.correction_requests for select
using (
  member_id = app.current_member_id()
  or app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1 from public.members m
    where m.id = member_id
      and (
        (m.country_id is not null and app.can_manage_country(m.country_id))
        or (m.dojo_id is not null and app.can_manage_dojo(m.dojo_id))
      )
  )
);

create policy "members create own correction requests"
on public.correction_requests for insert
with check (member_id = app.current_member_id());

create policy "scoped admins manage correction requests"
on public.correction_requests for all
using (
  app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1 from public.members m
    where m.id = member_id
      and (
        (m.country_id is not null and app.can_manage_country(m.country_id))
        or (m.dojo_id is not null and app.can_manage_dojo(m.dojo_id))
      )
  )
)
with check (
  app.is_super_admin()
  or app.has_role('global_admin')
  or exists (
    select 1 from public.members m
    where m.id = member_id
      and (
        (m.country_id is not null and app.can_manage_country(m.country_id))
        or (m.dojo_id is not null and app.can_manage_dojo(m.dojo_id))
      )
  )
);
