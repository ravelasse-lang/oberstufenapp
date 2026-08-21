# OberstufenApp

Persönliche Lern-App für die Oberstufe (Medizin-Profil): Fächerübersicht, Datei-Upload, Fortschritts-Log, zentrale To-Do-Liste und ein KI-gestützter Fach-Spezialist pro Fach.

## Setup

Siehe [dokumentation/setup.md](dokumentation/setup.md) für die vollständige Anleitung (Supabase-Projekt, Datenbankschema, Storage, Gemini API-Key).

```bash
npm install
npm run dev
```

## Aktueller Stand

- **Phase A (Grundgerüst):** alle 13 Fächer, Login, Navigation, zentrale To-Do-Liste — funktional.
- **Phase B (volle Funktion):** Biologie & Chemie — Datei-Upload, Fortschritts-Log, Fach-Spezialist-Chat.

## Struktur

- `app/` — Next.js-Seiten und Routen
- `komponenten/` — eigene React-Komponenten
- `lib/supabase/` — Supabase-Client-Setup
- `lib/ki/` — austauschbare KI-Anbindung (aktuell: Google Gemini)
- `datenbank/migrationen/` — SQL-Schema für Supabase
- `dokumentation/` — Setup-Anleitung
