insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'public-media',
  'public-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public can read public media'
  ) then
    create policy "public can read public media"
      on storage.objects
      for select
      using (bucket_id = 'public-media');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'admins can upload public media'
  ) then
    create policy "admins can upload public media"
      on storage.objects
      for insert
      with check (
        bucket_id = 'public-media'
        and (app.is_super_admin() or app.has_role('global_admin'))
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'admins can update public media'
  ) then
    create policy "admins can update public media"
      on storage.objects
      for update
      using (
        bucket_id = 'public-media'
        and (app.is_super_admin() or app.has_role('global_admin'))
      )
      with check (
        bucket_id = 'public-media'
        and (app.is_super_admin() or app.has_role('global_admin'))
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'admins can delete public media'
  ) then
    create policy "admins can delete public media"
      on storage.objects
      for delete
      using (
        bucket_id = 'public-media'
        and (app.is_super_admin() or app.has_role('global_admin'))
      );
  end if;
end $$;
