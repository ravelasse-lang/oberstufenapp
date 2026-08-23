---
description: Erstellt einen recherchierten, gut gestalteten Lernzettel (PDF + Obsidian-Markdown) zu einem Thema aus OberstufenApp
argument-hint: [Fach] [Thema]
---

Erstelle einen vollständigen Lernzettel für die OberstufenApp zum Thema:

$ARGUMENTS

Falls kein Thema angegeben wurde: frag danach, bevor du weitermachst.
Falls unklar ist, zu welchem Fach das Thema gehört: kurz nachfragen statt zu raten.

## Ablauf

1. **Vorhandenes Material sichten (lokal, primäre Quelle):**
   - Prüfe `Vault/<fach>/<thema-slug>.md` (Themenbeschreibung, Lehrplan-Bezug)
   - Prüfe `Lernzettel/<fach>/<thema-slug>.md` (falls schon ein Lernzettel existiert — dann ergänzen/verbessern statt komplett neu schreiben)
   - Wenn kein exakt passender Dateiname existiert, im ganzen `Vault/`- und `Lernzettel/`-Ordner nach verwandten Begriffen suchen (grep), nicht nur nach exaktem Dateinamen

2. **Hochgeladene Dateien einbeziehen (Supabase, ergänzend):**
   - Prüfe die `dateien`-Tabelle in Supabase auf Einträge mit passendem `fach_id`/`thema_slug` (Metadaten: Dateiname, Speicherpfad, Ordner)
   - Falls passende Dateien existieren: den Nutzer fragen, ob er möchte, dass du sie dir zum Lesen herunterlädst/anschaust, statt sie automatisch stillschweigend einzubeziehen — außer der Nutzer hat das für diesen Aufruf schon klargestellt

3. **Internet-Recherche ergänzend, nicht ersetzend:**
   - Nutze WebSearch für aktuelle Fachbegriffe, Beispiele, wissenschaftlichen Konsens — als Ergänzung zu den eigenen Notizen, nicht als Ersatz
   - Bei Abitur-relevanten Fakten: auf Korrektheit für das Niveau des Fachs achten (aus `lib/faecher-daten.ts` erkennbar: eA/gA)
   - **Nichts erfinden** — wenn eine Information unsicher ist, das kennzeichnen statt zu raten (siehe Projekt-Prinzip: keine erfundenen Lehrplaninhalte)

4. **Struktur des Lernzettels:**
   - Kurzer Einstieg/Rückblick auf nötiges Vorwissen (falls sinnvoll)
   - Kernbegriffe/Definitionen zuerst
   - Dann Zusammenhänge/Prozesse
   - Dann konkrete Beispiele
   - Merksätze/Eselsbrücken als hervorgehobene Boxen
   - Bei Diskussions-/Bewertungsthemen: Pro/Contra-Struktur
   - Zusammenfassung am Ende (Kernaussagen)
   - Alle Fachbegriffe im Fließtext markieren/verlinken zu einem Glossar-Abschnitt am Ende

5. **Zwei Ausgabeformate erzeugen:**
   - **PDF**: gut gestaltet, nicht nur roher Text — als HTML mit CSS schreiben (Farbcodierung pro Kapitel, Callout-Boxen für Merksätze/Achtung/Klausurrelevanz, saubere Tabellen) und über den lokal installierten Chrome per `--headless --disable-gpu --print-to-pdf=<pfad>` zu PDF rendern. Das hat sich in dieser Session bewährt (reine reportlab-PDFs sahen zu einfach aus). Nur falls Chrome nicht verfügbar ist: auf den `pdf`-Skill zurückgreifen.
   - **Markdown**: Obsidian-kompatibel unter `Lernzettel/<fach>/<thema-slug>.md` speichern, mit Frontmatter:
     ```yaml
     ---
     titel: "..."
     fach: <fach-slug>
     datum: <heutiges Datum, falls bekannt>
     ---
     ```
     Fachbegriffe als `[[...]]`-Wiki-Links, falls ein passendes Glossar existiert oder neu angelegt wird (Muster: siehe `Lernzettel/biologie/genetik.md` und `Lernzettel/biologie/genetik-glossar.md`)

6. **Quellen auflisten:** Am Ende des Lernzettels (Markdown-Version) kurz auflisten, welche Web-Quellen für die Ergänzung genutzt wurden.

7. **Ergebnis liefern:** PDF per `SendUserFile` an den Nutzer schicken, Markdown-Datei(en) committen und pushen (wie in diesem Projekt üblich — siehe `AGENDA.md`/`PROJECT_STATE.md` für den Arbeitsstil).

## Falls über eine offene Anfrage aus der App aufgerufen

Falls dieser Befehl im Rahmen eines geplanten täglichen Checks oder auf
Zuruf ("schau nach offenen Anfragen") läuft, statt mit einem Thema direkt
aufgerufen zu werden: prüfe zuerst die Supabase-Tabelle
`lernzettel_anfragen` auf Zeilen mit `status = 'offen'`. Verarbeite jede
offene Anfrage einzeln in der Reihenfolge `erstellt_am` (älteste zuerst),
setze den Status während der Bearbeitung auf `in_bearbeitung` und danach
auf `fertig` (Spalte `bearbeitet_am` mit aktuellem Zeitpunkt füllen,
`ergebnis_pfad` mit dem Pfad der erzeugten Markdown-Datei befüllen).
