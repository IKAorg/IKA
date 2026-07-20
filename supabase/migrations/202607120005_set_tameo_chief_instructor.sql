update public.official_instructors
set is_chief_instructor = case
  when lower(trim(full_name)) = 'tameo mizuno' then true
  else false
end;
