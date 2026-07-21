create or replace function public.enforce_single_country_admin()
returns trigger
language plpgsql
as $$
declare
  next_role_key text;
  conflicting_profile_id uuid;
begin
  if new.country_id is null then
    return new;
  end if;

  select key
    into next_role_key
  from public.roles
  where id = new.role_id;

  if next_role_key is distinct from 'country_admin' then
    return new;
  end if;

  select ur.profile_id
    into conflicting_profile_id
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where r.key = 'country_admin'
    and ur.country_id = new.country_id
    and ur.id <> new.id
    and ur.profile_id <> new.profile_id
  limit 1;

  if conflicting_profile_id is not null then
    raise exception
      using errcode = '23505',
            message = 'country_admin_already_exists_for_country';
  end if;

  return new;
end;
$$;

drop trigger if exists user_roles_single_country_admin_guard on public.user_roles;

create trigger user_roles_single_country_admin_guard
before insert or update on public.user_roles
for each row
execute function public.enforce_single_country_admin();
