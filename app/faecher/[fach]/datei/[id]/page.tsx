import Link from "next/link";
import { notFound } from "next/navigation";
import { findeFach } from "@/lib/faecher-daten";
import { erstelleServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Zeigt eine hochgeladene Datei direkt in der App (PDF/Bild), ohne sie herunterzuladen.
// Die Datei wird über eine kurzlebige, signierte Adresse aus dem privaten Speicher geladen;
// Zugriff regeln wie überall die Datenbank-Policies (Besitzer, Gäste nur lesend).
export default async function DateiAnsicht({
  params,
}: {
  params: Promise<{ fach: string; id: string }>;
}) {
  const { fach: fachSlug, id } = await params;
  const fach = findeFach(fachSlug);
  if (!fach || !UUID.test(id)) notFound();

  const supabase = await erstelleServerClient();
  const { data: datei } = await supabase
    .from("dateien")
    .select("id, dateiname, storage_pfad, ordner")
    .eq("id", id)
    .eq("fach_id", fach.slug)
    .maybeSingle();
  if (!datei) notFound();

  const { data: signiert } = await supabase.storage
    .from("fach-dateien")
    .createSignedUrl(datei.storage_pfad, 3600);
  const url = signiert?.signedUrl;
  const endung = datei.dateiname.toLowerCase().split(".").pop() ?? "";
  const istPdf = endung === "pdf";
  const istBild = ["png", "jpg", "jpeg", "gif", "webp"].includes(endung);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
      <Link
        href={`/faecher/${fach.slug}/hochladen`}
        className="text-[13px] text-muted hover:text-foreground"
      >
        ← Dateien
      </Link>
      <div className="mb-4 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold tracking-tight">
          {datei.dateiname}
        </h1>
        {url && (
          <>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-surface"
            >
              In neuem Tab öffnen
            </a>
            <a
              href={url}
              download={datei.dateiname}
              className="rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-surface"
            >
              Herunterladen
            </a>
          </>
        )}
      </div>
      {!url ? (
        <p className="text-[14px] text-muted">Die Datei konnte nicht geladen werden.</p>
      ) : istPdf ? (
        <iframe
          src={url}
          title={datei.dateiname}
          className="min-h-[75vh] w-full flex-1 rounded-2xl border border-border bg-white"
        />
      ) : istBild ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={datei.dateiname}
          className="max-h-[80vh] w-full rounded-2xl border border-border object-contain"
        />
      ) : (
        <p className="text-[14px] text-muted">
          Dieses Dateiformat lässt sich nicht in der App anzeigen. Nutze „Herunterladen“.
        </p>
      )}
    </div>
  );
}
