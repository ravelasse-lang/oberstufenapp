# GoodNotes-Abgleich (wöchentlich) — Ablauf

Zweck: Neue oder geänderte PDFs aus dem automatischen GoodNotes-Backup in OneDrive in die App holen.
Gilt für den lokalen, wöchentlich laufenden Task `oberstufenapp-goodnotes-abgleich` und für manuelle Läufe ("sync" im Chat).

## Regeln (hart)
- Nur LOKAL arbeiten, kein Cloud-Guthaben, keine Zusatznutzung, nichts kaufen (siehe `UEBERGABE.md`).
- Keine Zugangsdaten eingeben, keine Passwörter/Codes. Der Upload läuft NUR in der bereits angemeldeten Browser-Sitzung des Nutzers (Browser-Bereich der App, `localhost:3000`). Ist sie nicht angemeldet: NICHT hochladen, stattdessen die Liste ablegen (Schritt 4).
- Quelle nur `~/Library/CloudStorage/OneDrive-Persönlich/GoodNotes/Schule 11/`, nur `.pdf`. NIE lesen/hochladen: `Gym`, `Mindout*`, Noten/Zeugnisse, `Hausaufgaben*`, `To-Do*`, `Schule Bis 9-`, `.goodnotes`-Dateien.
- Kein Löschen in OneDrive, keine Änderung außerhalb des Projektordners (außer dem Scratchpad für Hilfsdateien). Nichts erfinden: Fach/Ordner ergeben sich aus der Ordnerstruktur (`lib/material-zuordnung.ts`).

## Abbildung Ordner → Fach
Bio→`biologie` (derzeit NICHT abgleichen: das GoodNotes-Arbeitsheft ist dieselbe Datei wie die schon hochgeladene), Camebridge→`cambridge`, Chemie→`chemie`, Deutsch→`deutsch`, Englisch→`englisch`, Geschichte→`geschichte`, Mathe→`mathe`, Philo→`philosophie`, Psychologie→`psychologie`, Rechtskunde→`recht`, Seminar→`seminarkurs`.

## Ablauf
1. **Scannen:** Alle PDFs unter `Schule 11/<Ordner>/…` auflisten (Pfad relativ zu `Schule 11`, Größe, `mtime`). Mit `dokumentation/goodnotes-sync-stand.json` vergleichen:
   *neu* = Pfad fehlt im Stand; *geändert* = `mtime` größer als im Stand (oder andere Größe). Dateien, die nur lokal als Wolke liegen, vorher durch Lesen herunterladen lassen.
2. **Nichts Neues:** `stand` im JSON auf heute setzen, committen, Kurzmeldung, Ende. (Wenig Kontingent verbrauchen.)
3. **Änderungen und Browser angemeldet?** `preview_start {name:"oberstufenapp"}` (Dev-Server `localhost:3000`), Browser-Tab öffnen, `/faecher/<fach>/hochladen` aufrufen. Ist stattdessen `/login` zu sehen → Schritt 4.
   - Kurzzeitigen Dateiserver nur auf `127.0.0.1:8765` starten (Allowlist = die geänderten Dateien, CORS nur für `http://localhost:3000`).
   - Je Fach in der Seite per JavaScript `File`-Objekte aus `http://127.0.0.1:8765/f/<i>` bauen (`new File([blob], name, {type:'application/pdf', lastModified: mtime*1000})`, `Object.defineProperty(f,'webkitRelativePath',{value:'<Fach-Ordner>/<Unterordner>/<datei>'})`), in das Feld "Mehrere Dateien auf einmal" setzen (`input.files = DataTransfer.files` + `change`-Event) und den Knopf "Dateien hochladen" klicken. Die App überspringt Unverändertes, **ersetzt** neuere Fassungen (neue Datei speichern, danach alte entfernen) und legt Neues an.
   - Die App liest den Text neuer/aktualisierter PDFs beim Upload automatisch ein (Suche). Klappt das bei einer Datei nicht, steht auf der Suche-Seite "N PDFs noch nicht durchsuchbar" → "Durchsuchbar machen" klicken.
   - Ergebnis prüfen (Meldung "N hochgeladen, M aktualisiert"), per SQL gegenprüfen (Zeilen = Speicherobjekte, keine Waisen). Dateiserver beenden (nur den EIGENEN Prozess) und das Hilfsskript löschen.
   - `goodnotes-sync-stand.json` aktualisieren, `dokumentation/material-schule11.md` bei neuen Dateien ergänzen (Beschreibung nur aus Gesehenem), committen, pushen.
4. **Nicht angemeldet / Fehler:** `dokumentation/goodnotes-abgleich-offen.md` mit der Liste (neu/geändert, Fach, Ordner, Größe) schreiben und NICHT hochladen. Beim nächsten Chat dem Nutzer sagen: "Es gibt N neue/geänderte Dateien — melde dich im Browser-Bereich an, dann lade ich sie hoch."
5. **Bericht:** Kurz: was neu/geändert war, was hochgeladen wurde, was offen ist. Keine weiteren Aufgaben starten.
