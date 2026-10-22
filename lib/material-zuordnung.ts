/**
 * Ordnet hochgeladene Material-Dateien automatisch einem Ordner (Unterthema) und
 * Halbjahr zu. Nur anhand des Dateinamens, nichts wird geraten: passt keine Regel,
 * landet die Datei im Ordner "Sonstiges". Die Nummern im Ordnernamen halten die
 * Reihenfolge in der Dateien-Ansicht (alphabetisch/numerisch sortiert).
 */
export type MaterialZuordnung = { ordner: string; halbjahr: number | null };

type Regel = { muster: RegExp; ordner: string; halbjahr: number | null };

const BIOLOGIE: Regel[] = [
  { muster: /^bildschirmfoto/, ordner: "Genetik 9 · Notizen & Buchseiten (Screenshots)", halbjahr: 1 },
  { muster: /klausur|arbeitsheft/, ordner: "Genetik 8 · Klausur & Arbeitsheft", halbjahr: 1 },
  { muster: /genregulation|interferenz/, ordner: "Genetik 5 · Genregulation", halbjahr: 1 },
  { muster: /mutation/, ordner: "Genetik 6 · Mutationen", halbjahr: 1 },
  { muster: /proteinbiosynthese|vom gen zum merkmal|prozessierung/, ordner: "Genetik 4 · Proteinbiosynthese", halbjahr: 1 },
  { muster: /zellzyklus|meiose/, ordner: "Genetik 3 · Zellzyklus & Meiose", halbjahr: 1 },
  { muster: /replikation/, ordner: "Genetik 2 · Replikation", halbjahr: 1 },
  { muster: /dna-struktur|transformations|dna-isolation/, ordner: "Genetik 1 · DNA-Struktur & Experimente", halbjahr: 1 },
  { muster: /tierische|pflanzliche|bakterien und viren/, ordner: "Genetik 7 · Zellbiologie (Wiederholung)", halbjahr: 1 },
];

const REGELN: Record<string, Regel[]> = { biologie: BIOLOGIE };

/**
 * Reihenfolge der Entscheidung:
 * 1. Namensregeln des Fachs (aktuell Biologie/Genetik).
 * 2. Sonst die Ordnerstruktur, falls ein relativer Pfad bekannt ist (beim Auswählen eines ganzen
 *    Ordners): "Fach/Unterordner/datei.pdf" -> Ordner = erster Unterordner, "Fach/datei.pdf" -> "Allgemein".
 * 3. Sonst "Sonstiges".
 */
export function ordneMaterialZu(
  fachId: string,
  dateiname: string,
  relativerPfad?: string
): MaterialZuordnung {
  const name = dateiname.toLowerCase();
  const regel = (REGELN[fachId] ?? []).find((r) => r.muster.test(name));
  if (regel) return { ordner: regel.ordner, halbjahr: regel.halbjahr };

  const teile = (relativerPfad ?? "").split("/").filter(Boolean);
  if (teile.length >= 3) return { ordner: teile[1].slice(0, 80), halbjahr: 1 };
  if (teile.length === 2) return { ordner: "Allgemein", halbjahr: 1 };
  return { ordner: "Sonstiges", halbjahr: null };
}
