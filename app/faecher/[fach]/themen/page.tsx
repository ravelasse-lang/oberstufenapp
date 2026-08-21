import Link from "next/link";
import { notFound } from "next/navigation";
import { fachAnzeigename, findeFach } from "@/lib/faecher-daten";
import { listeThemen } from "@/lib/vault/lesen";
import { DateiUpload } from "@/komponenten/datei-upload";

export const dynamic = "force-dynamic";

export default async function ThemenSeite({
  params,
}: {
  params: Promise<{ fach: string }>;
}) {
  const { fach: slug } = await params;
  const fach = findeFach(slug);
  if (!fach || !fach.aktiv) notFound();

  const themen = await listeThemen(fach.slug);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14">
      <div className="mb-10">
        <h1 className="text-[24px] font-semibold tracking-tight">
          Themen — {fachAnzeigename(fach)}
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Themen liegen als Markdown-Dateien im Vault-Ordner{" "}
          <code>Vault/{fach.slug}/</code> — in Obsidian direkt bearbeitbar.
        </p>
      </div>

      {themen.length === 0 ? (
        <p className="mb-10 rounded-2xl border border-dashed border-border p-6 text-[14px] text-muted">
          Noch keine Themen angelegt. Leg eine <code>.md</code>-Datei in{" "}
          <code>Vault/{fach.slug}/</code> an (siehe Beispiel in{" "}
          <code>Vault/biologie/genetik.md</code>).
        </p>
      ) : (
        <ul className="mb-10 space-y-2">
          {themen.map((thema) => (
            <li key={thema.slug}>
              <Link
                href={`/faecher/${fach.slug}/themen/${thema.slug}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface/40 px-3.5 py-2.5 transition-colors hover:bg-surface"
              >
                <span className="text-[14px] font-medium">{thema.titel}</span>
                <span className="flex items-center gap-2 text-[12px] text-muted">
                  {thema.halbjahr && <span>HJ {thema.halbjahr}</span>}
                  {thema.hatLernzettel && <span>📝</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div>
        <h2 className="mb-3 text-[15px] font-semibold">
          Referenzmaterial (Themenübersicht, Scans)
        </h2>
        <DateiUpload fachId={fach.slug} />
      </div>
    </div>
  );
}
