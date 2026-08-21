import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { ThemaFrontmatter, ThemaMeta } from "@/lib/vault/typen";

const VAULT_ROOT = path.join(process.cwd(), "Vault");
const LERNZETTEL_ROOT = path.join(process.cwd(), "Lernzettel");

async function existiert(pfad: string): Promise<boolean> {
  try {
    await fs.access(pfad);
    return true;
  } catch {
    return false;
  }
}

export async function listeThemen(fachSlug: string): Promise<ThemaMeta[]> {
  const ordner = path.join(VAULT_ROOT, fachSlug);
  if (!(await existiert(ordner))) return [];

  const dateien = (await fs.readdir(ordner)).filter((d) => d.endsWith(".md"));

  const themen = await Promise.all(
    dateien.map(async (datei) => {
      const slug = datei.replace(/\.md$/, "");
      const inhalt = await fs.readFile(path.join(ordner, datei), "utf-8");
      const { data } = matter(inhalt);
      const frontmatter = data as ThemaFrontmatter;
      const lernzettelPfad = path.join(LERNZETTEL_ROOT, fachSlug, datei);

      return {
        ...frontmatter,
        slug,
        hatLernzettel: await existiert(lernzettelPfad),
      } satisfies ThemaMeta;
    })
  );

  return themen.sort((a, b) => (a.halbjahr ?? 0) - (b.halbjahr ?? 0));
}

export async function leseThema(
  fachSlug: string,
  themaSlug: string
): Promise<{ frontmatter: ThemaFrontmatter; inhalt: string } | null> {
  const pfad = path.join(VAULT_ROOT, fachSlug, `${themaSlug}.md`);
  if (!(await existiert(pfad))) return null;

  const roh = await fs.readFile(pfad, "utf-8");
  const { data, content } = matter(roh);
  return { frontmatter: data as ThemaFrontmatter, inhalt: content.trim() };
}

export async function leseLernzettel(
  fachSlug: string,
  themaSlug: string
): Promise<string | null> {
  const pfad = path.join(LERNZETTEL_ROOT, fachSlug, `${themaSlug}.md`);
  if (!(await existiert(pfad))) return null;

  const roh = await fs.readFile(pfad, "utf-8");
  const { content } = matter(roh);
  return content.trim();
}
