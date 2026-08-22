# PROJECT_STATE.md

> Diese Datei ist die Brücke zwischen Claude-Code-Sessions für dieses Projekt.
> Lies sie zuerst, bevor du irgendetwas anderes tust. Sie wird laufend
> aktualisiert — wenn du diese Session beendest, aktualisiere sie erneut.

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
  **seit dieser Session voll funktionsfähig und live getestet** (siehe Abschnitt 2)

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
  todos/, auth/callback/
komponenten/               Eigene React-Komponenten (deutsch benannt)
  gast-abmelden-knopf.tsx  NEU diese Session: Logout-Button für Gäste in der Navigation
lib/
  abitur/                  Rechenkern: regeln.ts (Konstanten), berechnung.ts (reine Funktionen,
                            getestet in berechnung.test.ts), typen.ts
  supabase/                client.ts (Browser), server.ts (Server Components)
  vault/                   lesen.ts (fs-Zugriff auf Vault/Lernzettel-Ordner, "server-only")
  hooks/use-ist-gast.ts    Client-Hook: prüft ob eingeloggter User anonym (=Gast) ist
  faecher-daten.ts         Statische Liste aller 13 Fächer + Metadaten (Niveau, Kernfach etc.)
  noten.ts                 Typen fürs Noten-Tracking
