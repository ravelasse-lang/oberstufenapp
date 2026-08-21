import Link from "next/link";
import { notFound } from "next/navigation";
import { findeFach } from "@/lib/faecher-daten";
import { leseThema, leseLernzettel } from "@/lib/vault/lesen";
import { DateiUpload } from "@/komponenten/datei-upload";

export const dynamic = "force-dynamic";

export default async function ThemaDetailSeite({
  params,
}: {
  params: Promise<{ fach: string; thema: string }>;
}) {
  const { fach: fachSlug, thema: themaSlug } = await params;
  const fach = findeFach(fachSlug);
  if (!fach || !fach.aktiv) notFound();

  const thema = await leseThema(fachSlug, themaSlug);
  if (!thema) notFound();

  const lernzettel = await leseLernzettel(fachSlug, themaSlug);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14">
      <Link
        href={`/faecher/${fachSlug}/themen`}
        className="mb-6 inline-block text-[13px] text-muted hover:text-foreground"
      >
        ← Themen
      </Link>

      <div className="mb-8">
        <h1 className="text-[24px] font-semibold tracking-tight">
          {thema.frontmatter.titel}
        </h1>
        {thema.frontmatter.halbjahr && (
          <p className="mt-1.5 text-[13px] text-muted">
            Halbjahr {thema.frontmatter.halbjahr}
          </p>
        )}
      </div>

      {thema.inhalt && (
        <div className="mb-8 whitespace-pre-wrap rounded-2xl border border-border bg-surface/40 p-4 text-[14px] leading-relaxed">
          {thema.inhalt}
        </div>
      )}

      {thema.frontmatter.ressourcen && thema.frontmatter.ressourcen.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-[15px] font-semibold">Lernressourcen</h2>
          <ul className="space-y-2">
            {thema.frontmatter.ressourcen.map((r) => (
              <li key={r.url}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-accent hover:opacity-80"
                >
                  {r.titel} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-3 text-[15px] font-semibold">Lernzettel</h2>
        {lernzettel ? (
          <div className="whitespace-pre-wrap rounded-2xl border border-border bg-surface/40 p-4 text-[14px] leading-relaxed">
            {lernzettel}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-4 text-[14px] text-muted">
            Noch nicht erstellt — über Claude Code generieren und unter{" "}
            <code>
              Lernzettel/{fachSlug}/{themaSlug}.md
            </code>{" "}
            ablegen.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-[15px] font-semibold">Material zu diesem Thema</h2>
        <DateiUpload fachId={fachSlug} themaSlug={themaSlug} />
      </div>
    </div>
  );
}
