/**
 * Übergeordnete Seite für den Zurück-Pfeil: führt auf die Seite "darüber" (z. B. von einer Datei
 * zur Dateien-Liste, von dort zum Fach, vom Fach zur Startseite) und nicht einfach einen Schritt im
 * Browser-Verlauf zurück.
 */
export function elternPfad(pfad: string): string {
  const teile = pfad.split("/").filter(Boolean);
  if (teile.length <= 1) return "/";
  if (teile[0] === "faecher") {
    // /faecher/<fach>
    if (teile.length === 2) return "/";
    // /faecher/<fach>/datei/<id>  ->  Dateien-Liste
    if (teile[2] === "datei" && teile.length >= 4) return `/faecher/${teile[1]}/hochladen`;
    // /faecher/<fach>/themen/<thema>  ->  Themen-Liste
    if (teile[2] === "themen" && teile.length >= 4) return `/faecher/${teile[1]}/themen`;
    // /faecher/<fach>/hochladen | themen | fortschritt | lernzettel  ->  Fach
    return `/faecher/${teile[1]}`;
  }
  return "/";
}
