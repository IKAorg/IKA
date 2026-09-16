insert into public.languages (code, name, native_name, is_active, sort_order)
values
  ('id', 'Indonesian', 'Bahasa Indonesia', true, 80),
  ('ms', 'Malay', 'Bahasa Melayu', true, 90),
  ('eu', 'Basque', 'Euskara', true, 100),
  ('pt', 'Portuguese', 'Portugues', true, 110),
  ('de', 'German', 'Deutsch', true, 120)
on conflict (code) do update
set
  name = excluded.name,
  native_name = excluded.native_name,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
