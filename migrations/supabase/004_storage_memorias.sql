drop policy if exists memorias_insert on storage.objects;
drop policy if exists memorias_select on storage.objects;
drop policy if exists memorias_update on storage.objects;
drop policy if exists memorias_delete on storage.objects;

create policy memorias_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'memorias'
    and exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(objects.name))[1]
        and p.caregiver_id = auth.uid()
    )
  );

create policy memorias_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'memorias'
    and exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(objects.name))[1]
        and p.caregiver_id = auth.uid()
    )
  );

create policy memorias_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'memorias'
    and exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(objects.name))[1]
        and p.caregiver_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'memorias'
    and exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(objects.name))[1]
        and p.caregiver_id = auth.uid()
    )
  );

create policy memorias_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'memorias'
    and exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(objects.name))[1]
        and p.caregiver_id = auth.uid()
    )
  );