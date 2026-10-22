-- Lernzettel-Anfrage direkt im Fach: mehrere Themen auswählen, optional eine
-- hochgeladene Themenübersicht dazu, und das gewünschte Ausgabeformat.
--
-- Nur NEUE, optionale Spalten (bestehende Zeilen und das bisherige Formular
-- funktionieren unverändert weiter):
--   themen         die ausgewählten Themen (Titel aus dem Vault bzw. Freitext)
--   datei_id       optional: Themenübersicht aus der Dateien-Tabelle
--   ausgabeformat  'pdf' (gestaltetes PDF), 'obsidian' (Markdown) oder 'beides'
--
-- Die RLS-Policies bleiben, wie sie sind (eigene Zeilen; Gäste sind seit 0013
-- komplett ausgeschlossen). Sicher mehrfach ausführbar.

alter table lernzettel_anfragen
  add column if not exists themen text[] not null default '{}',
  add column if not exists datei_id uuid references dateien(id) on delete set null,
  add column if not exists ausgabeformat text not null default 'beides';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'lernzettel_anfragen_ausgabeformat_check') then
    alter table lernzettel_anfragen
      add constraint lernzettel_anfragen_ausgabeformat_check
        check (ausgabeformat in ('pdf', 'obsidian', 'beides'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lernzettel_anfragen_themen_anzahl_check') then
    alter table lernzettel_anfragen
      add constraint lernzettel_anfragen_themen_anzahl_check
        check (cardinality(themen) <= 40);
  end if;
end
$$;
