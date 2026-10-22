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
- **Nicht committet:** `.claude/settings.local.json` (lokale Freigaben).

## Rückgängig machen
Jeder Schritt ist ein eigener Git-Commit: `git log --oneline` zeigt sie,
`git revert <hash>` macht einen einzelnen Schritt rückgängig. Die
Migrationsdatei 0013 hat bis zur Ausführung keine Wirkung auf die Datenbank.
