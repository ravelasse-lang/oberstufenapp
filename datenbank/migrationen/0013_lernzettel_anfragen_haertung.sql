-- Härtung der Tabelle lernzettel_anfragen (Review-Befund L1/L5).
--
-- Problem: Anonyme Gast-Sessions haben die Postgres-Rolle "authenticated".
-- Die bestehende Policy "eigene_lernzettel_anfragen" (for all, auth.uid() =
-- user_id) erlaubt einem Gast also, auf DB-Ebene eigene Anfragen anzulegen;
-- nur die Oberfläche blendet das Formular für Gäste aus.
--
-- Lösung: eine RESTRIKTIVE Policy (wird mit den anderen per UND verknüpft)
-- schließt anonyme Sessions komplett aus. Dazu Plausibilitäts-Checks.
--
-- WICHTIG: Diese Datei ist NUR vorbereitet und wird erst nach ausdrücklicher
-- Freigabe des Nutzers im Supabase-SQL-Editor ausgeführt.

create policy "keine_gaeste_lernzettel_anfragen" on lernzettel_anfragen
  as restrictive
  for all
  to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

alter table lernzettel_anfragen
  add constraint lernzettel_anfragen_dokumenttyp_check
    check (dokumenttyp in ('lernzettel', 'zusammenfassung', 'uebungsblatt')),
  add constraint lernzettel_anfragen_thema_laenge_check
    check (char_length(btrim(thema)) between 1 and 200),
  add constraint lernzettel_anfragen_notiz_laenge_check
    check (notiz is null or char_length(notiz) <= 2000);
