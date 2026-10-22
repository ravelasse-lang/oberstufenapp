# Änderungsprotokoll — 22.10.2026

Was wurde geändert, wie, und warum. Alles liegt im Projektordner; ausdrücklich
notiert ist am Ende, was darüber hinaus auf dem Rechner oder in externen
Diensten passiert ist.

## Ausgangslage
- Der Login auf der Live-Seite hing ("Failed to fetch"). Ursache: Das
  Supabase-Projekt `hjhxdtdzezjrpgortkto` war **pausiert** (Free-Plan,
  Inaktivität). Es wurde mit deinem "ja" per `restore_project` reaktiviert.
- Danach prüfte ein großes Modell (opus) alle offenen Änderungen und
  lieferte Befunde. Dieses Protokoll beschreibt, was daraus geworden ist.

## A. Code — Anmeldung/Sicherheit

| Datei | Was | Wie | Warum |
|---|---|---|---|
| `lib/auth/besitzer.ts` (neu) | Gemeinsamer Besitzer-Vergleich | `istBesitzer(email)` und `besitzerKonfiguriert()`: E-Mail getrimmt, Groß-/Kleinschreibung egal, liest `OWNER_EMAIL` (nur serverseitig) | Proxy und Callback verglichen vorher unterschiedlich (Callback exakt). Ein Leerzeichen in der Vercel-Variable hätte den Besitzer ausgeloggt. |
| `proxy.ts` | Besitzer-Prüfung für alle nicht-anonymen Nutzer | Nach `getUser()`: Ist ein Nutzer weder anonym noch der Besitzer (und `OWNER_EMAIL` gesetzt) → `signOut()` + Redirect auf `/login` | Der Code-Login (`verifyOtp`) läuft im Browser und umging die Prüfung im Callback. Signups müssen offen bleiben (Gast-Logins), daher braucht es diese Sperre zentral. |
| `proxy.ts` | Helper `umleiten()` | Redirect, der die von Supabase gesetzten Cookies (Token-Refresh, Abmelden) mitschickt; auf allen Redirect-Stellen benutzt; Gast-Zweig mit Schleifenschutz auf `/login` | Bei `NextResponse.redirect` gingen die Cookies verloren → mögliche Logout-Schleifen und unerwartete Abmeldungen. |
| `proxy.ts` | Verhalten bei fehlender `OWNER_EMAIL` | **Bleibt wie bisher: durchlassen (fail-open)** — Entscheidung des Nutzers, mit Kommentar im Code | Später auf "sperren" umstellen (offener Punkt in `AGENDA.md`). Hinweis: In Vercel ist die Variable für Production und Preview gesetzt (geprüft). |
| `app/auth/callback/route.ts` | Nutzt denselben Vergleich | `besitzerKonfiguriert()`/`istBesitzer()` statt `!==` | Einheitliches Verhalten, siehe oben. |
| `lib/vault/lesen.ts` | Pfad-Absicherung | `istSlug()`: Fach-/Themen-Slug nur `^[a-z0-9-]+$`, sonst leeres Ergebnis | Slugs kommen aus der URL und landen in Dateipfaden; verhindert `../`-Tricks. Alle vorhandenen Vault-Dateinamen erfüllen die Regel. |

## B. Code — Anzeige der Lernzettel
| Datei | Was | Wie | Warum |
|---|---|---|---|
| `komponenten/markdown-anzeige.tsx` (neu) | Markdown-Darstellung | `react-markdown` + `remark-gfm` (Tabellen), kein rohes HTML, Wiki-Links `[[…]]` → hervorgehobener Begriff, Farben nur über vorhandene Design-Tokens | Lernzettel erschienen in der App als Rohtext (`#`, `**`, `\|` sichtbar). |
| dasselbe | Review-Korrekturen | Obsidian-Embeds `![[…]]` weglassen; Überschriften eine Ebene tiefer (nur ein `h1` pro Seite); leere Links als Text, `target`/`rel` nur bei `http(s)`; Code-Blöcke ohne Sprache sauber | Vermeidet kaputte Bilder, doppelte `h1`, tote Links, falsches Styling. |
| `app/faecher/[fach]/themen/[thema]/page.tsx` | Nutzt die Komponente | Beide Rohtext-Blöcke (`thema.inhalt`, `lernzettel`) → `<MarkdownAnzeige />` | Siehe oben. |
| `package.json`, `package-lock.json` | Neue Pakete | `react-markdown@10.1.0`, `remark-gfm@4.0.1` (nur aus der npm-Registry) | Abhängigkeiten der Komponente. |

