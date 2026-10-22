# Datenbank-Migrationen anwenden (Anleitung)

Stand: 22.10.2026. Projekt: Supabase `hjhxdtdzezjrpgortkto`.

## Regeln
- **Nie ohne ausdrückliches Ja des Nutzers im Chat.** Auch nicht "kurz zum Testen".
- Reihenfolge = Dateinummer. Jede Migration nur einmal; die Dateien bis 0013 sind
  angewendet (siehe `UEBERGABE.md` / `PROJECT_STATE.md`). Prüfen, was wirklich
  vorhanden ist, statt dem Gedächtnis zu vertrauen.
- Vorher und nachher **lesen** (siehe unten), nachher das Ergebnis dokumentieren.
- Kein Service-Role-Key. Anwenden im Supabase-SQL-Editor (Dashboard) oder per
  Supabase-MCP (`execute_sql`).
- Ist das Projekt pausiert ("Failed to fetch", Login hängt): zuerst im Dashboard den
  Status prüfen. `restore_project` ebenfalls nur mit Ja.

## 0014 (Gäste-Schreibsperre) — ANGEWENDET 22.10.2026 mittags
(Vor-/Nachprüfung unten wurden bereits durchgeführt; Ergebnis: Protokoll K. Abschnitt bleibt als Vorlage/Rückgängig-Hilfe.)
Datei: `migrationen/0014_gaeste_schreibsperre.sql`. Warum und was genau: siehe
Kommentar am Dateianfang. Kurz: restriktive Policies verbieten anonymen Gästen
INSERT/UPDATE/DELETE auf 8 Tabellen und in `fach-dateien`; Lesen bleibt.

### Vorprüfung (nur lesen)
```sql
-- Noch keine Sperre vorhanden?
select schemaname, tablename, policyname from pg_policies
where policyname like 'keine_gast_%' order by 1, 2, 3;   -- erwartet: 0 Zeilen

-- Alle Tabellen mit RLS an?
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;
```

### Anwenden
Inhalt von `0014_gaeste_schreibsperre.sql` ausführen (mehrfach ausführbar).

### Nachprüfung (nur lesen)
```sql
-- Erwartet: 24 Policies auf public (8 Tabellen x insert/update/delete) + 3 auf storage.objects
select schemaname, count(*) from pg_policies
where policyname like 'keine_gast_%' group by 1;

-- Alle restriktiv?
select policyname, permissive, cmd from pg_policies
where policyname like 'keine_gast_%' and permissive <> 'RESTRICTIVE';   -- erwartet: 0 Zeilen
```

### Praxistest (Mensch, nach dem Anwenden)
1. Als **Besitzer** einloggen: Todo anlegen/abhaken, Note eintragen, Datei hochladen,
   Gast-Code erstellen. Alles muss weiter gehen.
2. Mit einem **Gast-Code** einloggen (neuer Code im Besitzer-Konto): Seiten, Noten,
   Todos, Dateien müssen **lesbar** sein. Schreiben ist in der Oberfläche ohnehin
   ausgeblendet; über die Browser-Konsole würde es jetzt mit "row-level security"
   abgelehnt.
3. Code deaktivieren: der Gast fliegt beim nächsten Laden raus (wie bisher).

### Rückgängig machen (falls der Besitzer etwas nicht mehr schreiben kann)
```sql
do $$
declare t text;
begin
  foreach t in array array['dateien','fortschritt_eintraege','todos','noten',
    'fach_ziele','block_1_ergebnisse','pruefungsfaecher','gastcodes']
  loop
    execute format('drop policy if exists keine_gast_inserts on public.%I', t);
    execute format('drop policy if exists keine_gast_updates on public.%I', t);
    execute format('drop policy if exists keine_gast_deletes on public.%I', t);
  end loop;
end $$;
drop policy if exists "keine_gast_storage_inserts" on storage.objects;
drop policy if exists "keine_gast_storage_updates" on storage.objects;
drop policy if exists "keine_gast_storage_deletes" on storage.objects;
```

## Hinweis zu Policy-Namen
Restriktive Policies werden mit UND zu allen anderen verknüpft; die erlaubenden
(`eigene_*`, `gast_liest_*`) werden mit ODER verknüpft. Deshalb kann eine
restriktive Policy nie mehr erlauben, nur einschränken.
