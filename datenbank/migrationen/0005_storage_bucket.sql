-- Storage-Bucket für Datei-Uploads anlegen (nicht öffentlich) + Zugriffsregeln:
-- jeder Nutzer darf nur in seinem eigenen Ordner (fach-dateien/{user_id}/...) lesen/schreiben.

insert into storage.buckets (id, name, public)
values ('fach-dateien', 'fach-dateien', false)
on conflict (id) do nothing;

create policy "eigene_dateien_lesen" on storage.objects
  for select using (
    bucket_id = 'fach-dateien'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "eigene_dateien_schreiben" on storage.objects
  for insert with check (
    bucket_id = 'fach-dateien'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "eigene_dateien_loeschen" on storage.objects
  for delete using (
    bucket_id = 'fach-dateien'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
