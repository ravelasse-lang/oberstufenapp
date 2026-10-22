# UEBERGABE.md — Stand für die nächste Session

Erstellt am 22.10.2026. Lies zuerst diese Datei, dann `PROJECT_STATE.md`,
`AGENDA.md` und `dokumentation/aenderungsprotokoll-2026-10-22.md`.

## Wichtigste Regeln des Nutzers (gelten immer)
- **Nichts kaputt machen.** Nichts außerhalb des Projektordners anfassen.
- **Keine Datenbank-Änderung (Migration, INSERT/UPDATE/DELETE, DDL) und kein
  Supabase-`restore_project`/`pause` ohne ausdrückliches Ja des Nutzers im Chat.**
- Nichts kaufen, keine Tokens/Zusatznutzung freischalten. Keine erfundenen
  Lehrplaninhalte. Kein Service-Role-Key.
- Alles, was geändert wird, mit Was/Wie/Warum dokumentieren.

## Was fertig und live ist (Commits 7fab556…e8578ab, gepusht)
- Besitzer-Prüfung in `proxy.ts` (+ `lib/auth/besitzer.ts`, Callback), Cookie-sichere
  Redirects, Slug-Validierung in `lib/vault/lesen.ts`.
- Markdown-Darstellung für Lernzettel/Themen (`komponenten/markdown-anzeige.tsx`).
- Lernzettel-Anfragen: Texte korrigiert, Sicherheitsregeln im `/lernzettel`-Befehl.
- Vercel-Deployment `e8578ab` ist READY; `/login` antwortet mit HTTP 200.
- Supabase-Projekt `hjhxdtdzezjrpgortkto` ist wieder ACTIVE_HEALTHY (war pausiert;
  das war die Ursache des Login-Hängers).

## Datenbank-Befund (nur gelesen, 22.10.2026)
| Migration | Stand |
|---|---|
| 0001–0005, 0007, 0010, 0011, 0012 | angewendet |
| **0006** (chat_nachrichten droppen) | NICHT angewendet (Tabelle hat 0 Zeilen) |
| **0008** (`dateien.thema_slug`, `halbjahr`) | NICHT angewendet |
| **0009** (`todos.kategorie`, `faellig_am`, `angepinnt`) | NICHT angewendet |
| 0013 (Gäste-Sperre lernzettel_anfragen) | Datei bereit, nicht angewendet |

Folgen: Die App fragt Spalten aus 0008/0009 ab → Upload auf Themenseiten und
erweiterte To-Dos können in Produktion Fehler liefern, bis 0008/0009 laufen.
Zählungen: noten 0, dateien 0, gastcodes 0, todos 1, fach_ziele 1,
block_1_ergebnisse 1, auth.users 10 (9 anonym). Gast-Testcodes sind weg
(mögliche Rücksetzung auf älteren Stand).

Weiterer Befund: Anonyme Gäste haben die Rolle `authenticated`; die
`eigene_*`-Policies erlauben ihnen daher Schreiben in EIGENE Zeilen/ins
eigene Storage-Verzeichnis (fremde Daten bleiben unerreichbar). 0013 deckt nur
`lernzettel_anfragen` ab; eine Ausweitung auf alle Schreib-Tabellen und
`storage.objects` (restriktive Policy mit `is_anonymous = false`) ist ein
Vorschlag, noch nicht geschrieben.

**Empfohlene Reihenfolge (nur auf Ja des Nutzers, jeweils einzeln in
`begin; … commit;` im SQL-Editor):** 0008 → 0009 → 0006 (vorher `count(*)` prüfen) →
0013 (nicht idempotent, nur einmal). 0002, 0004, 0005, 0007, 0010–0012 NICHT
erneut ausführen.

## Offene Entscheidungen / Wartet auf den Nutzer
- Freigabe für 0008/0009/0006/0013 (siehe oben).
- `OWNER_EMAIL` fehlt → bisher fail-open (Nutzer: später auf fail-closed).
- Englisch freischalten oder auf mehr Material warten.
- Mathe-Materialien, Foto der kommenden Themen, Flipped-Classroom-Link, Domain,
  GoodNotes, Präsentations-Button, P1–P4 usw. (siehe `AGENDA.md`).
- `npm audit`: Next.js 16.0–16.3.x hat Advisories (Update auf 16.4.x eigener Schritt
  mit Test); `.claude/settings.local.json` untracken + `.gitignore`.

## Geplanter EINMALIGER Folgeauftrag
Genau ein Task (`oberstufenapp-folgesession`, Zeit siehe unten) startet eine
neue Session. Er darf NUR: Lesen/Prüfen (Vercel-Deployment, Live-`/login`,
Supabase read-only erneut), Doku/Übergabe aktualisieren und diese
Doku-Änderungen committen+pushen. Er darf NICHT: Migrationen anwenden, Supabase
schreiben/restoren, weitere Tasks planen, Pakete installieren, außerhalb des
Projektordners schreiben, Code ändern. Er beendet sich selbst, sobald diese
Liste abgearbeitet ist oder der Kontext zu ca. 60 % gefüllt ist, und plant
KEINEN weiteren Task.

## Token-/Kontext-Fakten (22.10.2026)
5-Stunden-Limit zu 83 % belegt, Erneuerung 05:40 Uhr (Berlin); Wochenlimit 29 %;
Zusatznutzung ("extra usage") ist AUS — nichts wird gekauft.
