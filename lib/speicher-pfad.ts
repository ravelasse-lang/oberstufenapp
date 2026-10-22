/**
 * Dateiname für den Speicher-Pfad (Supabase Storage). Der angezeigte Name bleibt in der
 * Datenbank unverändert; im Pfad stehen nur sichere ASCII-Zeichen, weil Umlaute, Leerzeichen
 * und Sonderzeichen in Storage-Schlüsseln Fehler ("Invalid key") auslösen können.
 */
export function sichererSpeicherName(name: string): string {
  const dekomponiert = name.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const ersetzt = dekomponiert
    .replace(/ß/g, "ss")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._]+/, "");
  const begrenzt = ersetzt.length > 120 ? ersetzt.slice(-120) : ersetzt;
  return begrenzt || "datei";
}
