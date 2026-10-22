// Marker-Ziel für ehemalige Obsidian-Wiki-Links (siehe wikiLinksZuText).
export const WIKI_MARKER = "#wiki-begriff";

function mdEscape(text: string): string {
  return text.replace(/[\\`*_{}[\]<>()#+!|~]/g, "\\$&");
}

/**
 * Wandelt Obsidian-Wiki-Links VOR dem Markdown-Parsing um, damit ein
 * escapetes Pipe (`\|`) in Tabellenzellen die Tabelle nicht zerlegt.
 *   [[seite]]                        -> seite
 *   [[seite#Abschnitt]]              -> Abschnitt
 *   [[seite#Abschnitt|Anzeigetext]]  -> Anzeigetext   (auch mit `\|`)
 * Das Ergebnis wird als Markdown-Link auf einen Marker ausgegeben und
 * später als hervorgehobener Begriff (kein klickbarer Link) gerendert.
 */
export function wikiLinksZuText(markdown: string): string {
  return markdown.replace(/(!?)\[\[([^\]]+?)\]\]/g, (_voll, embed: string, innen: string) => {
    // Obsidian-Embeds (![[bild.png]]) gibt es in der App nicht: weglassen,
    // statt ein kaputtes <img> zu erzeugen.
    if (embed) return "";
    // Anzeigetext = alles nach dem letzten `|` bzw. `\|`
    const pipe = innen.lastIndexOf("|");
    let text: string;
    if (pipe !== -1) {
      text = innen.slice(pipe + 1);
    } else {
      const raute = innen.indexOf("#");
      text = raute !== -1 ? innen.slice(raute + 1) : innen;
    }
    text = text.replace(/\s+/g, " ").trim();
    if (!text) return "";
    return `[${mdEscape(text)}](${WIKI_MARKER})`;
  });
}
