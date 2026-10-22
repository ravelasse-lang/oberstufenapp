# PROJECT_STATE.md

> Diese Datei ist die Brücke zwischen Claude-Code-Sessions für dieses Projekt.
> Lies sie zuerst, bevor du irgendetwas anderes tust. Sie wird laufend
> aktualisiert — wenn du diese Session beendest, aktualisiere sie erneut.

> **MASSGEBLICH (22.10.2026 nachmittags) — überschreibt ältere Aussagen weiter unten:**
> Die Migrationen **0006, 0008, 0009 und 0013 sind auf der Supabase-Datenbank
> ANGEWENDET und verifiziert** (mit Ja des Nutzers). Aussagen wie "0009 fehlt /
> unbestätigt" oder "0013 nur als Datei" weiter unten sind damit überholt. Details:
> `UEBERGABE.md` (Abschnitt "Datenbank-Stand"). Nächster DB-Schritt wäre nur
> Migration 0014 (Gäste-Schreibsperre), noch nicht vorbereitet/angewendet.

## 1. Projektüberblick

**Was:** "OberstufenApp" — eine persönliche Web-App für einen Oberstufenschüler
(Gymnasium Ohlstedt, Hamburg, Profil "MEDIZINPLUS": Biologie erhöht + Chemie,
Psychologie, Seminar grundlegend). Rein statische App ohne LLM-Aufrufe zur
Laufzeit, mit Fokus auf:
- Fächerübersicht (13 Fächer, aktuell nur Biologie & Chemie mit voller Funktion)
- Noten-Tracking mit Verlaufskurve pro Fach
- **Hamburger Abitur-Rechenkern** (Block I/II, Einbringung/Streichen,
  Punkte-zu-Note-Umrechnung) — echte, recherchierte Regeln, siehe `Abi-Regeln/Hamburg.md`
- Obsidian-kompatibler Themen-/Lernzettel-Vault (Markdown+Frontmatter im Repo)
- Datei-Upload (Supabase Storage)
- Fächerübergreifende To-Do-Liste (mit Kategorie, Fälligkeit, Pin, Löschen)
- **Gast-Zugang**: der Besitzer kann Codes generieren, mit denen Besucher sich
  anonym und nur-lesend einloggen können; Codes jederzeit widerrufbar —
  **voll funktionsfähig und live getestet** (siehe Abschnitt 2)
- **Lernzettel-Workflow**: `/lernzettel`-Slash-Befehl (Claude Code erstellt
  PDF + Obsidian-Markdown) und In-App-Anfrageformular `/lernzettel-anfragen`
  (Postfach-Tabelle `lernzettel_anfragen`); Claude Code selbst ist der KI-Tutor

**Nutzer-Kontext:** Programmier-Anfänger, braucht klare Schritt-für-Schritt-
Anleitungen für alles außerhalb des Codes (Supabase-Dashboard, GitHub, Vercel).
Nutzt E-Mail `rave.lasse@icloud.com`, GitHub-Account `ravelasse-lang` (nur
Google-Login, kein Passwort — braucht Personal Access Token fürs Terminal).

**Tech-Stack:**
- Next.js 16.3.1 (App Router, TypeScript, Turbopack) — **WICHTIG:** in Next.js
  16 heißt `middleware.ts` neu `proxy.ts` (Funktion heißt `proxy`, nicht
  `middleware`). Das Next.js-Dev-Setup schreibt automatisch eine `AGENTS.md`
  mit dem Hinweis, bei Unsicherheit `node_modules/next/dist/docs/` zu lesen,
  da die installierte Version von Trainingsdaten abweichen kann.
- Tailwind CSS v4 (CSS-basiert, keine `tailwind.config.ts`, Custom Properties
  in `app/globals.css`, `@custom-variant dark (&:where(.dark, .dark *))` nötig
  für class-basiertes Dark Mode mit `next-themes`)
