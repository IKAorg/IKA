insert into public.system_settings (key, value, description)
values (
  'home_marquee',
  '{"mode":"auto","reportsDurationSeconds":56,"articlesDurationSeconds":38}'::jsonb,
  'Public homepage marquee speed settings.'
)
on conflict (key) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'system_settings'
      and policyname = 'public can read homepage marquee settings'
  ) then
    create policy "public can read homepage marquee settings"
    on public.system_settings for select
    using (key = 'home_marquee');
  end if;
end $$;
