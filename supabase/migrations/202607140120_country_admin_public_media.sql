do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'admins can upload public media'
  ) then
    drop policy "admins can upload public media" on storage.objects;
  end if;

  create policy "admins can upload public media"
    on storage.objects
    for insert
    with check (
      bucket_id = 'public-media'
      and (
        app.is_super_admin()
        or app.has_role('global_admin')
        or app.has_role('country_admin')
      )
    );

  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'admins can update public media'
  ) then
    drop policy "admins can update public media" on storage.objects;
  end if;

  create policy "admins can update public media"
    on storage.objects
    for update
    using (
      bucket_id = 'public-media'
      and (
        app.is_super_admin()
        or app.has_role('global_admin')
        or app.has_role('country_admin')
      )
    )
    with check (
      bucket_id = 'public-media'
      and (
        app.is_super_admin()
        or app.has_role('global_admin')
        or app.has_role('country_admin')
      )
    );

  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'admins can delete public media'
  ) then
    drop policy "admins can delete public media" on storage.objects;
  end if;

  create policy "admins can delete public media"
    on storage.objects
    for delete
    using (
      bucket_id = 'public-media'
      and (
        app.is_super_admin()
        or app.has_role('global_admin')
        or app.has_role('country_admin')
      )
    );
end $$;
