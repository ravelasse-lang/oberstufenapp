# UEBERGABE.md — Stand für die nächste Session

Erstellt am 22.10.2026. Lies zuerst diese Datei, dann `PROJECT_STATE.md`,
`AGENDA.md` und `dokumentation/aenderungsprotokoll-2026-10-22.md`.

## KOSTEN- UND CLOUD-REGELN (höchste Priorität, ausdrücklicher Wunsch des Nutzers)
**Es darf KEIN Cloud-Guthaben und KEINE Zusatznutzung verbraucht werden.** Gearbeitet wird
ausschließlich LOKAL auf dem Rechner des Nutzers, und der Verbrauch kommt nur aus dem
normalen Kontingent seines Abos (Plan "Pro": 5-Stunden- und Wochenlimit). Stand
22.10.2026: "Extra usage" ist in seinem Konto AUS — das so lassen.

Konkret VERBOTEN:
- **Cloud-Sessions, Cloud-Routinen, Remote-Agents:** der Skill `schedule` (legt Cloud-Agents an),
  das Tool `RemoteTrigger`, `mcp__ccd_session__start_session` mit `target: "cloud"`,
  `mcp__ccd_session__move_to_cloud`, der Agent-Parameter `isolation: "remote"`,
  Remote Control aktivieren (`set_remote_control`), `ultrareview`/`/code-review ultra`
  (Cloud-Review, kostenpflichtig), Vercel-Sandboxes und Agent-Runs (`create_sandboxes_*`,
  `create_session_*`, `run_session_command`).
- **Geld/Kontingent:** Zusatznutzung ("extra usage") einschalten, Guthaben/Tokens kaufen,
  Plan upgraden, API-Keys mit Abrechnung anlegen oder nutzen (Anthropic-API, andere
  kostenpflichtige Dienste), Spend-Limits ändern.
- **Kostenpflichtige Aktionen bei Supabase/Vercel:** Domains kaufen (`buy_domain`,
  `create_or_transfer_domain`), neue Projekte anlegen (`create_project`), Branches
  (`create_branch`), Compute-/Plan-Upgrades, Marketplace-/Integrations-Käufe.
- Weitere geplante Tasks anlegen (der eine vorhandene Task ist der einzige).

ERLAUBT (verbraucht nur das normale Kontingent, aber sparsam einsetzen):
- Lokale Subagents (`Agent`-Tool ohne `isolation: "remote"`), lokale Tools, Git, lokale Builds/Tests.
- Der vorhandene lokale Task (Claude-Desktop-App, `mcp__scheduled-tasks`) — er läuft auf dem Rechner,
  nicht in der Cloud.

WENN DAS LIMIT ERREICHT IST: sauber STOPPEN. Zwischenstand in dieser Datei festhalten
(fertig / halb / offen), nur sauberen getesteten Stand committen+pushen, Prozesse beenden —
und NICHT weitermachen, nichts nachkaufen, nichts umgehen. Das Kontingent erneuert sich von selbst
(5-Stunden-Fenster; Wochenlimit separat). Dann wird dort weitergemacht, wo diese Datei es beschreibt.
Im Zweifel, ob etwas Kosten verursacht: NICHT ausführen, als Frage an den Nutzer notieren.

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

## Datenbank-Stand (maßgeblich, 22.10.2026 nachmittags)
Mit ausdrücklichem Ja des Nutzers ("ja und db darf mit vorsicht geändert werden")
wurden diese Änderungen per `execute_sql` auf Projekt `hjhxdtdzezjrpgortkto`
ausgeführt — jeweils mit Vorprüfung und Nachprüfung, ohne Fehler:

| Migration | Ergebnis |
|---|---|
| **0008** `dateien.thema_slug`, `dateien.halbjahr` | ANGEWENDET, Spalten verifiziert |
| **0009** `todos.kategorie`, `faellig_am`, `angepinnt` | ANGEWENDET, Spalten verifiziert (todos: 1 Zeile unverändert, `angepinnt` nirgends NULL, Policies unverändert) |
| **0006** `chat_nachrichten` droppen | ANGEWENDET (Tabelle war leer, kein Fremdschlüssel darauf) |
| **0013** Gäste-Sperre `lernzettel_anfragen` + 3 CHECKs | ANGEWENDET (Tabelle leer; restriktive Policy `keine_gaeste_lernzettel_anfragen` + `…_dokumenttyp/_thema_laenge/_notiz_laenge_check` vorhanden) |
| 0001–0005, 0007, 0010–0012 | waren schon angewendet (NICHT erneut ausführen) |

