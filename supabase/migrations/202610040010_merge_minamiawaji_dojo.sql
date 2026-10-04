-- Kita-Ama and Matsuho referred to the same current Minamiawaji activity.
-- Keep the verified Matsuho Community Center record as the canonical dojo.
delete from public.dojos
where id = '45668517-0a1a-4f80-87a2-7cf342b18d32'::uuid;