datenbank/migrationen/     0001–0011, chronologisch, siehe Abschnitt 6
Vault/, Lernzettel/        Obsidian-kompatible Markdown-Dateien (Vault/<fach>/<thema>.md)
Abi-Regeln/Hamburg.md      Recherchierte Referenz für die Abitur-Rechenregeln
AGENDA.md                  Laufend gepflegte Liste offener/unklarer Punkte (siehe unten)
proxy.ts                   Next.js 16 "Middleware" — Auth-Gate + Gast-Aktiv-Check für alle Routen
```

## 2. Aktueller Stand (genau JETZT)

**Session-Ergebnis:** Die vorherige Session endete mit einem blockierenden
Login-Bug auf der Vercel-Live-Instanz. Dieser Bug ist **vollständig gelöst**,
und zusätzlich wurden zwei weitere Bugs im Gast-Zugang gefunden und behoben.
Der komplette Gast-Zugang-Flow (Login, Lesezugriff, Rauswurf, Logout) wurde
sowohl lokal als auch **live auf `oberstufenapp.vercel.app` verifiziert** und
funktioniert einwandfrei. Kein offener Blocker mehr — working tree ist
clean (bis auf eine lokale, nicht committete `.claude/settings.local.json`,
die nicht zu diesem Projekt-Code gehört).

**Was in dieser Session behoben wurde (chronologisch):**

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
   noch nicht geschlossen:** Der OTP-Code-Verify-Pfad
   (`app/login/page.tsx` → `codeBestaetigen` → `supabase.auth.verifyOtp`)
   hat diesen `OWNER_EMAIL`-Check NICHT (nur der Magic-Link-Callback hat ihn).
   Aktuell ungefährlich, weil der 6-stellige Code sowieso nicht per Mail
   ankommt (siehe Punkt 4), aber sollte bei Gelegenheit nachgezogen werden.
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

**Alle drei Commits dieser Session (bereits gepusht, `origin/main` aktuell):**
```
5c11f86 Gäste sofort rauswerfen bei Deaktivierung, Logout-Button ergänzt
ec81b57 Gastcode-RLS-Rekursion gefixt, SMTP-Anforderung dokumentiert
3db11cd Projekt-Zwischenstand für nahtlosen Session-Wechsel dokumentiert (vorherige Session)
```

## 3. Nächste Schritte (konkret, in Reihenfolge)

Kein Blocker mehr offen. Nutzer hat die Session mit "erstmal schluss" beendet,
nachdem der Gast-Zugang komplett fertig und live verifiziert war. Beim
Wiedereinstieg:

- [ ] Fragen, ob der Nutzer mit den offenen `AGENDA.md`-Punkten weitermachen
      möchte, allen voran:
  - **Abiturprüfungsfächer P1–P4** — Nutzer muss sie selbst in `/abitur`
    eintragen, sobald sie feststehen (Status beim letzten Stand: noch nicht
    entschieden)
  - **SMTP-Setup für OTP-Code-Mail** (siehe Abschnitt 2, Punkt 7) — nur
    angehen, wenn der Nutzer es von sich aus wieder anspricht, wurde bewusst
    zurückgestellt
- [ ] Bei Gelegenheit (nicht dringend, siehe Abschnitt 2 Punkt 2): den
      fehlenden `OWNER_EMAIL`-Check auch im OTP-Code-Verify-Pfad
      (`app/login/page.tsx` → `codeBestaetigen`) ergänzen, analog zu
      `app/auth/callback/route.ts`. Aktuell ungefährlich, aber inkonsistent.
- [ ] Übrige `AGENDA.md`-Punkte wie gehabt: Lernzettel-Vorlage,
      Doppelgewichtungs-Regel Block I, Untis-Integration (ohne
      Zugangsdaten-Weitergabe an Claude), Lehrplan/Bio-Präsentationen.

## 4. Offene Probleme / Bugs

**Kein aktiver Blocker.** Alle in dieser Session gefundenen Bugs sind
behoben und live verifiziert (siehe Abschnitt 2).

**Bekannte, bewusst nicht behobene Kleinigkeit:**
- OTP-Code-Verify-Pfad hat keinen `OWNER_EMAIL`-Check (siehe Abschnitt 2,
  Punkt 2 und Abschnitt 3). Niedrige Priorität, aktuell nicht ausnutzbar.

**Kleinere, bereits behobene Bugs aus früheren Sessions (zur Erinnerung,
falls sie wieder auftauchen):**
- `noten-eingabe.tsx`: Ziel-Note-Upsert fehlte `onConflict: "user_id,fach_id"`
- `abitur-uebersicht.tsx`: Speicherfehler wurden nicht angezeigt (stiller
  Fehlschlag durch fehlende Migration 0007) → Fehleranzeige ergänzt
- `todo-liste.tsx`: `Date.now()` direkt im Render verletzte Reacts
  Purity-Regel → in `useState(() => Date.now())` verschoben
- `theme-umschalter.tsx`: gleiche Purity-Regel bei einem Mounted-Check →
  `useSyncExternalStore` statt `useEffect`+`setState`

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
  durchzulassen.
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
- **Bewusst NICHT gemacht:** Lernzettel-Vorlage/Struktur wurde nicht
  festgelegt (siehe `AGENDA.md`). SMTP-Setup für OTP-Code-Mail wurde bewusst
  zurückgestellt (siehe Abschnitt 2, Punkt 7).

## 6. Wichtige Dateipfade & Referenzen

- `lib/supabase/client.ts` / `lib/supabase/server.ts` — Browser-/Server-Client
- `app/login/page.tsx` — `signInWithOtp`, `verifyOtp`, `signInAnonymously`,
  `rpc("gast_login", ...)` — alle drei Auth-Wege in einer Datei
- `app/auth/callback/route.ts` — Magic-Link-Callback mit `OWNER_EMAIL`-Check
- `proxy.ts` — Auth-Gate + Gast-Aktiv-Check (neu diese Session) für alle Routen
- `komponenten/gaeste-verwaltung.tsx` — Code erstellen/deaktivieren/löschen
- `komponenten/gast-abmelden-knopf.tsx` — neu diese Session, Logout für Gäste
- `komponenten/navigation.tsx` — zeigt Gast-Badge/Logout-Button serverseitig

**Alle Datenbank-Migrationen (chronologisch, Status: alle bestätigt
ausgeführt, inkl. 0010 und 0011 die in dieser Session nachgeholt/neu
erstellt wurden):**
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
0010_gastzugang.sql          gastcodes, gast_sitzungen, RPC gast_login(),
                              additive Gast-SELECT-Policies (in dieser Session nachträglich
                              ausgeführt, war zuvor vergessen worden)
0011_gastcode_rls_rekursion_fix.sql   SECURITY DEFINER-Hilfsfunktionen, behebt
                              "infinite recursion detected in policy for relation gastcodes"
```

