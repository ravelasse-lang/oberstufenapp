import Link from "next/link";
import { notFound } from "next/navigation";
import { fachAnzeigename, findeFach } from "@/lib/faecher-daten";
import { listeThemen } from "@/lib/vault/lesen";
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
