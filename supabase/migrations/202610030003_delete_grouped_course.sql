create or replace function public.delete_ika_grouped_course(p_course_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  if p_course_ids is null or cardinality(p_course_ids) = 0 then
    return 0;
  end if;

  delete from public.member_achievements
  where course_id = any(p_course_ids);

  delete from public.grade_history
  where id = any(p_course_ids);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_ika_grouped_course(uuid[]) from public, anon, authenticated;
grant execute on function public.delete_ika_grouped_course(uuid[]) to service_role;
