import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { istSlug } from "@/lib/vault/slug";

export type ThemenTreffer = {
  fach: string;
  slug: string;
  titel: string;
  art: "Thema" | "Lernzettel";
  ausschnitt: string;
};

const WURZELN: { ordner: string; art: ThemenTreffer["art"] }[] = [
  { ordner: "Vault", art: "Thema" },
  { ordner: "Lernzettel", art: "Lernzettel" },
];

/** Einfache Suche in den Markdown-Dateien von Vault/ und Lernzettel/ (alle Wörter müssen vorkommen). */
export async function sucheThemen(abfrage: string, fachSlug?: string): Promise<ThemenTreffer[]> {
  const woerter = abfrage.toLowerCase().split(/\s+/).filter((w) => w.length >= 2).slice(0, 6);
  if (woerter.length === 0) return [];
  const treffer: ThemenTreffer[] = [];

  for (const { ordner, art } of WURZELN) {
    const wurzel = path.join(process.cwd(), ordner);
    let faecher: string[] = [];
    try {
      faecher = await fs.readdir(wurzel);
    } catch {
      continue;
    }
    for (const fach of faecher) {
      if (!istSlug(fach) || (fachSlug && fach !== fachSlug)) continue;
      let dateien: string[] = [];
      try {
        dateien = (await fs.readdir(path.join(wurzel, fach))).filter((d) => d.endsWith(".md"));
      } catch {
        continue;
      }
      for (const datei of dateien) {
        const slug = datei.replace(/\.md$/, "");
        if (!istSlug(slug) || slug.endsWith("-glossar")) continue;
        const roh = await fs.readFile(path.join(wurzel, fach, datei), "utf-8");
        const { data, content } = matter(roh);
        const text = content.replace(/\[\[([^\]|#]*#)?([^\]|]*\|)?([^\]]+)\]\]/g, "$3");
        const klein = text.toLowerCase();
        if (!woerter.every((w) => klein.includes(w) || String(data.titel ?? "").toLowerCase().includes(w))) continue;
        const pos = Math.max(0, klein.indexOf(woerter[0]));
        const ausschnitt = text.slice(Math.max(0, pos - 60), pos + 140).replace(/\s+/g, " ").trim();
        treffer.push({ fach, slug, titel: String(data.titel ?? slug), art, ausschnitt });
      }
    }
  }
  return treffer.slice(0, 40);
}
