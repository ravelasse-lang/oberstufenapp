# PROJECT_STATE.md

> Diese Datei ist die Brücke zwischen Claude-Code-Sessions für dieses Projekt.
> Lies sie zuerst, bevor du irgendetwas anderes tust. Sie wird laufend
> aktualisiert — wenn du diese Session beendest, aktualisiere sie erneut.

## 1. Projektüberblick

**Was:** "OberstufenApp" — eine persönliche Web-App für einen Oberstufenschüler
(Gymnasium Ohlstedt, Hamburg, Profil "MEDIZINPLUS": Biologie erhöht + Chemie,
Psychologie, Seminar grundlegend). Ursprünglich als reine Lern-App mit
KI-Fach-Spezialist geplant, wurde aber mitten in der Session zu einer **rein
statischen App ohne LLM-Aufrufe** umgebaut, mit Fokus auf:
- Fächerübersicht (13 Fächer, aktuell nur Biologie & Chemie mit voller Funktion)
- Noten-Tracking mit Verlaufskurve pro Fach
- **Hamburger Abitur-Rechenkern** (Block I/II, Einbringung/Streichen,
  Punkte-zu-Note-Umrechnung) — echte, recherchierte Regeln, siehe `Abi-Regeln/Hamburg.md`
- Obsidian-kompatibler Themen-/Lernzettel-Vault (Markdown+Frontmatter im Repo)
- Datei-Upload (Supabase Storage)
- Fächerübergreifende To-Do-Liste (mit Kategorie, Fälligkeit, Pin, Löschen)
- **Gast-Zugang**: der Besitzer kann Codes generieren, mit denen Besucher sich
  anonym und nur-lesend einloggen können; Codes jederzeit widerrufbar

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
  https://oberstufenapp.vercel.app