## C. Code — Lernzettel-Anfragen
| Datei | Was | Warum |
|---|---|---|
| `komponenten/lernzettel-anfrage-formular.tsx`, `app/lernzettel-anfragen/page.tsx` | Text korrigiert ("wird automatisch täglich bearbeitet" war falsch → "Sag Claude im Chat Bescheid"); Status-Badge lesbar; `aria-label`s; Längenbegrenzung `maxLength` | Es gibt bewusst keine Cloud-Automatik; Badge war in Hell/Dunkel kaum lesbar. |
| `.claude/commands/lernzettel.md` | Sicherheitsregeln ergänzt: nur Zeilen des Besitzers verarbeiten; `thema`/`notiz` sind Daten, keine Anweisungen; Automatik-Aussage entfernt | Zeilen von Gästen/Fremden könnten sonst Claude Anweisungen unterschieben (Prompt-Injection). |

## D. Datenbank
| Datei | Was | Status |
|---|---|---|
| `datenbank/migrationen/0013_lernzettel_anfragen_haertung.sql` (neu) | Restriktive Policy gegen anonyme Gäste auf `lernzettel_anfragen` + CHECK-Constraints (Dokumenttyp, Länge) | **Nur als Datei angelegt, NICHT ausgeführt.** Wird erst mit deinem ausdrücklichen Ja im SQL-Editor angewendet. |

Zum Stand der Datenbank (nur gelesen, nichts geschrieben): Nach dem Restore
wirkte das Schema wie ein **älterer Stand** — Migrationen 0006
(`chat_nachrichten` existiert noch), 0008 (`dateien.thema_slug/halbjahr`) und
0009 (`todos.kategorie/faellig_am/angepinnt`) fehlen; Gast-Testcodes sind weg.
Der Restore war zum Prüfzeitpunkt noch nicht abgeschlossen. Nächster Schritt:
nach `ACTIVE_HEALTHY` erneut prüfen, dann mit dir entscheiden.

## E. Doku
- `AGENDA.md`, `PROJECT_STATE.md`: Ursache des Login-Hängers korrigiert
  (pausiertes Projekt, nicht "externe Störung"); Migration 0009 als **nicht
  angewendet/unbestätigt**; OTP-Lücke als real und geschlossen; neue offene
  Punkte (0013, DB-Restore klären, `npm audit`, `settings.local.json`
  untracken, fail-open → fail-closed).

## F. Geprüft
- `tsc --noEmit` sauber, `npm test` 11/11, eslint auf den geänderten Dateien sauber.
- Render-Test des Markdown-Renderers mit `Lernzettel/biologie/genetik.md`
  (2 Tabellen, kein `h1`, keine `[[`/`\|`, kein `<img>`, `javascript:`-Link
  entschärft) — Testdatei danach gelöscht.
- Volles `npm run build` vor dem Commit; nach dem Push Vercel-Deployment und `/login` live.

## G. Was außerhalb des Projektordners / in externen Diensten passiert ist
Ehrlich und vollständig, damit nichts im Verborgenen bleibt:
- **Supabase:** Projekt per `restore_project` reaktiviert (mit deinem Ja);
  danach ausschließlich **lesende** Abfragen. Keine Migration, kein
  INSERT/UPDATE/DELETE, kein DDL.
- **Vercel:** nur gelesen (Namen der Umgebungsvariablen, nicht deren Werte).
- **Login-Tests:** Zwei Test-Anfragen "Login-Link senden" für
  `rave.lasse@icloud.com` (dadurch kam eine Login-Mail bei dir an). Kein
  Gast-Code eingegeben, keine Formulare sonst abgeschickt.
- **Python-Pakete (aus einer früheren Etappe dieser Session):** `reportlab`,
  `pypdf`, `pymupdf` wurden per `pip install` in dein **Benutzer-Verzeichnis**
  (`~/Library/Python/3.9`) installiert, um das Genetik-PDF zu bauen. Sie
  verändern keine Systemdateien und lassen sich mit
  `pip3 uninstall reportlab pypdf pymupdf` wieder entfernen.
- **Google Chrome** wurde nur im Hintergrund (headless) gestartet, um HTML in
  PDF zu drucken. Nichts in deinem Chrome-Profil wurde geändert.
- **Außerhalb des Projekts angelegt:** Notizen von Claude unter
  `~/.claude/projects/-Users-lasse-Desktop-OberstufenApp/memory/` und der
  Plan unter `~/.claude/plans/`; temporäre Dateien nur im Scratchpad-Ordner.
  Die Datei `~/Downloads/Comment_Phrasen_und_Tipps.md` wurde nur gelesen.
