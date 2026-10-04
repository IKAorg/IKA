-- Preserve the official spelling of the Kampfkunst Aarau instructors' names.

update public.dojos
set
  responsible_instructor = 'Jürg Bommer, Ben Brönnimann and Arthur Roscha',
  updated_at = now()
where id = '56acb8a2-6b6f-4f87-aed9-caf8f333d3ac'::uuid;
