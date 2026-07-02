-- Bootstrap the club owner account as super_admin.
-- This keeps RLS strict while allowing the official IKA admin user to manage
-- global CMS modules such as countries, dojos, pages, events, and roles.

do $$
declare
  target_email text := 'internationalkempoassociation@gmail.com';
  target_auth_user_id uuid;
  target_profile_id uuid;
  target_role_id uuid;
begin
  select id
    into target_auth_user_id
  from auth.users
  where lower(email) = lower(target_email)
  order by created_at desc
  limit 1;

  if target_auth_user_id is null then
    raise notice 'No auth user found for %, super_admin bootstrap skipped.', target_email;
    return;
  end if;

  insert into public.users_profiles (
    auth_user_id,
    email,
    display_name,
    status
  )
  values (
    target_auth_user_id,
    target_email,
    'IKA org',
    'active'
  )
  on conflict (auth_user_id)
  do update set
    email = excluded.email,
    display_name = coalesce(public.users_profiles.display_name, excluded.display_name),
    status = 'active',
    updated_at = now()
  returning id into target_profile_id;

  select id
    into target_role_id
  from public.roles
  where key = 'super_admin'
  limit 1;

  if target_role_id is null then
    raise exception 'Role super_admin does not exist.';
  end if;

  insert into public.user_roles (
    profile_id,
    role_id
  )
  values (
    target_profile_id,
    target_role_id
  )
  on conflict do nothing;
end $$;
