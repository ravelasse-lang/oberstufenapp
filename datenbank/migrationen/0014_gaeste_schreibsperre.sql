-- Gäste dürfen auf Datenbank-Ebene NICHTS schreiben (Review-Befund).
--
-- Problem: Anonyme Gast-Sessions haben die Postgres-Rolle "authenticated".
-- Die Besitzer-Policies "eigene_*" (for all, auth.uid() = user_id) erlauben
-- einem Gast daher, EIGENE Zeilen anzulegen/zu ändern/zu löschen, und im
-- Storage-Bucket "fach-dateien" in sein EIGENES Verzeichnis zu schreiben.
-- Fremde (Besitzer-)Daten waren nie erreichbar; nur die Oberfläche blendet das
-- Schreiben für Gäste aus. Das hier sperrt es zusätzlich in der Datenbank.
--
-- Lösung: RESTRIKTIVE Policies (werden mit allen anderen per UND verknüpft)
-- nur für INSERT, UPDATE und DELETE. Bewusst NICHT "for all": das würde auch
-- SELECT sperren und damit das Lesen der Gast-Policies (gast_liest_*) brechen.
-- Maßstab ist derselbe wie in 0013: das JWT-Feld is_anonymous.
--
-- Nicht betroffen: lernzettel_anfragen (hat seit 0013 eine eigene Sperre),
-- faecher (nur select), gast_sitzungen (keine Schreib-Policy; gast_login ist
-- SECURITY DEFINER und schreibt dort weiterhin).
--
-- WICHTIG: Diese Datei ist NUR vorbereitet und wird erst nach ausdrücklicher
-- Freigabe des Nutzers angewendet. Anleitung, Vor- und Nachprüfung und
-- Rückgängig-Skript: datenbank/ANWENDEN.md. Sicher mehrfach ausführbar.

do $$
declare
  t text;
begin
  foreach t in array array[
    'dateien', 'fortschritt_eintraege', 'todos', 'noten', 'fach_ziele',
    'block_1_ergebnisse', 'pruefungsfaecher', 'gastcodes'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', 'keine_gast_inserts', t);
    execute format('drop policy if exists %I on public.%I', 'keine_gast_updates', t);
    execute format('drop policy if exists %I on public.%I', 'keine_gast_deletes', t);

    execute format($f$
      create policy %I on public.%I as restrictive for insert to authenticated
      with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
    $f$, 'keine_gast_inserts', t);

    execute format($f$
      create policy %I on public.%I as restrictive for update to authenticated
      using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
      with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
    $f$, 'keine_gast_updates', t);

    execute format($f$
      create policy %I on public.%I as restrictive for delete to authenticated
      using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
    $f$, 'keine_gast_deletes', t);
  end loop;
end
$$;

-- Storage: Gäste dürfen im Bucket keine Dateien anlegen, ändern oder löschen.
drop policy if exists "keine_gast_storage_inserts" on storage.objects;
drop policy if exists "keine_gast_storage_updates" on storage.objects;
drop policy if exists "keine_gast_storage_deletes" on storage.objects;

create policy "keine_gast_storage_inserts" on storage.objects
  as restrictive for insert to authenticated
  with check (
    bucket_id <> 'fach-dateien'
    or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

create policy "keine_gast_storage_updates" on storage.objects
  as restrictive for update to authenticated
  using (
    bucket_id <> 'fach-dateien'
    or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  )
  with check (
    bucket_id <> 'fach-dateien'
    or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

create policy "keine_gast_storage_deletes" on storage.objects
  as restrictive for delete to authenticated
  using (
    bucket_id <> 'fach-dateien'
    or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