- Supabase: Auth (Magic Link + OTP-Code + anonyme Gast-Logins), Postgres mit
  RLS, Storage. Projekt-Referenz: `hjhxdtdzezjrpgortkto`
  (Dashboard: https://supabase.com/dashboard/project/hjhxdtdzezjrpgortkto)
- Hosting: Vercel, Projekt `oberstufenapp` unter Team/Scope `lr26`
  (Settings: https://vercel.com/lr26/oberstufenapp/settings) — Live-URL:
  https://oberstufenapp.vercel.app — Deploy passiert automatisch bei jedem
  Push auf `main` (GitHub-Integration)
- GitHub: privates Repo `ravelasse-lang/oberstufenapp`
  (https://github.com/ravelasse-lang/oberstufenapp)
- Tests: `node:test` über `tsx`, Skript `npm test` (`lib/**/*.test.ts`)
- Keine KI-API mehr (Gemini wurde entfernt)

**Ordnerstruktur (Kurzüberblick):**
```
app/                      Next.js-Seiten (Pflichtnamen: page.tsx, layout.tsx, route.ts)
  faecher/[fach]/          Fach-Hauptseite + Unterseiten (themen, hochladen, fortschritt)
  abitur/                  Streichen-Übersicht + Live-Abischnitt-Berechnung
  gaeste/                  Gäste-Code-Verwaltung (nur Besitzer, redirect für Gäste)
  login/                   Magic Link + OTP-Code + Gast-Code, alles in einer Seite
  lernzettel-anfragen/     Formular + Liste für Lernzettel-Anfragen (Migration 0012)
  todos/, auth/callback/
komponenten/               Eigene React-Komponenten (deutsch benannt)
  gast-abmelden-knopf.tsx  Logout-Button für Gäste in der Navigation
  lernzettel-anfrage-formular.tsx   Formular für Lernzettel-Anfragen
  markdown-anzeige.tsx     Markdown-Renderer (react-markdown 10.1.0 + remark-gfm 4.0.1)
.claude/commands/          lernzettel.md = Slash-Befehl /lernzettel
lib/
  abitur/                  Rechenkern: regeln.ts (Konstanten), berechnung.ts (reine Funktionen,
                            getestet in berechnung.test.ts), typen.ts
  supabase/                client.ts (Browser), server.ts (Server Components)
  vault/                   lesen.ts (fs-Zugriff auf Vault/Lernzettel-Ordner, "server-only")
  hooks/use-ist-gast.ts    Client-Hook: prüft ob eingeloggter User anonym (=Gast) ist
  auth/besitzer.ts         gemeinsamer Besitzer-Vergleich (OWNER_EMAIL), genutzt u.a. von proxy.ts
  faecher-daten.ts         Statische Liste aller 13 Fächer + Metadaten (Niveau, Kernfach etc.)
  noten.ts                 Typen fürs Noten-Tracking
datenbank/migrationen/     0001–0013, chronologisch, siehe Abschnitt 6
Vault/, Lernzettel/        Obsidian-kompatible Markdown-Dateien (Vault/<fach>/<thema>.md,
                            Lernzettel/<fach>/*.md, dazu PDFs unter Lernzettel/biologie/)
Abi-Regeln/Hamburg.md      Recherchierte Referenz für die Abitur-Rechenregeln
AGENDA.md                  Laufend gepflegte Liste offener/unklarer Punkte (siehe unten)
proxy.ts                   Next.js 16 "Middleware" — Auth-Gate + Gast-Aktiv-Check für alle Routen
```

## 2. Aktueller Stand (genau JETZT)

**Stand:** Der Env-Var-Bug und der Gast-Zugang sind gelöst und live getestet.
Seitdem kamen Lehrplan-Stubs, Genetik-Lernzettel, `/lernzettel`-Befehl,
Anfrage-Formular und das Englisch-Material dazu. In dieser Session wurden
außerdem umgesetzt, reviewt und committet: die Besitzer-Prüfung in `proxy.ts`,
der Markdown-Renderer und die Slug-Validierung (siehe unten). Den genauen
Git-Stand beim Wiedereinstieg mit `git status` / `git log --oneline -10`
prüfen (Abschnitt 7).

**Fertig und committet:**
- **Env-Var-Bug (Vercel, ISO-8859-1-Fehler) gelöst** — Ursache war ein aus der
  maskierten Vercel-Anzeige kopierter Anon-Key (Bullet-Zeichen). Magic-Link-
  Login läuft seitdem (Details unten, Punkt 1).
- **Gast-Zugang fertig, live getestet:** Migrationen 0010 und 0011
  (RLS-Rekursions-Fix) ausgeführt; `proxy.ts` wirft Gäste sofort raus, wenn
  ihr Code deaktiviert/gelöscht ist; Logout-Knopf für Gäste
  (`komponenten/gast-abmelden-knopf.tsx`). **Wichtig:** "Allow new users to
  sign up" MUSS in Supabase aktiviert bleiben (sonst scheitern anonyme
  Gast-Logins mit "signup not allowed"); "Allow anonymous sign-ins" ist
  aktiviert. Eine frühere AGENDA-Zeile, die das Deaktivieren verlangte, war
  falsch und ist korrigiert.
- **GitHub/Vercel:** Repo `ravelasse-lang/oberstufenapp` und Vercel-Deploy
  (https://oberstufenapp.vercel.app) laufen, Push auf `main` deployt
  automatisch.
- **Lehrplan MEDIZINPLUS eingebunden:** 11 Vault-Themen-Stubs für
  Biologie/Chemie/Psychologie unter `Vault/` (Quelle:
  `Abi-Regeln/quellen/Profiltext-MedizinPlus-Psychologie.pdf`). Psychologie
  bleibt `aktiv: false`.
- **Genetik-Lernzettel:** `Lernzettel/biologie/genetik.md`,
  `genetik-glossar.md` und gestaltetes PDF `genetik-lernzettel.pdf` (Quelle
  `genetik-lernzettel-quelle.html`, gerendert per Headless-Chrome).
- **Lernzettel-Workflow:** Slash-Befehl `.claude/commands/lernzettel.md`
  (`/lernzettel`); Migration 0012 (`lernzettel_anfragen`) wurde vom Nutzer
  ausgeführt; Seite `/lernzettel-anfragen` + `komponenten/lernzettel-anfrage-
  formular.tsx` + Nav-Link "Lernzettel" existieren, Build ist sauber.
  **Ein echter Live-Klicktest durch den Nutzer steht noch aus.**
- **Englisch-Material:** `Vault/englisch/comment-und-discussion.md` und
  `Lernzettel/englisch/comment-und-discussion.md` (Comment & Discussion
  Phrasen, Englisch eA, vom Nutzer bereitgestellt). Englisch ist weiterhin
  `aktiv: false`.

**In dieser Session umgesetzt und reviewt (Commit in dieser Session):**
- `proxy.ts` erzwingt `OWNER_EMAIL` für nicht-anonyme Nutzer — schließt die
  reale OTP-Lücke (Session ohne Durchlauf von `/auth/callback`, siehe Punkt 2
  unten). Dazu: Cookie-sicherer Redirect-Helper in `proxy.ts` und gemeinsamer
  Besitzer-Vergleich `lib/auth/besitzer.ts`. **Entscheidung des Nutzers:** Bei
  fehlender `OWNER_EMAIL` wird vorerst DURCHGELASSEN (fail-open); später auf
  fail-closed umstellen (offener Punkt). `OWNER_EMAIL` ist in Vercel für
  Production und Preview gesetzt (geprüft).
- Markdown-Renderer für die Lernzettel-/Themen-Anzeige
  (`komponenten/markdown-anzeige.tsx` mit `react-markdown` 10.1.0 und
  `remark-gfm` 4.0.1; Änderungen an `app/faecher/[fach]/themen/[thema]/page.tsx`,
  `package.json`, `package-lock.json`).
- Slug-Validierung in `lib/vault/lesen.ts`.

**Supabase-Projekt war pausiert (Ursache des Login-Hängers):** Das Projekt
`hjhxdtdzezjrpgortkto` war PAUSIERT (Status INACTIVE; der Free-Plan pausiert
nach Inaktivität) und wurde heute per `restore_project` reaktiviert. Danach
funktioniert der Login wieder (Magic-Link-Mail wird verschickt); Link-Klick und
Code-Verifikation sind noch NICHT getestet. **Lehre:** Bei "Failed to fetch"
bzw. hängenden Auth-Requests zuerst den Projektstatus im Supabase-Dashboard
prüfen.

**DB-Stand nach der Reaktivierung (Momentaufnahme, Status war noch RESTORING):**
Das Schema wirkt wie ein ÄLTERER Stand. Laut read-only-Prüfung fehlen
Migration 0006 (Tabelle `chat_nachrichten` existiert noch), 0008
(`dateien.thema_slug`, `dateien.halbjahr`) und 0009 (`todos.kategorie`,
`faellig_am`, `angepinnt`). Vorhanden: `gastcodes`, `gast_sitzungen`,
`lernzettel_anfragen`, `block_1_ergebnisse`, die drei Gast-Funktionen
(SECURITY DEFINER, `search_path=public`), RLS überall aktiv, Bucket
`fach-dateien` privat, Gäste ohne Schreibrechte. Zählungen: gastcodes 0, noten
0, dateien 0, todos 1 — mögliche Datenrücksetzung (Gast-Testcodes sind weg).
Nach Status ACTIVE_HEALTHY erneut nur lesend prüfen; fehlende Migrationen
0006/0008/0009 anwenden NUR mit ausdrücklichem Ja des Nutzers.

**Unbestätigt / offen im Stand:**
- **Migration 0009** (todos-Erweiterung): gilt als NICHT angewendet/unbestätigt
  (die read-only-Prüfung fand die Spalten nicht).
- **Login nach Reaktivierung:** Link-Klick und Code-Verifikation noch nicht
  getestet.

**Zuvor behoben (Bugfix-Session, chronologisch; alles live verifiziert):**

1. **ISO-8859-1-Header-Bug beim Supabase-Login (Vercel-Live) — gelöst.**
   Ursache war NICHT das, was die letzte Session vermutet hatte (kein
   Encoding-Problem beim Kopieren). Tatsächliche Ursache: Beim ersten
   Löschen+Neuanlegen von `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel wurde
   versehentlich die **maskierte Anzeige** aus der Vercel-Oberfläche kopiert
   (`eyJhbGci••••••••…`, echte Bullet-Zeichen U+2022 statt der echten
   Zeichen) statt des echten Werts. Verifiziert durch ein Browser-Konsolen-
   Skript, das den Key direkt aus dem ausgelieferten JS-Bundle extrahiert und
   auf Zeichen außerhalb ISO-8859-1 prüft (Länge war korrekt: 208 Zeichen,
   aber ab Zeichen 9 nur noch `•`). Fix: Key aus der lokalen `.env.local`
   (nicht aus Vercel, nicht aus dem Chat) neu eingefügt, dann in Vercel
   redeployed. Login (Magic Link) funktioniert seitdem einwandfrei, live
   getestet.
2. **"Allow new user signups" in Supabase testweise deaktiviert, dann wieder
   aktiviert.** War fälschlich als zusätzliche Absicherung empfohlen worden,
   blockiert aber auch anonyme Gast-Logins (Supabase behandelt die intern als
   "Signup"). Der Code-seitige Schutz in `app/auth/callback/route.ts` (prüft
   `user.email === OWNER_EMAIL`, loggt sonst sofort wieder aus) reicht als
   Absicherung für den Magic-Link-Pfad aus — die Dashboard-Sperre ist dafür
   nicht nötig und würde den Gast-Zugang kaputt machen. **Bekannte Lücke,
   Stand der Bugfix-Session:** Der OTP-Code-Verify-Pfad
   (`app/login/page.tsx` → `codeBestaetigen` → `supabase.auth.verifyOtp`)
   hat diesen `OWNER_EMAIL`-Check NICHT (nur der Magic-Link-Callback hat ihn).
   Damals fälschlich als ungefährlich eingestuft, weil der 6-stellige Code
   nicht per Mail ankommt (siehe Punkt 7) — die Lücke war real. **Jetzt
   geschlossen:** `proxy.ts` erzwingt `OWNER_EMAIL` für nicht-anonyme Nutzer
   (umgesetzt und reviewt, siehe oben; bei fehlender `OWNER_EMAIL` vorerst
   fail-open).
3. **Migration 0010 (`gastzugang.sql`) war nie ausgeführt worden** —
   `/gaeste` zeigte "Could not find the table 'public.gastcodes'". Nutzer hat
   sie im SQL-Editor nachgeholt.
4. **RLS-Rekursionsfehler beim Erstellen von Gast-Codes** ("infinite
   recursion detected in policy for relation gastcodes"): Die
   `gastcodes`-Policy für Gäste fragte `gast_sitzungen` ab, dessen
   Besitzer-Policy wiederum `gastcodes` abfragte — Postgres-Rekursions-Loop.
   Gefixt mit Migration `0011_gastcode_rls_rekursion_fix.sql`
   (SECURITY DEFINER-Hilfsfunktionen `gast_hat_zugriff_auf_gastcode` und
   `gastcode_gehoert_besitzer`, die RLS beim internen Check umgehen). Vom
   Nutzer im SQL-Editor ausgeführt, funktioniert seitdem.
5. **Gäste blieben nach "Rauswerfen" eingeloggt** (Session bestand fort, nur
   RLS verweigerte im Hintergrund die Daten — verwirrend, sah nicht wie ein
   Rauswurf aus). Gefixt in `proxy.ts`: bei jedem Request wird für anonyme
   Nutzer per Join `gast_sitzungen` → `gastcodes` geprüft, ob der Code noch
   `aktiv` ist; wenn nicht (deaktiviert ODER gelöscht, cascade löscht dann
   auch die `gast_sitzungen`-Zeile), wird sofort ausgeloggt und zu `/login`
   umgeleitet. Zusätzlich neuer Logout-Button `komponenten/gast-abmelden-
   knopf.tsx` in der Navigation für Gäste (vorher nur eine reine
   Info-Anzeige "👁 Nur ansehen" ohne Aktion). Beides live getestet:
   Deaktivierung + Reload → sofortiger Rauswurf bestätigt.
6. **Versucht und wieder verworfen:** Ein `/login?code=XXX`-Link, der den
   Gast-Modus automatisch vorausfüllt. Nutzer wollte das nicht (nur den
   normalen Link `/login`) — Code wurde vor dem Commit wieder zurückgesetzt,
   NICHT im Repo.
7. **SMTP-Anforderung für OTP-Code-Mail entdeckt, bewusst zurückgestellt.**
   Der 6-stellige Code kommt aktuell nicht in der Login-Mail an (nur der
   Link), weil Supabase das Bearbeiten des E-Mail-Templates
   (`{{ .Token }}` ergänzen) nur erlaubt, wenn ein eigener SMTP-Anbieter
   eingerichtet ist ("Set up custom SMTP to edit the source"). Nutzer hat
   sich entschieden, das erstmal zu überspringen — Login per Link
   funktioniert ja bereits vollständig. Steht in `AGENDA.md`.

**Commits der Bugfix-Session (bereits gepusht):**
```
5c11f86 Gäste sofort rauswerfen bei Deaktivierung, Logout-Button ergänzt
ec81b57 Gastcode-RLS-Rekursion gefixt, SMTP-Anforderung dokumentiert
3db11cd Projekt-Zwischenstand für nahtlosen Session-Wechsel dokumentiert (vorherige Session)
```
Spätere Commits siehe Abschnitt 7.

## 3. Nächste Schritte (konkret, in Reihenfolge)

Kein harter Blocker. Beim Wiedereinstieg:

- [ ] **DB-Restore-Stand klären:** nach Status ACTIVE_HEALTHY erneut nur
      lesend prüfen (siehe Abschnitt 2); fehlende Migrationen 0006/0008/0009
      anwenden NUR mit ausdrücklichem Ja des Nutzers (SQL für 0009:
      `datenbank/migrationen/0009_todos_erweiterung.sql`). Migration 0009 gilt
      als NICHT angewendet/unbestätigt.
- [ ] **Login nach Reaktivierung testen:** Magic-Link-Klick und Code-Verifikation
      (Magic-Link-Mail wird bereits verschickt).
- [ ] **Migration `0013_lernzettel_anfragen_haertung.sql`** (restriktive
      Gäste-Sperre auf `lernzettel_anfragen` + CHECK-Constraints) liegt als
      Datei bereit, ist NICHT angewendet — nur mit Freigabe des Nutzers.
- [ ] **`npm audit`:** bekannte Advisories für `next` 16.0–16.3.x (Update auf
      16.4.x separat prüfen), js-yaml (über gray-matter) und sharp.
- [ ] **`.claude/settings.local.json`** ist getrackt → untracken und in
      `.gitignore` aufnehmen (separater Schritt).
- [ ] **Entscheidung:** `OWNER_EMAIL` fehlt → derzeit fail-open (Entscheidung
      des Nutzers); später auf fail-closed umstellen.
- [ ] **Nutzer fragen / bitten:**
  - Live-Klicktest `/lernzettel-anfragen` (Anfrage absenden, prüfen).
  - **Offene Frage:** Englisch mit nur dem Comment-&-Discussion-Material
    freischalten (`aktiv: true`) oder auf mehr Material warten?
  - **Abiturprüfungsfächer P1–P4** — Nutzer trägt sie selbst in `/abitur` ein,
    sobald sie feststehen.
  - **SMTP-Setup für OTP-Code-Mail** (Abschnitt 2, Punkt 7) — nur auf
    Wunsch des Nutzers.
- [ ] Übrige `AGENDA.md`-Punkte wie gehabt (Mathe-Materialien, Foto,
      Flipped-Classroom-Link, Domain, GoodNotes, Präsentations-Button,
      KI-Tutor-Vision, Untis-Integration, Bio-Präsentationen …) — nichts
      davon erfinden, Fächer ohne echte Lehrplan-Quelle bleiben inaktiv.

## 4. Offene Probleme / Bugs

**Kein harter Blocker.** Offen bzw. unbestätigt:
- **DB-Stand nach Restore** unklar (Schema wirkt älter, mögliche
  Datenrücksetzung, siehe Abschnitt 2). **Migration 0009** gilt als NICHT
  angewendet/unbestätigt; ohne sie schlagen Todo-Hinzufügen/Anpinnen fehl
  ("Could not find the 'faellig_am' column ..."). Gleiches gilt für 0006/0008
  (laut Momentaufnahme fehlend).
- **Login nach Reaktivierung:** Link-Klick/Code-Verifikation noch nicht getestet.
- **`OWNER_EMAIL` fehlt → fail-open** (Entscheidung des Nutzers, vorerst);
  später fail-closed.
- **Migration 0013** liegt bereit, nicht angewendet.
- **`npm audit`-Advisories** (`next` 16.0–16.3.x, js-yaml, sharp) und getrackte
  `.claude/settings.local.json` (siehe Abschnitt 3).
- **Live-Klicktest `/lernzettel-anfragen`** durch den Nutzer steht aus.
- **Setup-Doku** `dokumentation/setup.md` nicht um Gast-Zugang/OWNER_EMAIL
  aktualisiert (siehe Abschnitt 6).

**Kleinere, bereits behobene Bugs aus früheren Sessions (zur Erinnerung,
falls sie wieder auftauchen):**
- `noten-eingabe.tsx`: Ziel-Note-Upsert fehlte `onConflict: "user_id,fach_id"`
- `abitur-uebersicht.tsx`: Speicherfehler wurden nicht angezeigt (stiller
  Fehlschlag durch fehlende Migration 0007) → Fehleranzeige ergänzt
- `todo-liste.tsx`: `Date.now()` direkt im Render verletzte Reacts
  Purity-Regel → in `useState(() => Date.now())` verschoben
- `theme-umschalter.tsx`: gleiche Purity-Regel bei einem Mounted-Check →
  `useSyncExternalStore` statt `useEffect`+`setState`
- Env-Var-Bug Vercel (Bullet-Zeichen im Anon-Key) — gelöst, siehe Abschnitt 2

## 5. Wichtige Entscheidungen & Begründungen

- **KI-Chat (Gemini) komplett entfernt.** App soll "rein statisch" sein,
  keine LLM-API zur Laufzeit.
- **Fächerliste blieb unverändert** — Hamburg liefert nur die Rechenregeln,
  ersetzt nicht die 13 Fächer.
- **Abitur-Metadaten in `lib/faecher-daten.ts` (TypeScript), nicht in einer
  Supabase-Tabelle**, weil die App Fächer-Anzeigedaten nirgends aus der
  DB-Tabelle `faecher` liest (die dient nur als FK-Ziel).
- **`zaehltDoppelt` ist ein explizites, nicht abgeleitetes Flag** — die Regel
  "Kernfach mit erhöhtem Niveau, das Prüfungsfach ist, zählt doppelt" ist
  mehrdeutig, nur für Biologie gesetzt.
- **Block I (`block_1_ergebnisse`) bekam eine eigene Tabelle** statt die
  bestehende `noten`-Tabelle zu erweitern (informelles Tracking vs. formale
  Abitur-Buchführung sind bewusst getrennt).
- **`lib/abitur/berechnung.ts` ist reine, getestete Funktion** (11 Tests via
  `node:test`), weil Korrektheit hier abiturrelevant ist.
- **Gast-Zugang über anonyme Supabase-Auth statt eigenem Cookie/Service-Role-
  System.** Gibt dem Gast einen echten `auth.uid()`, wodurch der komplette
  bestehende Client-Code unverändert funktioniert. Schreibrechte bleiben
  exklusiv beim Besitzer (RLS-Policies erlauben nur ihm INSERT/UPDATE/DELETE).
- **Kein Service-Role-Key verwendet** — anonyme Auth + additive RLS-Policies
  reichen für den Use-Case, geringeres Risiko als Service-Role (bypasst RLS
  komplett).
- **`proxy.ts`-Bypass bei fehlenden Env-Vars entfernt.** War ursprünglich für
  lokale Dev-Bequemlichkeit gedacht, stellte sich aber als echte
  Sicherheitslücke heraus (alle Seiten ohne Login erreichbar bei fehlender
  Env-Var). Jetzt: `/login` bleibt erreichbar, alles andere gibt 500 statt
  durchzulassen. (Davon zu unterscheiden: fehlende `OWNER_EMAIL` lässt die
  Besitzer-Prüfung vorerst durch — fail-open, Entscheidung des Nutzers, später
  fail-closed.)
- **RLS-Rekursion mit SECURITY DEFINER-Hilfsfunktionen lösen, nicht mit
  Policy-Umbau.** Wenn zwei Tabellen sich in ihren RLS-Policies gegenseitig
  per Subquery referenzieren, bricht Postgres mit "infinite recursion
  detected" ab. Standard-Supabase-Pattern: eine `SECURITY DEFINER`-Funktion
  (läuft als Funktionseigentümer, i.d.R. `postgres`, der RLS nicht
  unterliegt) kapselt den internen Check und durchbricht so den Kreis. Siehe
  `datenbank/migrationen/0011_gastcode_rls_rekursion_fix.sql` als Vorlage,
  falls das Muster nochmal gebraucht wird (z.B. bei künftigen Gast-Policies).
- **Gast-Rauswurf gehört ins Middleware/Server-Layer (`proxy.ts`), nicht nur
  in RLS.** RLS verweigert zwar die Daten korrekt, aber die Session bleibt
  bestehen und die UI zeigt keinen klaren "du wurdest rausgeworfen"-Zustand.
  `proxy.ts` prüft jetzt aktiv pro Request und loggt aus + redirected, sobald
  der Code inaktiv ist — nicht erst beim nächsten Login-Versuch.
- **`OWNER_EMAIL`-Dashboard-Sperre ("Allow new user signups" deaktivieren")
  NICHT verwenden**, weil sie anonyme Gast-Logins mitblockiert. Der
  Code-seitige Check in `app/auth/callback/route.ts` ist die richtige
  Verteidigungsebene für den Magic-Link-Pfad.
- **Design-Tokens:** `--accent`/`--accent-foreground` invertieren zwischen
  Light und Dark — Buttons müssen IMMER `text-accent-foreground` statt
  hartem `text-white` verwenden.
- **Claude Code selbst ist der KI-Tutor** (kein In-App-LLM, keine bezahlte
  API). Die App bleibt rein statisch; Lernzettel entstehen in Chat-Sessions
  über `/lernzettel`.
- **Keine erfundenen Lehrplaninhalte:** Fächer/Themen nur aus echten Quellen
  (z.B. MEDIZINPLUS-PDF); Fächer ohne Quelle bleiben `aktiv: false`
  (derzeit auch Englisch und Psychologie).
- **Kein Service-Role-Key, daher keine Cloud-Automatik für Lernzettel-
  Anfragen.** Ein täglicher Cloud-Check würde Service-Role-Key oder hinterlegte
  Nutzer-Session brauchen — Sicherheitsrisiko, bewusst nicht gebaut.
  Workflow: Anfrage in der App → Nutzer sagt im Chat Bescheid → Claude
  verarbeitet über `/lernzettel`.
- **Anon-Key aus `.env.local` kopieren, nie aus der Vercel-Anzeige**
  (maskierte `•`-Zeichen), siehe Abschnitt 6.
- **Bewusst NICHT gemacht:** Lernzettel-Vorlage/Struktur wurde nicht
  festgelegt (siehe `AGENDA.md`). SMTP-Setup für OTP-Code-Mail wurde bewusst
  zurückgestellt (siehe Abschnitt 2, Punkt 7).

## 6. Wichtige Dateipfade & Referenzen

- `lib/supabase/client.ts` / `lib/supabase/server.ts` — Browser-/Server-Client
- `app/login/page.tsx` — `signInWithOtp`, `verifyOtp`, `signInAnonymously`,
  `rpc("gast_login", ...)` — alle drei Auth-Wege in einer Datei
- `app/auth/callback/route.ts` — Magic-Link-Callback mit `OWNER_EMAIL`-Check
- `proxy.ts` — Auth-Gate + Gast-Aktiv-Check für alle Routen, zusätzlich
  `OWNER_EMAIL`-Erzwingung für nicht-anonyme Nutzer (Cookie-sicherer
  Redirect-Helper); `lib/auth/besitzer.ts` — gemeinsamer Besitzer-Vergleich
- `komponenten/gaeste-verwaltung.tsx` — Code erstellen/deaktivieren/löschen
- `komponenten/gast-abmelden-knopf.tsx` — Logout für Gäste
- `app/lernzettel-anfragen/page.tsx` + `komponenten/lernzettel-anfrage-formular.tsx`
  — Lernzettel-Anfragen (Tabelle `lernzettel_anfragen`, Migration 0012)
- `.claude/commands/lernzettel.md` — Slash-Befehl `/lernzettel` (Vault/Lernzettel
  durchsuchen, Metadaten aus Supabase `dateien`, Websuche, PDF via HTML +
  Headless-Chrome + Obsidian-Markdown)
- `Lernzettel/biologie/` — `genetik.md`, `genetik-glossar.md`,
  `genetik-lernzettel.pdf`, `genetik-lernzettel-quelle.html`
- `Lernzettel/englisch/comment-und-discussion.md`,
  `Vault/englisch/comment-und-discussion.md` — Comment & Discussion Phrasen
  (Englisch eA); Englisch noch `aktiv: false`
- `Vault/biologie|chemie|psychologie/` — 12 Themen (11 Stubs aus dem
  MEDIZINPLUS-PDF + `genetik.md`), Quelle `Abi-Regeln/quellen/Profiltext-
  MedizinPlus-Psychologie.pdf`
- `komponenten/markdown-anzeige.tsx` — Markdown-Renderer (react-markdown 10.1.0, remark-gfm 4.0.1)
- `komponenten/navigation.tsx` — zeigt Gast-Badge/Logout-Button serverseitig

**Alle Datenbank-Migrationen (chronologisch). Frühere Annahme: 0001–0008, 0010,
0011 und 0012 ausgeführt. Nach der Supabase-Reaktivierung zeigt die Prüfung
(Momentaufnahme, Status RESTORING) jedoch einen älteren Schemastand: 0006, 0008
und 0009 fehlen; 0009 gilt als NICHT angewendet/unbestätigt. 0013 liegt als
Datei bereit, nicht angewendet. Erneute lesende Prüfung nach ACTIVE_HEALTHY:**
```
0001_schema.sql              faecher, dateien, fortschritt_eintraege (ungenutzt),
                              todos, chat_nachrichten (später gedroppt) + 13 Fächer eingefügt
0002_rls_policies.sql        RLS für obige Tabellen
0003_flexibler_ordner.sql    Kontingenz-Migration (nicht mehr nötig, da 0001 direkt korrekt war)
0004_noten.sql                noten, fach_ziele
0005_storage_bucket.sql      Storage-Bucket "fach-dateien" + Policies
0006_entferne_ki_chat.sql    drop table chat_nachrichten
0007_abitur_bloecke.sql      block_1_ergebnisse, pruefungsfaecher
0008_dateien_thema_halbjahr.sql   dateien.thema_slug, dateien.halbjahr
0009_todos_erweiterung.sql   todos.kategorie, todos.faellig_am, todos.angepinnt
                              (NICHT angewendet/unbestätigt; Spalten fehlen laut DB-Prüfung)
0010_gastzugang.sql          gastcodes, gast_sitzungen, RPC gast_login(),
                              additive Gast-SELECT-Policies (nachträglich in der Bugfix-Session
                              ausgeführt, war zuvor vergessen worden)
0011_gastcode_rls_rekursion_fix.sql   SECURITY DEFINER-Hilfsfunktionen, behebt
                              "infinite recursion detected in policy for relation gastcodes"
0012_lernzettel_anfragen.sql Tabelle lernzettel_anfragen (Postfach für Lernzettel-Anfragen,
                              RLS: eigene Zeilen); vom Nutzer ausgeführt, Tabelle vorhanden
0013_lernzettel_anfragen_haertung.sql   restriktive Gäste-Sperre auf lernzettel_anfragen +
                              CHECK-Constraints; Datei liegt bereit, NICHT angewendet
```

**Environment Variables:**
- Lokal in `.env.local` (nicht committed, siehe `.gitignore`):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OWNER_EMAIL`
  — **verifiziert korrekt** (siehe Abschnitt 2, Punkt 1)
- `.env.local.example` (committed, leeres Template) zeigt die benötigten Keys
- In Vercel: dieselben drei Variablen — **verifiziert korrekt und live
  getestet**, Env-Var-Bug vollständig behoben
- Echte Werte (Supabase-Projekt `hjhxdtdzezjrpgortkto`):
  - `NEXT_PUBLIC_SUPABASE_URL=https://hjhxdtdzezjrpgortkto.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaHhkdGR6ZXpqcnBnb3J0a3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTk0NjEsImV4cCI6MjEwMjU3NTQ2MX0.i_e7yowLczNwx_mKpxry8NngVnssVkXCec690N4qJ5o`
  - `OWNER_EMAIL=rave.lasse@icloud.com`
- **Wichtiger Merksatz für künftiges Debugging:** Wenn ein Env-Var-Wert in
  Vercel neu eingefügt wird, IMMER aus der lokalen `.env.local` kopieren
  (nie aus der Vercel-eigenen Anzeige — die maskiert bestehende Werte mit
  `•`-Zeichen, die sich versehentlich mitkopieren lassen).

**Supabase-Dashboard-Einstellungen (Status verifiziert in der Bugfix-Session):**
- Authentication → Providers → "Allow anonymous sign-ins": **aktiviert**
  (Voraussetzung für Gast-Zugang)
- Authentication → Providers → "Allow new users to sign up": **aktiviert**
  (siehe Abschnitt 2, Punkt 2 — bewusst so, NICHT deaktivieren; sonst
  scheitern anonyme Gast-Logins mit "signup not allowed")
- Authentication → Templates → Magic Link: Quelltext-Bearbeitung gesperrt
  ohne eigenes SMTP-Setup (siehe Abschnitt 2, Punkt 7)

**Externe Doku/Referenzen:**
- `Abi-Regeln/quellen/Profiltext-MedizinPlus-Psychologie.pdf` — Lehrplan-Quelle
  (Semesterthemen Bio/Chemie/Psychologie/Seminar)
- `Abi-Regeln/Hamburg.md` — recherchierte Abitur-Regeln, gegen aktuelle
  Handreichung der Schule prüfen (steht in `AGENDA.md`)
- `dokumentation/setup.md` — allgemeine Setup-Anleitung, noch NICHT um
  Gast-Zugang/OWNER_EMAIL-Schritte aktualisiert
- `node_modules/next/dist/docs/` — bei Unsicherheit zu Next.js-16-Verhalten

## 7. Git-Status

Beim Wiedereinstieg `git status` und `git log --oneline -10` ausführen — der
Stand ändert sich laufend, deshalb steht hier kein Status-Snapshot.

Letzte Commits (Stand `git log --oneline -8` bei der Doku-Erstellung; neuere
Commits dieser Session kommen oben dazu):
```
03833ad Comment & Discussion Phrasen-Referenz für Englisch eA eingepflegt
48bf7fd Redesigntes Genetik-PDF, /lernzettel-Befehl und Anfrage-Formular
2435a35 Genetik-Lernzettel als PDF exportiert, Tabellen-Link-Bug gefixt
98ddff2 Ausführlicher Genetik-Lernzettel + Glossar für die erste Bio-Stunde
41b1b7d Skill-Recherche abgeschlossen: claude-tutor & learn-faster-kit empfohlen
ce9cb9d Entscheidung dokumentiert: keine Fächer ohne echte Lehrplan-Quelle freischalten
532ab6c Subagents-Wunsch präzisiert: integrieren statt nur erklären
a9f2890 Graphify-Skill für später auf die Agenda genommen
```

## 8. Zum direkten Wiedereinstieg

> Lies zuerst `PROJECT_STATE.md` und `AGENDA.md` im Projekt-Root komplett.
> Env-Var-Bug und Gast-Zugang sind gelöst und live verifiziert. Prüfe als
> Erstes `git status` / `git log --oneline -10`. Der Login-Hänger kam vom
> pausierten Supabase-Projekt (reaktiviert), nicht von einer externen
> Störung. Als Nächstes: DB-Restore-Stand klären (nach ACTIVE_HEALTHY erneut
> nur lesend prüfen; Migrationen 0006/0008/0009 und 0013 nur mit ausdrücklichem
> Ja des Nutzers anwenden), Login (Link-Klick/Code) testen. Frag den Nutzer
> nach dem Live-Klicktest `/lernzettel-anfragen` und ob Englisch mit nur dem
> Comment-&-Discussion-Material freigeschaltet werden soll (Fächer sonst nur
> mit echter Lehrplan-Quelle, nichts erfinden). Danach weiter mit den offenen
> `AGENDA.md`-Punkten (v.a. Abiturprüfungsfächer P1–P4). Bereits geklärte
> Dinge nicht nochmal ansprechen.