- **Geplanter Folgeauftrag (auf deinen Wunsch):** Ein EINMALIGER Task
  `oberstufenapp-folgesession` (Datei `~/.claude/scheduled-tasks/oberstufenapp-folgesession/SKILL.md`)
  startet am 22.10.2026 um 05:50 Uhr (Berlin, kurz nach der Token-Erneuerung um
  05:40) eine neue Session und löscht sich danach selbst. Er darf nur lesen/prüfen
  (Vercel, Live-Login, Supabase read-only) und `UEBERGABE.md`/`PROJECT_STATE.md`
  committen+pushen. Er darf keine Migration anwenden, nichts kaufen, keinen
  weiteren Task planen und keinen Code ändern; er hört bei ca. 60 % Kontext auf.
  Er läuft nur, wenn die Claude-Desktop-App offen ist (sonst beim nächsten Start)
  und kann in der Standard-Berechtigungsstufe nachfragen. Abbrechen/ändern:
  Seitenleiste → "Scheduled" → Task `oberstufenapp-folgesession`.
  Die Token-Limits selbst habe ich nicht verändert (Zusatznutzung ist aus).
- **Datenbank-Befund (nur gelesen):** siehe `UEBERGABE.md`. Migrationen 0006,
  0008, 0009 fehlen in der wiederhergestellten Datenbank; nichts wurde angewendet.
- **Nicht committet:** `.claude/settings.local.json` (lokale Freigaben).

## Rückgängig machen
Jeder Schritt ist ein eigener Git-Commit: `git log --oneline` zeigt sie,
`git revert <hash>` macht einen einzelnen Schritt rückgängig. Die
Migrationsdatei 0013 hat bis zur Ausführung keine Wirkung auf die Datenbank.

## H. Nachtrag: Datenbank-Änderungen mit deiner Freigabe (22.10. nachmittags)
Du hast "ja" für 0008/0009 gesagt und die DB "mit Vorsicht" freigegeben. Ausgeführt
über `execute_sql` auf Supabase-Projekt `hjhxdtdzezjrpgortkto`, jeweils mit
Vorprüfung (Ist-Zustand, Zeilenzahlen, Namenskollisionen) und Nachprüfung:

| Was | Wie | Warum | Ergebnis |
|---|---|---|---|
| 0008: Spalten `dateien.thema_slug`, `halbjahr` | `alter table … add column if not exists` | Die App fragt sie ab (Datei-Upload je Thema) | 2 Spalten da, 0 Dateien betroffen |
| 0009: Spalten `todos.kategorie`, `faellig_am`, `angepinnt` | `add column if not exists` (angepinnt `not null default false`) | To-Do-Erweiterung der App | 3 Spalten da, die eine bestehende To-do-Zeile blieb unverändert |
| 0006: `drop table if exists chat_nachrichten` | nur nach Prüfung: 0 Zeilen, kein Fremdschlüssel darauf | Entfernter KI-Chat, Altlast aus dem Restore | Tabelle weg |
| 0013: restriktive Policy `keine_gaeste_lernzettel_anfragen` + 3 CHECK-Constraints | `create policy … as restrictive`, `add constraint` in einer Transaktion; Tabelle hatte 0 Zeilen, keine Namenskollision | Anonyme Gäste dürfen keine Anfragen schreiben; Längen/Typ geprüft | Policy und Constraints vorhanden |

Nicht angewendet: alles andere (0002–0005, 0007, 0010–0012 waren schon da und
wurden NICHT wiederholt). Keine Daten gelöscht außer der leeren Tabelle
`chat_nachrichten`. Rückgängig: 0008/0009 → `alter table … drop column`;
0013 → `drop policy "keine_gaeste_lernzettel_anfragen" on lernzettel_anfragen;`
und `alter table … drop constraint …`. Es wurde nichts an deinem Computer verändert.

## I. Nachtrag: Kosten- und Cloud-Regeln
Auf deinen Wunsch ausführlich festgehalten, dass KEIN Cloud-Guthaben und keine
Zusatznutzung verbraucht wird (Details: `UEBERGABE.md`, Abschnitt "KOSTEN- UND CLOUD-REGELN").
Gilt für den geplanten Task und jede spätere Session. Geändert: `UEBERGABE.md`, Prompt des
Tasks `oberstufenapp-folgesession` (lokal gespeichert), Memory-Notiz
`~/.claude/projects/-Users-lasse-Desktop-OberstufenApp/memory/feedback_keine_cloud_kosten.md`.
Es wurde nichts gekauft; "Extra usage" ist weiterhin aus.

