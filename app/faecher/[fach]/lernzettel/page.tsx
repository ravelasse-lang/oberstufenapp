import Link from "next/link";
import { notFound } from "next/navigation";
import { fachAnzeigename, findeFach } from "@/lib/faecher-daten";
import { listeThemen } from "@/lib/vault/lesen";
import { listeAlteLernzettel } from "@/lib/vault/lernzettel-archiv";
import { HandschriftHinweis } from "@/komponenten/handschrift-hinweis";
import { LernzettelAnfrageFach } from "@/komponenten/lernzettel-anfrage-fach";

export const dynamic = "force-dynamic";

export default async function LernzettelFachSeite({
  params,
}: {
  params: Promise<{ fach: string }>;
}) {
  const { fach: slug } = await params;
  const fach = findeFach(slug);
  if (!fach) notFound();

  const themen = fach.aktiv ? await listeThemen(fach.slug) : [];
  const alte = fach.aktiv ? await listeAlteLernzettel(fach.slug) : [];
  const mitLernzettel = themen.filter((t) => t.hatLernzettel);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link
        href={`/faecher/${fach.slug}`}
        className="text-[13px] text-muted hover:text-foreground"
      >
        ← {fachAnzeigename(fach)}
      </Link>
      <div className="mb-8 mt-4">
        <h1 className="text-[24px] font-semibold tracking-tight">Lernzettel anfordern</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Wähle die Themen, optional eine Themenübersicht und das Ausgabeformat. Claude
          erstellt den Lernzettel, sobald du im Chat Bescheid sagst.
        </p>
      </div>
      {alte.length + mitLernzettel.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-[16px] font-semibold tracking-tight">📚 Bisherige Lernzettel</h2>
          <div className="mb-3">
            <HandschriftHinweis />
          </div>
          <ul className="space-y-2">
            {alte.map((a) => (
              <li key={a.datei}>
                <a
                  href={`/api/lernzettel/${fach.slug}/${a.datei}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/40 px-3.5 py-2.5 transition-colors hover:bg-surface"
                >
                  <span className="text-[14px] font-medium">{a.titel}</span>
                  <span className="text-[12px] text-muted">
                    {a.art === "pdf" ? "PDF" : "HTML"}
                    {a.herkunft === "eigen" ? " · von dir erstellt" : ""}
                  </span>
                  <span className="flex-1" />
                  <span className="text-[13px] font-medium text-accent">Öffnen</span>
                </a>
              </li>
            ))}
            {mitLernzettel.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/faecher/${fach.slug}/themen/${t.slug}`}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/40 px-3.5 py-2.5 transition-colors hover:bg-surface"
                >
                  <span className="text-[14px] font-medium">{t.titel}</span>
                  <span className="text-[12px] text-muted">Lernzettel zum Thema</span>
                  <span className="flex-1" />
                  <span className="text-[13px] font-medium text-accent">Ansehen</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {fach.aktiv ? (
        <LernzettelAnfrageFach
          fachId={fach.slug}
          themen={themen.map((t) => ({ slug: t.slug, titel: t.titel, halbjahr: t.halbjahr ?? null }))}
        />
      ) : (
        <p className="rounded-3xl border border-dashed border-border p-6 text-[14px] text-muted">
          Dieses Fach ist noch nicht freigeschaltet.
        </p>
      )}
    </div>
  );
}
