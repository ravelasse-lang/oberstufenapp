# Agenda

Alles, was aus Anweisungen noch nicht direkt umsetzbar war (fehlende Infos,
nötige Rücksprache, spätere Entscheidung), landet hier statt stillschweigend
wegzufallen.

| Punkt | Status | Notiz |
|---|---|---|
| Abiturprüfungsfächer (P1–P4) | offen, Nutzer entscheidet später | Kernfächer/Profilgebend/Niveau/Aufgabenfeld sind jetzt für alle 13 Fächer in `lib/faecher-daten.ts` gepflegt (bestätigt u.a. durch die offizielle MEDIZINPLUS-Profilbroschüre des Gymnasiums Ohlstedt). Nur die 4 konkreten Prüfungsfächer (P1–P3 schriftlich, P4 mündlich/Präsentation) fehlen noch — Nutzer trägt sie selbst in der Abitur-Übersicht (`/abitur`) ein, sobald feststeht. Bis dahin zeigt Block II der Berechnung "noch nicht ausgewählt". |
| Doppelgewichtungs-Regel Block I | prüfen | Wortlaut "ein Kernfach mit erhöhtem Niveau, das Prüfungsfach ist" ist mehrdeutig (genau eines? alle zutreffenden?). Vor dem Setzen des `zaehltDoppelt`-Flags mit Schule/Oberstufenberatung klären. Aktuell in `lib/faecher-daten.ts` nur für Biologie (profilgebend) gesetzt; bei Deutsch/Englisch (Kernfach, erhöht) noch nicht, weil unklar ist, ob sie überhaupt Prüfungsfach werden. |
| Niveau Geschichte/Rechtswissenschaft/Philosophie | Annahme, nicht bestätigt | Als "grundlegend" angenommen, da nicht Teil des MEDIZINPLUS-Profils. Bitte bestätigen, falls falsch. |
| Cambridge-Zertifikat | Annahme, nicht bestätigt | Aus der Abitur-Berechnung ausgeschlossen (vermutlich kein regulärer Halbjahreskurs, siehe Recherche). Bitte bestätigen. |
| Hamburg-Regeln gegenprüfen | prüfen | Quelle (`Abi-Regeln/Hamburg.md`) ist eine Schulpräsentation von ca. 2018/19, durch mehrere unabhängige Quellen bestätigt, aber nicht amtlich. Vor Abitur-relevanten Entscheidungen gegen aktuelle Handreichung der eigenen Schule/Oberstufenberatung abgleichen. |
| Lernzettel-Vorlage (Feature 6) | offen | Struktur (Cornell-Notes? freie Gliederung? feste Abschnitte?) muss mit dem Nutzer abgesprochen werden, bevor Template/Rendering fest eingebaut wird. |
| Markdown-Renderer für Lernzettel-Anzeige | offen | Abhängig von der Lernzettel-Vorlage-Entscheidung — evtl. reicht einfacher Renderer, evtl. braucht es mehr (Tabellen, Formeln). |
| Casio-ClassWiz-Tipp-Idee | offen | Ursprünglich für den (jetzt entfernten) KI-Chat gedacht. Ohne Chat-Feature: evtl. als eigene Lernzettel-Notiz oder Ressourcen-Link im Mathe-Themenbereich unterbringen? |
| Lehrplan & Bio-Präsentationen | offen | Nutzer hat angekündigt, Lehrplan + Bio-Präsentationen je Halbjahr nachzuliefern — sobald da: in Themen-/Vault-Struktur einordnen. |
| Untis-Integration | offen, mit Einschränkung | Gewünscht, aber Zugangsdaten dürfen nie an Claude weitergegeben werden. Falls umgesetzt: Zugangsdaten nur direkt in der App speichern (nicht im Chat), inoffizielle Community-API nötig (keine offizielle WebUntis-API vorhanden). |
| GitHub + Vercel Deployment | in Arbeit | Lokales Git-Repo initialisiert (Identität gesetzt: Lasse / rave.lasse@icloud.com), noch nicht committed/gepusht. `gh`/`vercel`-CLIs sind auf diesem Rechner nicht installiert — Nutzer muss privates GitHub-Repo manuell anlegen, dann pusht Claude; Vercel-Import läuft über das Dashboard. |
| Migration 0009 (todos: kategorie/faellig_am/angepinnt) | Nutzer muss SQL ausführen | Wurde dem Nutzer im Chat gegeben, Status der Ausführung noch nicht bestätigt. Ohne diese Migration schlagen Todo-Hinzufügen/Anpinnen fehl ("Could not find the 'faellig_am' column..."). |

## Erledigt (zur Nachvollziehbarkeit, nicht mehr aktiv offen)

- KI-Fach-Spezialist (Gemini-Chat) entfernt — App ruft zur Laufzeit kein LLM mehr auf.
- Design-Überarbeitung im Stil des vom Nutzer gezeigten Referenzbilds (warme Cream-/Dunkel-Palette, große Rundungen, schwebende Pill-Navigation).
- To-Do-Liste erweitert: Löschen, Anpinnen, Kategorie, Fälligkeitsdatum (alles optional), Erledigt-Liste ein-/ausblendbar.
- Noten-Einträge sind jetzt bearbeitbar und löschbar (`komponenten/noten-liste.tsx`).
- Gesamt-Fortschrittskurve über alle Fächer auf der Startseite.
- eA/gA-Kürzel statt ausgeschriebenem "erhöhtes/grundlegendes Niveau", überall aus `fach.niveau` abgeleitet (`fachAnzeigename()`).
