-- Ausgabeformat "html" ergänzen (HTML-Seite zum Öffnen im Browser).
-- Ersetzt nur den CHECK-Constraint aus 0015; Daten bleiben unverändert.
-- 'beides' bedeutet jetzt "alle Formate" (PDF, HTML, Obsidian-Markdown).
alter table lernzettel_anfragen drop constraint if exists lernzettel_anfragen_ausgabeformat_check;
alter table lernzettel_anfragen
  add constraint lernzettel_anfragen_ausgabeformat_check
    check (ausgabeformat in ('pdf', 'html', 'obsidian', 'beides'));
