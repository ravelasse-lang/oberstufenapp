# Setup-Anleitung

Stand: 22.10.2026. Die laufende App liegt bei Vercel (Projekt `oberstufenapp`) und
nutzt das Supabase-Projekt `hjhxdtdzezjrpgortkto`. Diese Anleitung beschreibt, wie man
dasselbe von Grund auf (neu) aufsetzt.

## 1. Supabase-Projekt anlegen

1. Auf [supabase.com](https://supabase.com) kostenlos ein Konto erstellen und ein neues Projekt anlegen.
2. Im Dashboard unter **Project Settings → API** die Werte `Project URL` und den `anon public` Key kopieren. **Nie** den `service_role`-Key verwenden oder weitergeben.
3. In `.env.local` eintragen (die Datei ist per `.gitignore` ausgeschlossen):
   ```
   NEXT_PUBLIC_SUPABASE_URL=<Project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public Key>
   OWNER_EMAIL=<deine E-Mail-Adresse>
   ```
   `OWNER_EMAIL` ist rein serverseitig. Nur diese Adresse darf sich als Besitzer anmelden. Ist die Variable **nicht** gesetzt, ist niemand Besitzer: nicht-anonyme Nutzer werden sofort abgemeldet (fail-closed). Sie muss deshalb auch in Vercel gesetzt sein.

> **Falle:** Beim Kopieren der Keys aus Vercel/Supabase auf maskierte Werte (••••) achten. Ein beschädigter Key führt zu Login-Fehlern. Nach dem Einfügen prüfen, dass der Key ca. 200+ Zeichen lang ist.

## 2. Datenbankschema einspielen

Im Supabase-Dashboard: **SQL Editor → New query**. Die Dateien aus `datenbank/migrationen/` **der Reihe nach** ausführen, jede nur einmal:

| Datei | Inhalt |
|---|---|
| 0001–0004 | Tabellen, Besitzer-Policies (RLS), flexible Ordner, Noten |
| 0005 | Storage-Bucket `fach-dateien` (nicht öffentlich) mit Policies |
| 0006 | entfernt die alte KI-Chat-Tabelle |
| 0007 | Abitur-Blöcke |
| 0008, 0009 | Zusatzspalten für `dateien` und `todos` |
| 0010, 0011 | Gast-Zugang (Codes, Sitzungen) inkl. Rekursions-Fix |
| 0012, 0013 | Lernzettel-Anfragen inkl. Härtung |
| 0014 | Gäste-Schreibsperre (restriktive Policies für insert/update/delete) |

Ausführliche Anleitung mit Vor-/Nachprüfung und Rückgängig-Skript: [`datenbank/ANWENDEN.md`](../datenbank/ANWENDEN.md). Regel: Datenbank-Änderungen nur nach ausdrücklichem Ja des Besitzers.

## 3. Storage

Der Bucket `fach-dateien` (nicht öffentlich) wird durch `0005_storage_bucket.sql` angelegt. Dateien liegen unter `{auth.uid()}/…`, die Policies beschränken auf den eigenen Ordner.

## 4. Login einrichten (Supabase → Authentication)

- **Email** (Magic Link / Code) ist standardmäßig aktiv. Für eine Einzelnutzer-App reicht der eingebaute Mailversand (Rate-Limit beachten).
- **Anonymous Sign-Ins: AN.** Gäste melden sich damit anonym an und verknüpfen sich per Code.
- **"Allow new users to sign up": MUSS AN bleiben.** Auch anonyme Gäste zählen als neue Nutzer; bei "aus" scheitert der Gast-Login mit "signup not allowed". Die Besitzer-Sperre erledigt `OWNER_EMAIL` im Code.
- Redirect-URLs: die Vercel-Adresse der App (und `http://localhost:3000` für lokal) unter **URL Configuration** eintragen.

## 5. Lokal starten und prüfen

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Unit-Tests (Abitur-Berechnung, Besitzer-Prüfung, Wiki-Links, Slugs)
npx tsc --noEmit
npm run lint
npm run build
```

## 6. Deployment (Vercel)

- Push auf `main` löst automatisch ein Deployment aus (Team `lr26`, Projekt `oberstufenapp`).
- Umgebungsvariablen in Vercel (Production + Preview): `OWNER_EMAIL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nach Änderungen an Variablen neu deployen.

## 7. Bei Login-Problemen ("Failed to fetch", Seite hängt)

1. **Zuerst den Projektstatus im Supabase-Dashboard prüfen.** Das kostenlose Projekt wird bei Inaktivität **pausiert**; das war die Ursache des Login-Hängers am 22.10.2026. Wiederherstellen im Dashboard ("Restore project").
2. Danach Keys in Vercel prüfen (Länge, keine Maskierung), neu deployen.
3. Erst dann im Code suchen.

## Offene Punkte für später

Siehe [`AGENDA.md`](../AGENDA.md) im Projekt-Root.
