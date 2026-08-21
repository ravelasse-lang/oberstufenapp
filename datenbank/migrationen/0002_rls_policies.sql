-- Row-Level-Security: jede Zeile ist nur für ihren Besitzer (auth.uid()) sichtbar/änderbar.
-- Ausführen NACH 0001_schema.sql im Supabase SQL-Editor.

alter table dateien enable row level security;
alter table fortschritt_eintraege enable row level security;
alter table todos enable row level security;
alter table chat_nachrichten enable row level security;

create policy "eigene_dateien" on dateien
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene_fortschritt_eintraege" on fortschritt_eintraege
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene_todos" on todos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene_chat_nachrichten" on chat_nachrichten
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- faecher-Tabelle: für alle eingeloggten Nutzer lesbar (kein Besitzer-Konzept, da statische Referenzdaten)
alter table faecher enable row level security;
create policy "faecher_lesbar_fuer_eingeloggte" on faecher
  for select using (auth.role() = 'authenticated');

-- Storage: Bucket "fach-dateien" muss im Dashboard angelegt werden (Storage -> New bucket, NICHT public).
-- Danach folgende Policy für den Bucket setzen (Storage -> Policies):
-- Ausdruck für SELECT/INSERT/UPDATE/DELETE: (storage.foldername(name))[1] = auth.uid()::text
-- Das setzt voraus, dass Dateien unter fach-dateien/{auth.uid()}/{fach_id}/{dateiname} abgelegt werden.
