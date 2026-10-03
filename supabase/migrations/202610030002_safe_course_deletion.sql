create or replace function public.set_event_creator()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if new.created_by is null then
    new.created_by := app.current_profile_id();
  end if;

  if new.updated_by is null then
    new.updated_by := coalesce(app.current_profile_id(), new.created_by);
  end if;

  return new;
end;
$$;

drop trigger if exists set_event_creator_before_insert on public.events;
create trigger set_event_creator_before_insert
before insert on public.events
for each row
execute function public.set_event_creator();

create or replace function public.delete_ika_event_cascade(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_event_id uuid;
begin
  delete from public.member_achievements
  where course_id in (
    select id
    from public.grade_history
    where source_event_id = p_event_id
  );

  delete from public.grade_history
  where source_event_id = p_event_id;

  delete from public.events
  where id = p_event_id
  returning id into deleted_event_id;

  return deleted_event_id is not null;
end;
$$;

revoke all on function public.delete_ika_event_cascade(uuid) from public, anon, authenticated;
grant execute on function public.delete_ika_event_cascade(uuid) to service_role;
