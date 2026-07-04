-- Allow Supabase API roles to evaluate RLS helper functions in the app schema.
-- Without this, policies that call app.* functions can fail with:
-- "permission denied for schema app".

grant usage on schema app to anon, authenticated, service_role;

grant execute on function app.current_profile_id() to anon, authenticated, service_role;
grant execute on function app.current_member_id() to anon, authenticated, service_role;
grant execute on function app.has_role(text) to anon, authenticated, service_role;
grant execute on function app.is_super_admin() to anon, authenticated, service_role;
grant execute on function app.can_manage_country(uuid) to anon, authenticated, service_role;
grant execute on function app.can_manage_dojo(uuid) to anon, authenticated, service_role;
