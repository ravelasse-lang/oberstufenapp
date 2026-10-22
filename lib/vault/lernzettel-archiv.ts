import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { istLernzettelDateiname, istSlug } from "@/lib/vault/slug";

export type AlterLernzettel = {
  datei: string;
  titel: string;
  art: "pdf" | "html";
  /** "eigen" = vom Nutzer selbst erstellt, "claude" = mit Claude erstellt */
  herkunft: "eigen" | "claude";
};

const LERNZETTEL_ROOT = path.join(process.cwd(), "Lernzettel");

function titelAusDateiname(datei: string): string {
  const ohneEndung = datei.replace(/\.(pdf|html)$/, "");
  const wort = ohneEndung.replace(/-/g, " ");
  return wort.charAt(0).toUpperCase() + wort.slice(1);
}

/** Alle ausgelieferten Lernzettel-Dateien (PDF/HTML) eines Fachs. */
export async function listeAlteLernzettel(fachSlug: string): Promise<AlterLernzettel[]> {
  if (!istSlug(fachSlug)) return [];
  let namen: string[];
  try {
    namen = await fs.readdir(path.join(LERNZETTEL_ROOT, fachSlug));
  } catch {
    return [];
  }

  const ergebnis: AlterLernzettel[] = [];
  for (const datei of namen.sort()) {
    if (!istLernzettelDateiname(datei)) continue;
    // "-quelle.html" ist nur die Vorlage, aus der das PDF gerendert wird.
    if (datei.endsWith("-quelle.html")) continue;
    const art = datei.endsWith(".pdf") ? "pdf" : "html";
    let titel = titelAusDateiname(datei);
    if (art === "html") {
      try {
        const kopf = (await fs.readFile(path.join(LERNZETTEL_ROOT, fachSlug, datei), "utf-8")).slice(0, 4000);
        const treffer = kopf.match(/<title>([^<]{1,120})<\/title>/i);
        if (treffer?.[1].trim()) titel = treffer[1].trim();
      } catch {
        // Titel aus dem Dateinamen reicht
      }
    }
    ergebnis.push({
      datei,
      titel,
      art,
      herkunft: datei.includes("-eigener-") ? "eigen" : "claude",
    });
  }
  return ergebnis;
}

/** Inhalt einer Lernzettel-Datei (nur nach Validierung von Fach und Dateiname). */
export async function leseLernzettelDatei(fachSlug: string, datei: string): Promise<Buffer | null> {
  if (!istSlug(fachSlug) || !istLernzettelDateiname(datei)) return null;
  try {
    return await fs.readFile(path.join(LERNZETTEL_ROOT, fachSlug, datei));
  } catch {
    return null;
  }
}