- GitHub: privates Repo `ravelasse-lang/oberstufenapp`
  (https://github.com/ravelasse-lang/oberstufenapp)
- Tests: `node:test` über `tsx`, Skript `npm test` (`lib/**/*.test.ts`)
- Keine KI-API mehr (Gemini wurde entfernt, siehe Abschnitt 5)

**Ordnerstruktur (Kurzüberblick):**
```
app/                      Next.js-Seiten (Pflichtnamen: page.tsx, layout.tsx, route.ts)
  faecher/[fach]/          Fach-Hauptseite + Unterseiten (themen, hochladen, fortschritt)
  abitur/                  Streichen-Übersicht + Live-Abischnitt-Berechnung
  gaeste/                  Gäste-Code-Verwaltung (nur Besitzer, redirect für Gäste)
  login/                   Magic Link + OTP-Code + Gast-Code, alles in einer Seite
  todos/, auth/callback/
komponenten/               Eigene React-Komponenten (deutsch benannt)
lib/
  abitur/                  Rechenkern: regeln.ts (Konstanten), berechnung.ts (reine Funktionen,
                            getestet in berechnung.test.ts), typen.ts
  supabase/                client.ts (Browser), server.ts (Server Components)
  vault/                   lesen.ts (fs-Zugriff auf Vault/Lernzettel-Ordner, "server-only")
  hooks/use-ist-gast.ts    Client-Hook: prüft ob eingeloggter User anonym (=Gast) ist
  faecher-daten.ts         Statische Liste aller 13 Fächer + Metadaten (Niveau, Kernfach etc.)
  noten.ts                 Typen fürs Noten-Tracking
datenbank/migrationen/     0001–0010, chronologisch, siehe Abschnitt 6
Vault/, Lernzettel/        Obsidian-kompatible Markdown-Dateien (Vault/<fach>/<thema>.md)
Abi-Regeln/Hamburg.md      Recherchierte Referenz für die Abitur-Rechenregeln
AGENDA.md                  Laufend gepflegte Liste offener/unklarer Punkte (siehe unten)
proxy.ts                   Next.js 16 "Middleware" — Auth-Gate für alle Routen
```

## 2. Aktueller Stand (genau JETZT)

**Woran gerade gearbeitet wird:** Debugging eines Live-Bugs auf der
Vercel-Produktions-Deployment. Kein Code wird gerade verändert — es geht um
eine **Umgebungsvariablen-Konfiguration bei Vercel**, die der Nutzer selbst
im Browser korrigiert.

**Exakter Zustand / bekannter Fehler:**
Auf `https://oberstufenapp.vercel.app` schlägt **jeder** Supabase-Aufruf im
Browser fehl (normaler E-Mail-Login UND Gast-Code-Login), mit exakt dieser
Fehlermeldung, die direkt im Login-Formular angezeigt wird:

```
Failed to execute 'fetch' on 'Window': Failed to read the 'headers' property
from 'RequestInit': String contains non ISO-8859-1 code point.
```

Diagnose (durch mich, mit Browser-Tool selbst nachgestellt, reproduzierbar in
frischem Tab, betrifft sowohl `signInWithOtp` als auch `signInAnonymously`):
Es geht **kein Netzwerk-Request überhaupt raus** (im Network-Log nicht
sichtbar) — der Fehler passiert schon beim Konstruieren des `fetch()`-Aufrufs
im Supabase-JS-Client, bevor irgendetwas gesendet wird. Das bedeutet: einer
der Header-Werte, die der Supabase-Client aus den Env-Variablen baut
(`apikey`/`Authorization` aus `NEXT_PUBLIC_SUPABASE_ANON_KEY`, oder die
Basis-URL aus `NEXT_PUBLIC_SUPABASE_URL`), enthält ein Zeichen außerhalb von
ISO-8859-1 (Latin-1) — typischerweise durch ein unsichtbares Zeichen beim
Copy-Paste in Vercel entstanden (z.B. ein UTF-8 BOM, eine "smart quote", ein
Non-Breaking-Space).

**Ursache vermutlich:** Beim ersten Vercel-Setup wurden Key und Value
versehentlich in ein einziges Feld gepastet (siehe Chatverlauf), das wurde
zwar korrigiert, aber dabei ist wohl ein unsichtbares Zeichen übrig geblieben
oder neu hinzugekommen.

**Bereits unternommener Fix (Ergebnis noch nicht verifiziert!):**
Ich habe den Nutzer angeleitet, in Vercel
(https://vercel.com/lr26/oberstufenapp/settings/environment-variables)
sowohl `NEXT_PUBLIC_SUPABASE_ANON_KEY` als auch `NEXT_PUBLIC_SUPABASE_URL`
**komplett zu löschen und neu anzulegen** (nicht nur zu bearbeiten), mit den
Werten aus Abschnitt 6. Der Nutzer hat das gemacht ("hab ich gemacht") und
wollte danach redeployen — **wir haben aber vor dem Redeploy/Test pausiert**,
weil der Context-Speicherstand angefordert wurde. **Der nächste Schritt ist,
zu prüfen, ob der Fehler nach dem Redeploy weg ist.**

**Letzte 5 abgeschlossene Schritte in dieser Session (chronologisch, neueste zuletzt):**
1. Großer Kurswechsel umgesetzt: KI-Chat entfernt, Hamburger Abitur-Rechenkern
   gebaut (mit recherchierten, mehrquellig verifizierten Regeln), Obsidian-
   Vault-Grundgerüst, Themen-Seiten pro Fach
2. Design komplett überarbeitet nach Referenzbild (warme Cream/Dunkel-Palette,
   große Rundungen, schwebende Pill-Navigation, `accent`/`accent-foreground`-Tokens)
3. GitHub-Repo + Vercel-Deployment eingerichtet (inkl. GitHub Personal Access
   Token, da der Nutzer nur Google-Login ohne Account-Passwort hat)
4. To-Do-Liste erweitert (Löschen, Anpinnen, Kategorie, Fälligkeit, Erledigt
   ausblendbar), Noten editierbar/löschbar gemacht, Gesamt-Fortschrittskurve
   auf der Startseite, eA/gA-Kürzel überall
5. **Gast-Zugang gebaut**: anonyme Supabase-Logins per Code, RLS-Policies für
   reinen Lesezugriff, Verwaltungsseite `/gaeste`, OTP-Code-Login zusätzlich
   zum Magic Link, Sicherheitslücke in `proxy.ts` geschlossen (Bypass bei
   fehlenden Env-Vars entfernt), `OWNER_EMAIL`-Absicherung in
   `app/auth/callback/route.ts` — **und jetzt: Debugging des oben
   beschriebenen Env-Var-Bugs**

## 3. Nächste Schritte (konkret, in Reihenfolge)

- [ ] **Nutzer fragen, ob der Redeploy in Vercel abgeschlossen ist.** Falls
      noch nicht: warten, nicht selbst pushen (kein Code-Problem).
- [ ] Live-Seite `https://oberstufenapp.vercel.app/login` selbst im
      Browser-Tool testen: E-Mail eingeben → "Login-Link senden" klicken →
      prüfen, ob die Fehlermeldung weg ist (dann sollte "Mail an ... 
      verschickt" erscheinen statt eines Fehlers).
  - **Falls der Fehler weiterhin auftritt:** Das Löschen+Neuanlegen hat nicht
    geholfen. Nächste Diagnose-Schritte (siehe auch Abschnitt 4):
    - Nutzer bitten, die Werte NICHT aus dem Chat zu kopieren, sondern die
      Datei `.env.local` direkt zu öffnen (lokal, TextEdit im Nur-Text-Modus)
      und von dort zu kopieren, um Formatierungs-Artefakte aus der Chat-UI
      auszuschließen
    - Alternativ: Nutzer bitten, den Wert manuell einzutippen (mühsam, aber
      schließt Zwischenablage-Korruption sicher aus)
    - Prüfen, ob `vercel` CLI installierbar ist (`npm install -g vercel`,
      dann `vercel login` im Terminal — browserbasiert, keine
      Passwort-Eingabe nötig), um `vercel env pull` zu nutzen und die
      tatsächlich gespeicherten Bytes zu inspizieren
- [ ] Sobald normaler Login funktioniert: Gast-Code-Flow komplett testen
  1. Nutzer loggt sich normal ein (Besitzer)
  2. Geht zu `/gaeste`, erstellt einen neuen Code (z.B. Bezeichnung "Test")
  3. Nutzer gibt mir den generierten Code im Chat
  4. Ich logge mich in meinem eigenen Browser-Tool mit `/login` →
     "Ich habe einen Gast-Code" → Code eingeben → prüfen: komme ich rein,
     sehe ich Daten, sind Formulare/Buttons zum Bearbeiten ausgeblendet?
  5. Nutzer deaktiviert den Code über "Rauswerfen" in `/gaeste`
  6. Ich prüfe (Reload in meinem Gast-Tab): verliere ich sofort den Zugriff?
- [ ] Prüfen, ob `{{ .Token }}` im Supabase Magic-Link-E-Mail-Template
      ergänzt wurde (Abschnitt 6, Schritt 4) — ohne das steht kein
      6-stelliger Code in der Mail, nur der Link funktioniert dann
- [ ] Danach: alle noch offenen Punkte aus `AGENDA.md` durchgehen und mit dem
      Nutzer klären (v.a. die 4 Abiturprüfungsfächer P1–P4, die er noch
      nicht kennt und selbst in `/abitur` einträgt, sobald feststeht)

## 4. Offene Probleme / Bugs

**Aktueller Blocker (siehe Abschnitt 2):** ISO-8859-1-Header-Fehler bei jedem
Supabase-Aufruf auf der Live-Vercel-Instanz. Wahrscheinlichste Ursache:
unsichtbares Zeichen in `NEXT_PUBLIC_SUPABASE_ANON_KEY` oder
`NEXT_PUBLIC_SUPABASE_URL` in Vercel.

**Bereits versucht:**
- Löschen + Neuanlegen beider Variablen in Vercel mit frisch aus dem Chat
  kopierten Werten — **Ergebnis noch nicht verifiziert** (Session pausiert
  vor dem Test)

**Noch NICHT versucht (falls der obige Fix nicht reicht):**
- Werte aus einer lokalen Nur-Text-Datei statt aus dem Chat kopieren (Chat-UI
  könnte z.B. gerade Anführungszeichen in "smart quotes" umwandeln oder ein
  unsichtbares Zeichen beim Markdown-Rendering einfügen)
- Manuelles Eintippen der Werte
- `vercel env pull` zur Byte-genauen Inspektion (braucht `vercel` CLI +
  `vercel login`, war bisher nicht installiert)
- Prüfen, ob das Problem eventuell in `lib/supabase/client.ts` selbst liegt
  (z.B. weil dort ein Header manuell gesetzt wird) — aktuell **unwahrscheinlich**,
  da die Datei keine manuellen Header setzt (siehe Abschnitt 6), aber nicht
  100% ausgeschlossen, falls der Env-Var-Fix nicht hilft

**Kleinere, bereits behobene Bugs dieser Session (zur Erinnerung, falls sie
wieder auftauchen):**
- `noten-eingabe.tsx`: Ziel-Note-Upsert fehlte `onConflict: "user_id,fach_id"`
  → Fix angewendet
- `abitur-uebersicht.tsx`: Speicherfehler wurden nicht angezeigt (stiller
  Fehlschlag durch fehlende Migration 0007) → Fehleranzeige ergänzt
- `todo-liste.tsx`: `Date.now()` direkt im Render verletzte Reacts
  Purity-Regel → in `useState(() => Date.now())` verschoben
- `theme-umschalter.tsx`: gleiche Purity-Regel bei einem Mounted-Check →
  `useSyncExternalStore` statt `useEffect`+`setState`

## 5. Wichtige Entscheidungen & Begründungen

- **KI-Chat (Gemini) komplett entfernt.** Nutzer hat mitten in der Session
  neue Anweisungen gegeben: App soll "rein statisch" sein, keine LLM-API zur
  Laufzeit. Das widersprach dem, was vorher gebaut wurde — wurde explizit mit
  dem Nutzer abgeklärt (AskUserQuestion) und dann umgesetzt. `lib/ki/` wurde
  gelöscht, `@google/genai` deinstalliert, `chat_nachrichten`-Tabelle per
  Migration 0006 gedroppt.
- **Fächerliste blieb unverändert**, obwohl der Hamburg-Kontext neu dazu kam
  — Hamburg liefert nur die Rechenregeln, ersetzt nicht die 13 Fächer.
- **Abitur-Metadaten in `lib/faecher-daten.ts` (TypeScript), nicht in einer
  Supabase-Tabelle.** Begründung: die App liest Fächer-Anzeigedaten nirgends
  aus der DB-Tabelle `faecher` (die dient nur als FK-Ziel), sondern
  ausschließlich aus der TS-Konstante. Fach-Metadaten (Niveau, Kernfach,
  Aufgabenfeld) ändern sich praktisch nie und passen zum Muster "Code statt
  DB-Eintrag, vom Nutzer über Claude-Code-Sessions gepflegt".
- **`zaehltDoppelt` ist ein explizites, nicht abgeleitetes Flag** in
  `lib/faecher-daten.ts`. Die Regel "Kernfach mit erhöhtem Niveau, das
  Prüfungsfach ist, zählt doppelt" ist laut Recherche mehrdeutig — eine
  automatische Ableitung hätte eine möglicherweise falsche Regel
  stillschweigend festgeschrieben. Nur für Biologie (profilgebend + erhöht)
  gesetzt.
- **Block I (`block_1_ergebnisse`) bekam eine eigene Tabelle statt die
  bestehende `noten`-Tabelle zu erweitern.** `noten` ist ein freies
  Tracking-Log (mehrere Einträge pro Halbjahr möglich), Block I braucht aber
  eindeutig einen Wert pro (Fach, Halbjahr). Beide Konzepte (informelles
  Tracking vs. formale Abitur-Buchführung) sind bewusst getrennt.
- **Rechenlogik (`lib/abitur/berechnung.ts`) ist reine, ungetestete... nein,
  GETESTETE Funktion**, kein Server-Call nötig. Mit `node:test` abgesichert
  (11 Tests), weil Korrektheit hier abiturrelevant ist.
- **Gast-Zugang über anonyme Supabase-Auth statt eigenem Cookie/Service-Role-
  System.** Begründung: Anonyme Sign-Ins geben dem Gast einen echten
  `auth.uid()`, wodurch der komplette bestehende Client-Code (der über
  `erstelleBrowserClient()` liest) unverändert funktioniert — nur die
  RLS-Policies mussten um zusätzliche, additive SELECT-Policies erweitert
  werden (mehrere passende Policies werden von Postgres mit ODER verknüpft).
  Schreibrechte bleiben exklusiv beim Besitzer, weil nur dessen Policy
  INSERT/UPDATE/DELETE erlaubt — Gäste können strukturell gar nicht
  schreiben, unabhängig von der UI.
- **Gast-Berechtigung: nur lesen, nichts ändern** — explizite Nutzer-Wahl
  (AskUserQuestion), da private Notendaten betroffen sind.
- **Kein Service-Role-Key verwendet.** Bewusst vermieden, um die Komplexität
  und das Risiko (Service-Role bypasst RLS komplett) klein zu halten —
  anonyme Auth + additive RLS-Policies reichen für den Use-Case.
- **`proxy.ts`-Bypass bei fehlenden Env-Vars entfernt.** War ursprünglich für
  lokale Dev-Bequemlichkeit gedacht (Seiten anzeigen, bevor `.env.local`
  befüllt ist), stellte sich aber als echte Sicherheitslücke heraus: beim
  ersten Vercel-Deploy fehlte kurzzeitig eine Env-Variable, wodurch **alle**
  Seiten ohne Login erreichbar waren. Jetzt: `/login` bleibt erreichbar,
  alles andere gibt einen 500-Fehler statt durchzulassen.
- **`OWNER_EMAIL`-Check in `app/auth/callback/route.ts`** als Verteidigung
  zusätzlich zum Supabase-Dashboard-Setting "Allow new user signups"
  deaktivieren — falls das Dashboard-Setting vergessen wird, greift der
  Code-Check trotzdem.
- **Design-Tokens:** `--accent`/`--accent-foreground` invertieren zwischen
  Light (`--accent: #1a1712` dunkel, Text weiß) und Dark (`--accent: #f7f3ec`
  hell, Text dunkel) — deshalb müssen Buttons IMMER `text-accent-foreground`
  statt hartem `text-white` verwenden, sonst unlesbar im Dark Mode.
- **Bewusst NICHT gemacht:** Lernzettel-Vorlage/Struktur wurde nicht
  festgelegt (Nutzer wollte das erst absprechen, siehe `AGENDA.md`).
  Markdown-Rendering für Lernzettel ist aktuell nur Rohtext, kein echter
  Renderer (bewusst minimal, bis Vorlage geklärt ist).

## 6. Wichtige Dateipfade & Referenzen

**Für den nächsten Schritt (Env-Var-Bug) lesen/prüfen:**
- `lib/supabase/client.ts` — Browser-Client-Erstellung (keine manuellen
  Header, nur `createBrowserClient(url, anonKey)`)
- `lib/supabase/server.ts` — Server-Client
- `app/login/page.tsx` — enthält `signInWithOtp`, `verifyOtp`,
  `signInAnonymously`, `rpc("gast_login", ...)` — alle drei Auth-Wege in
  einer Datei
- `proxy.ts` — Auth-Gate, inkl. der 500-Fehler-Antwort bei fehlenden Env-Vars

**Alle Datenbank-Migrationen (chronologisch, alle bereits als Datei im Repo,
Status laut letzter Nutzeraussage "funktioniert" — aber 0007 wurde
zwischenzeitlich vergessen und musste nachträglich einzeln ausgeführt werden,
daher lohnt sich im Zweifel eine Prüfung im Supabase Table Editor, ob wirklich
alle Tabellen existieren):**
```
0001_schema.sql              faecher, dateien, fortschritt_eintraege (ungenutzt),
                              todos, chat_nachrichten (später gedroppt) + 13 Fächer eingefügt
0002_rls_policies.sql        RLS für obige Tabellen
0003_flexibler_ordner.sql    Kontingenz-Migration (nicht mehr nötig, da 0001 direkt korrekt war)
0004_noten.sql                noten, fach_ziele
0005_storage_bucket.sql      Storage-Bucket "fach-dateien" + Policies
0006_entferne_ki_chat.sql    drop table chat_nachrichten
0007_abitur_bloecke.sql      block_1_ergebnisse, pruefungsfaecher (WURDE ANFANGS VERGESSEN)
0008_dateien_thema_halbjahr.sql   dateien.thema_slug, dateien.halbjahr
0009_todos_erweiterung.sql   todos.kategorie, todos.faellig_am, todos.angepinnt
0010_gastzugang.sql          gastcodes, gast_sitzungen, RPC gast_login(),
                              additive Gast-SELECT-Policies auf allen Datentabellen
                              + Storage
```

**Environment Variables:**
- Lokal in `.env.local` (nicht committed, siehe `.gitignore`):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OWNER_EMAIL`
- `.env.local.example` (committed, leeres Template) zeigt die benötigten Keys
- In Vercel (https://vercel.com/lr26/oberstufenapp/settings/environment-variables):
  dieselben drei Variablen — **aktuell im Verdacht, korrupt zu sein** (siehe
  Abschnitt 2/4), gerade neu gesetzt, Ergebnis unverifiziert
- Echte Werte (Supabase-Projekt `hjhxdtdzezjrpgortkto`):
  - `NEXT_PUBLIC_SUPABASE_URL=https://hjhxdtdzezjrpgortkto.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaHhkdGR6ZXpqcnBnb3J0a3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTk0NjEsImV4cCI6MjEwMjU3NTQ2MX0.i_e7yowLczNwx_mKpxry8NngVnssVkXCec690N4qJ5o`
  - `OWNER_EMAIL=rave.lasse@icloud.com`

**Externe Doku/Referenzen:**
- `Abi-Regeln/Hamburg.md` — recherchierte Abitur-Regeln, Quelle ca. 2018/19,
  Nutzer sollte das gegen aktuelle Handreichung seiner Schule prüfen
  (steht auch in `AGENDA.md`)
- `dokumentation/setup.md` — allgemeine Setup-Anleitung (Supabase-Projekt,
  Migrationen, Storage, E-Mail-Login) — **noch NICHT um die Gast-Zugang- und
  OWNER_EMAIL-Schritte aktualisiert**, das sollte bei Gelegenheit nachgezogen werden
- `node_modules/next/dist/docs/` — bei Unsicherheit zu Next.js-16-Verhalten
  hier nachschauen (von `next dev` selbst generierter Hinweis in `AGENTS.md`)

## 7. Git-Status

```
$ git status
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

$ git log --oneline -10
be456aa Fehleranzeige für Abitur-Speichern (statt stillem Fehlschlag)
2419cee Gast-Zugang mit Codes, OTP-Code-Login, To-Do/Noten erweitert
9552bf1 Initial commit: OberstufenApp Grundgerüst + Abitur, Noten, Vault, To-Dos
```

Kein Zwischencommit nötig — Working Tree ist bereits sauber, alles committed
und zu `origin/main` gepusht. Der aktuelle Blocker ist reine Konfiguration
(Vercel Env Vars), kein Code-Änderungsbedarf.

## 8. Zum direkten Wiedereinstieg

> Lies zuerst `PROJECT_STATE.md` im Projekt-Root komplett durch. Wir haben
> zuletzt einen Bug auf der Vercel-Live-Instanz debuggt (ISO-8859-1-Header-
> Fehler bei jedem Supabase-Login, vermutlich durch ein unsichtbares Zeichen
> in einer Env-Variable), der Nutzer hat die betroffenen Vercel-
> Umgebungsvariablen gelöscht und neu angelegt und wollte danach redeployen —
> frag zuerst, ob der Redeploy fertig ist, und teste dann selbst über das
> Browser-Tool `https://oberstufenapp.vercel.app/login`, ob der Fehler
> behoben ist. Mach danach mit den "Nächsten Schritten" (Abschnitt 3) weiter,
> ohne den Nutzer nochmal nach bereits geklärten Dingen zu fragen.