Jetzt vorhandene Tabellen (alle RLS an): block_1_ergebnisse, dateien, fach_ziele,
faecher, fortschritt_eintraege, gast_sitzungen, gastcodes, lernzettel_anfragen,
noten, pruefungsfaecher, todos. Zählungen vorher: noten 0, dateien 0, gastcodes 0,
todos 1, fach_ziele 1, block_1_ergebnisse 1, auth.users 10 (9 anonym).
Die Gast-Testcodes sind weg (der Restore brachte einen älteren Stand zurück).
NICHT erneut ausgeführt: `get_advisors` (Berechtigungsabfrage wurde abgebrochen) —
Sicherheits-Advisors bei Gelegenheit erneut lesen.

Offener Befund (noch NICHT behoben): Anonyme Gäste haben die Rolle `authenticated`;
die `eigene_*`-Policies erlauben ihnen daher Schreiben in EIGENE Zeilen und ins
eigene Storage-Verzeichnis (fremde Daten bleiben unerreichbar). Lösung: Migration
0014 (restriktive Policies `is_anonymous = false` für Schreib-Tabellen und
`storage.objects`) — als DATEI vorbereiten, Anwendung nur nach erneutem Ja und
Test von Besitzer- und Gast-Login.

## Offene Entscheidungen / Wartet auf den Nutzer
- Freigabe für Migration 0014 (Gäste-Schreibsperre), sobald vorbereitet und geprüft.
- `OWNER_EMAIL` fehlt → bisher fail-open (Nutzer: später auf fail-closed).
- Englisch freischalten oder auf mehr Material warten.
- Mathe-Materialien, Foto der kommenden Themen, Flipped-Classroom-Link, Domain,
  GoodNotes, Präsentations-Button, P1–P4 usw. (siehe `AGENDA.md`).
- `npm audit`: Next.js 16.0–16.3.x hat Advisories (Update auf 16.4.x eigener Schritt
  mit Test); `.claude/settings.local.json` untracken + `.gitignore`.

## Geplanter EINMALIGER Folgeauftrag
(Am 22.10. um 05:50 Uhr; auf Wunsch des Nutzers ERWEITERT.) Genau ein Task
(`oberstufenapp-folgesession`) startet eine neue Session. Der Nutzer hat
erlaubt, das Kontingent dort sinnvoll voll zu nutzen und Agents einzusetzen.
Ablauf: (1) lesend prüfen (Vercel, Live-`/login`, Supabase); (2) nur wenn
sauber: SICHERE Projektarbeit — Tests für `besitzer.ts`, Wiki-Link-Umwandlung
und Slug-Validierung; Migrationsdatei 0014 (Gäste-Schreibsperre) und
`datenbank/ANWENDEN.md` nur ALS DATEI vorbereiten; `dokumentation/setup.md`
aktualisieren; kleine risikoarme Qualitätsfixes; `settings.local.json`
untracken; (3) tsc/eslint/test/build grün, opus-Review, kleine Commits, Push,
Vercel-Check; (4) Protokoll und diese Übergabe aktualisieren.
Harte Grenzen bleiben: KEINE DB-Änderung/Restore ohne Ja des Nutzers, nichts
außerhalb des Projektordners, nichts kaufen, keine weiteren Tasks, keine
erfundenen Inhalte, kein Next-Update, kein Force-Push. Stop bei ca. 85 %
Kontext oder drohendem Limit, mit Zwischenstand in dieser Datei.

## Token-/Kontext-Fakten (22.10.2026)
5-Stunden-Limit zu 83 % belegt, Erneuerung 05:40 Uhr (Berlin); Wochenlimit 29 %;
Zusatznutzung ("extra usage") ist AUS — nichts wird gekauft.