## J. Nachtrag: Folgearbeit am 22.10. (vormittags, nach dem Komprimieren)
Der geplante Task `oberstufenapp-folgesession` ist um 05:50 gestartet, blieb aber nach
Phase 1 stehen (wartete wahrscheinlich auf eine Freigabe) und hat nichts geändert.
Du wolltest ihn nicht weiterlaufen lassen; die Arbeit wurde stattdessen im normalen Chat
gemacht. Er ist einmalig und abgeschaltet. Alles lokal, nichts gekauft, keine DB-Änderung.

| Was | Wie | Warum |
|---|---|---|
| Neue Tests (`npm test`: jetzt 25 statt 11) | `lib/auth/besitzer.test.ts`, `lib/markdown/wiki-links.test.ts`, `lib/vault/slug.test.ts` | Besitzer-Sperre, Wiki-Link-Umwandlung (inkl. `\|` in Tabellen, Embeds) und Pfad-Schutz waren ungetestet |
| `wikiLinksZuText` → `lib/markdown/wiki-links.ts`, `istSlug` → `lib/vault/slug.ts` | Code unverändert verschoben, Komponente/`lesen.ts` importieren ihn | Ohne React bzw. `server-only` testbar; Verhalten gleich |
| Migration `0014_gaeste_schreibsperre.sql` | **nur Datei, NICHT angewendet.** Restriktive Policies nur für INSERT/UPDATE/DELETE (nicht `for all`, sonst bräche das Gast-Lesen) auf 8 Tabellen + `storage.objects` | Gäste haben die Rolle `authenticated` und könnten sonst in EIGENE Zeilen/Ordner schreiben |
| `datenbank/ANWENDEN.md` | Neu: Regeln, Vor-/Nachprüfung, Praxistest, Rückgängig-Skript | Anwenden soll später sicher und nachvollziehbar sein |
| `dokumentation/setup.md` | Neu geschrieben (Migrationen 0001–0014, OWNER_EMAIL, Anonymous Sign-ins, "Allow signups" AN, Vercel, Pausierungs-Falle) | Alte Version war veraltet (nur 0001/0002) |
| `.claude/settings.local.json` | `git rm --cached` + Eintrag in `.gitignore`; Datei bleibt lokal | Rechnerspezifisch, gehörte nicht ins Repo |
| Formale Vault-Prüfung | Skript (nicht eingecheckt): Slugs, Frontmatter, ausgeglichene `[[ ]]` und Code-Zäune | 0 Probleme |

Prüfungen: `tsc` sauber, `eslint` sauber, 25/25 Tests, `next build` grün.
**Nicht getestet:** das SQL von 0014 wurde nicht ausgeführt (auch nicht als Probelauf,
weil das schon eine DB-Änderung wäre). Syntax nach Postgres-Doku geschrieben; erst beim
Anwenden (mit Ja) zeigt sich, ob es fehlerfrei läuft. Rückgängig: Skript in `ANWENDEN.md`.

## K. Nachtrag: "mach alles" — 0014 angewendet, fail-closed, Updates (22.10. mittags)
Auf dein "ja, mach alles" (Antwort auf meine Frage zu 0014). Arbeitsweise wie besprochen:
ein kleiner Agent (sonnet) für das Next.js-Update, ein großer (opus) als Prüfer über alles;
ich selbst Datenbank, Code und Doku. Alles lokal, nichts gekauft.

