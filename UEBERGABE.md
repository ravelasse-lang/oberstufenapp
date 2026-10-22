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
| **0014** Gäste-Schreibsperre | ANGEWENDET 22.10. mittags (mit Ja), 24+3 restriktive Policies, per zurückgerolltem Simulationstest geprüft |
| 0001–0005, 0007, 0010–0012 | waren schon angewendet (NICHT erneut ausführen) |

Jetzt vorhandene Tabellen (alle RLS an): block_1_ergebnisse, dateien, fach_ziele,
faecher, fortschritt_eintraege, gast_sitzungen, gastcodes, lernzettel_anfragen,
noten, pruefungsfaecher, todos. Zählungen vorher: noten 0, dateien 0, gastcodes 0,
todos 1, fach_ziele 1, block_1_ergebnisse 1, auth.users 10 (9 anonym).
Die Gast-Testcodes sind weg (der Restore brachte einen älteren Stand zurück).
NICHT erneut ausgeführt: `get_advisors` (Berechtigungsabfrage wurde abgebrochen) —
Sicherheits-Advisors bei Gelegenheit erneut lesen.

Der frühere Befund (Gäste könnten in eigene Zeilen schreiben) ist mit 0014 behoben.

## Offene Entscheidungen / Wartet auf den Nutzer
- Live-Praxistest von 0014 durch den Nutzer: als Besitzer einloggen (Todo, Datei, Gast-Code) und mit einem NEUEN Gast-Code (alte Codes sind weg) einloggen; Gast muss lesen, aber nicht schreiben können. Details: `datenbank/ANWENDEN.md`.
- Englisch freischalten oder auf mehr Material warten.
- Mathe-Materialien, Foto der kommenden Themen, Flipped-Classroom-Link, Domain,
  GoodNotes, Präsentations-Button, P1–P4 usw. (siehe `AGENDA.md`).
- `npm audit`: Rest-Advisories (9, nur Lint-/Parser-Ketten) NICHT per --force beheben; Next ist auf 16.3.8.

## Stand Folgearbeit (22.10. vormittags)
Der geplante Task `oberstufenapp-folgesession` ist gestartet, aber nach Phase 1 hängen
geblieben und wurde gestoppt; er ist abgeschaltet und läuft NICHT erneut. Die sichere
Arbeit wurde im normalen Chat erledigt (Details: Änderungsprotokoll, Abschnitt J):
25 Tests, Migration 0014 als Datei + `datenbank/ANWENDEN.md`, neue `setup.md`,
`settings.local.json` untracked. Es gibt keinen weiteren geplanten Task.

Danach (Abschnitt K im Protokoll, "mach alles"): 0014 angewendet, `OWNER_EMAIL` fail-closed,
Open-Redirect-Schutz, Next 16.3.8, Advisors gelesen. Noch offen (braucht dich): Live-Praxistest
und die Entscheidungen aus "Offene Entscheidungen" oben.

## Token-/Kontext-Fakten (22.10.2026)
5-Stunden-Limit zu 83 % belegt, Erneuerung 05:40 Uhr (Berlin); Wochenlimit 29 %;
Zusatznutzung ("extra usage") ist AUS — nichts wird gekauft.
