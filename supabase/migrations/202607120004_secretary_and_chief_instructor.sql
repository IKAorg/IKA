insert into public.system_settings (key, value, description)
values (
  'about_secretary_general',
  '{"name":"","photoUrl":"","translations":{}}'::jsonb,
  'Secretary General content for the public About IKA page.'
)
on conflict (key) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'system_settings'
      and policyname = 'public can read secretary general settings'
  ) then
    create policy "public can read secretary general settings"
    on public.system_settings for select
    using (key = 'about_secretary_general');
  end if;
end $$;

alter table public.official_instructors
add column if not exists is_chief_instructor boolean not null default false;

create unique index if not exists official_instructors_one_chief_idx
on public.official_instructors ((is_chief_instructor))
where is_chief_instructor = true;
