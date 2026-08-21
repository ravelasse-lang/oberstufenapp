# Setup-Anleitung

## 1. Supabase-Projekt anlegen

1. Auf [supabase.com](https://supabase.com) kostenlos ein Konto erstellen und ein neues Projekt anlegen.
2. Im Dashboard unter **Project Settings → API** die Werte `Project URL` und `anon public` Key kopieren.
3. In `.env.local` eintragen:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<Project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public Key>
   ```

## 2. Datenbankschema einspielen

1. Im Supabase-Dashboard: **SQL Editor → New query**.
2. Inhalt von `datenbank/migrationen/0001_schema.sql` einfügen und ausführen.
3. Danach Inhalt von `datenbank/migrationen/0002_rls_policies.sql` einfügen und ausführen.

## 3. Storage-Bucket anlegen

1. **Storage → New bucket**, Name: `fach-dateien`, **nicht** öffentlich.
2. Danach unter **Storage → Policies** eine Policy für den Bucket anlegen, die den Zugriff auf den eigenen Ordner beschränkt (Ausdruck: `(storage.foldername(name))[1] = auth.uid()::text`). Details siehe Kommentar am Ende von `0002_rls_policies.sql`.

## 4. E-Mail-Login (Magic Link) aktivieren

Ist bei Supabase standardmäßig aktiv (**Authentication → Providers → Email**). Für den Anfang reicht der eingebaute Supabase-Mailversand (Rate-Limit beachten — für eine Einzelnutzer-App ausreichend).

## 5. Lokal starten

```bash
npm run dev
```

App läuft dann unter http://localhost:3000

## Offene Punkte für später

Siehe [`AGENDA.md`](../AGENDA.md) im Projekt-Root.