**Environment Variables:**
- Lokal in `.env.local` (nicht committed, siehe `.gitignore`):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OWNER_EMAIL`
  — **verifiziert korrekt** (siehe Abschnitt 2, Punkt 1)
- `.env.local.example` (committed, leeres Template) zeigt die benötigten Keys
- In Vercel: dieselben drei Variablen — **verifiziert korrekt und live
  getestet**, Bug aus der letzten Session vollständig behoben
- Echte Werte (Supabase-Projekt `hjhxdtdzezjrpgortkto`):
  - `NEXT_PUBLIC_SUPABASE_URL=https://hjhxdtdzezjrpgortkto.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaHhkdGR6ZXpqcnBnb3J0a3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTk0NjEsImV4cCI6MjEwMjU3NTQ2MX0.i_e7yowLczNwx_mKpxry8NngVnssVkXCec690N4qJ5o`
  - `OWNER_EMAIL=rave.lasse@icloud.com`
- **Wichtiger Merksatz für künftiges Debugging:** Wenn ein Env-Var-Wert in
  Vercel neu eingefügt wird, IMMER aus der lokalen `.env.local` kopieren
  (nie aus der Vercel-eigenen Anzeige — die maskiert bestehende Werte mit
  `•`-Zeichen, die sich versehentlich mitkopieren lassen).

**Supabase-Dashboard-Einstellungen (Status verifiziert diese Session):**
- Authentication → Providers → "Allow anonymous sign-ins": **aktiviert**
  (Voraussetzung für Gast-Zugang)
- Authentication → Providers → "Allow new users to sign up": **aktiviert**
  (siehe Abschnitt 2, Punkt 2 — bewusst so, NICHT deaktivieren)
- Authentication → Templates → Magic Link: Quelltext-Bearbeitung gesperrt
  ohne eigenes SMTP-Setup (siehe Abschnitt 2, Punkt 7)

**Externe Doku/Referenzen:**
- `Abi-Regeln/Hamburg.md` — recherchierte Abitur-Regeln, gegen aktuelle
  Handreichung der Schule prüfen (steht in `AGENDA.md`)
- `dokumentation/setup.md` — allgemeine Setup-Anleitung, noch NICHT um
  Gast-Zugang/OWNER_EMAIL-Schritte aktualisiert
- `node_modules/next/dist/docs/` — bei Unsicherheit zu Next.js-16-Verhalten

## 7. Git-Status

```
$ git status
On branch main
Your branch is up to date with 'origin/main'.
(nur .claude/settings.local.json lokal verändert, nicht Teil des Projekt-Codes)

$ git log --oneline -6
5c11f86 Gäste sofort rauswerfen bei Deaktivierung, Logout-Button ergänzt
ec81b57 Gastcode-RLS-Rekursion gefixt, SMTP-Anforderung dokumentiert
3db11cd Projekt-Zwischenstand für nahtlosen Session-Wechsel dokumentiert
be456aa Fehleranzeige für Abitur-Speichern (statt stillem Fehlschlag)
2419cee Gast-Zugang mit Codes, OTP-Code-Login, To-Do/Noten erweitert
9552bf1 Initial commit: OberstufenApp Grundgerüst + Abitur, Noten, Vault, To-Dos
```

Alles committed und zu `origin/main` gepusht, Vercel hat automatisch
deployed. Kein Zwischencommit nötig.

## 8. Zum direkten Wiedereinstieg

> Lies zuerst `PROJECT_STATE.md` im Projekt-Root komplett durch. Der
> Env-Var-Bug UND der Gast-Zugang sind seit der letzten Session vollständig
> gelöst und live verifiziert — kein Blocker offen. Frag den Nutzer, ob er
> mit den offenen `AGENDA.md`-Punkten weitermachen möchte (v.a.
> Abiturprüfungsfächer P1–P4), ohne bereits geklärte Dinge nochmal
> anzusprechen.