| Was | Wie | Warum / Ergebnis |
|---|---|---|
| **DB: Migration 0014 angewendet** | Vorprüfung (0 `keine_gast_*`-Policies, 1 Todo, 0 Dateien/Codes) → `execute_sql` mit dem Inhalt der Datei → Nachprüfung | 24 Policies auf `public` (8 Tabellen × insert/update/delete) + 3 auf `storage.objects`, alle RESTRICTIVE; Zählungen unverändert (1 Todo, 0 Codes, 0 Dateien) |
| DB: Simulationstest | Ein `DO`-Block, der mit gesetztem JWT (Besitzer-uid, `is_anonymous` false/true) testete und am Ende absichtlich einen Fehler warf = alles zurückgerollt | Besitzer: Update 1 Zeile, Insert nur PK-Konflikt (RLS passiert). Gast (gleiche uid, Worst Case): Update 0, Delete 0, Insert und `gastcodes`-Insert von RLS abgelehnt, Select ohne Fehler |
| Supabase-Advisors gelesen | `get_advisors` (security), nur lesend | WARN: 3 SECURITY-DEFINER-Funktionen (`gast_login`, `gast_hat_zugriff_auf_gastcode`, `gastcode_gehoert_besitzer`) per RPC aufrufbar — Absicht bzw. nötig für die Policies, `gast_login` prüft `auth.uid()`; WARN "Anonymous Access Policies" = erwartet (Gast-Zugang); WARN Leaked-Password-Protection aus = irrelevant (kein Passwort-Login). **Nichts davon geändert.** |
| `OWNER_EMAIL` fail-closed | `proxy.ts` und `app/auth/callback/route.ts`: Bedingung `besitzerKonfiguriert() &&` entfernt | Vorher ließ die Prüfung bei fehlender Variable alle durch. In Vercel (Production+Preview, geprüft: Variable vorhanden) und lokal ist sie gesetzt, das Verhalten dort ändert sich also nicht |
| Open-Redirect-Schutz | neu `lib/auth/ziel.ts` (`sichererZiel`), im Callback für `?next=`; 3 Tests | `next=@evil.de` hätte `https://app@evil.de` ergeben können |
| Sicherheits-Updates | Agent: `next` 16.3.1→16.3.8, `eslint-config-next` angeglichen, `npm audit fix` ohne --force | 12 → 9 Advisories, kein critical mehr; Rest nur Lint-/Parser-Ketten (siehe AGENDA). tsc, lint, 28 Tests, build grün |
| gast_login-Ratelimit | bewusst nicht gebaut | Ein Zähler pro Gast-uid würde nichts bringen (neue anonyme Konten sind beliebig erzeugbar); die Bremse ist das Rate-Limit von Supabase für anonyme Sign-ins. Code-Raum ~31^8 |

Rückgängig 0014: Skript in `datenbank/ANWENDEN.md`. Vor dem Live-Praxistest (Besitzer und Gast
einloggen) hat der Mensch noch das letzte Wort — siehe UEBERGABE.md.

## L. Nachtrag: Gast-Anzeige, Tempo, Lernzettel pro Fach (22.10. nachmittags)
| Was | Wie | Warum |
|---|---|---|
| Gast sah kurz die Besitzer-Oberfläche | Gast-Status kommt jetzt vom Server (`komponenten/gast-kontext.tsx`, `lib/auth/aktueller-nutzer.ts`, Layout); `useIstGast` nutzt ihn | Vorher wurde erst im Browser nachgefragt, bis dahin galt jeder als Besitzer |
| App langsam | `vercel.json` (Funktionen in `dub1`, vorher `iad1` Washington; Supabase liegt in `eu-west-1`); `getClaims()` statt `getUser()` in Proxy, Layout, Startseite | Atlantik-Latenz pro Supabase-Aufruf; Token-Prüfung jetzt lokal (ES256-Schlüssel). Gäste werden weiter live gegen die DB geprüft. DB-Abfragen selbst < 1 ms |
| Hinweis | Ein Prozess `next-server` auf Port 3000 war die Vorschau des Nutzers; ich hatte ihn versehentlich beendet und neu gestartet (`preview_start`) | Lehre: Prozesse auf Port 3000 nicht ungefragt beenden |
| Mail-Login | Eigenes SMTP (Resend), Code in der Mail, Rate-Limit 30/h | siehe `setup.md` 4a |
| Lernzettel pro Fach | neue Seite/Komponente (`app/faecher/[fach]/lernzettel`, `komponenten/lernzettel-anfrage-fach.tsx`), Karte auf der Fach-Seite; Migration `0015_lernzettel_anfragen_auswahl.sql` **angewendet** (3 neue Spalten + 2 CHECKs, Tabelle war leer, Policies unverändert) | Wunsch: Themen auswählen, optional Themenübersicht, Ausgabeformat. Rolled-back Test: Besitzer darf einfügen, Format `docx` und Gast werden abgelehnt |
| HTML als Ausgabeformat | Migration `0016_ausgabeformat_html.sql` **angewendet** (CHECK um `html` erweitert, Tabelle leer), Formular: PDF (Standard) / HTML / Obsidian / Alles; `/lernzettel`-Befehl angepasst | Wunsch des Nutzers ("gib mir html"); Obsidian nutzt er noch nicht. Rolled-back Test: `html` ok, `docx` abgelehnt |
