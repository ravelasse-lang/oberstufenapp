import { notFound } from "next/navigation";
import { fachAnzeigename, findeFach } from "@/lib/faecher-daten";
import { DateiUpload } from "@/komponenten/datei-upload";

export const dynamic = "force-dynamic";

export default async function HochladenSeite({
  params,
}: {
  params: Promise<{ fach: string }>;
}) {
  const { fach: slug } = await params;
  const fach = findeFach(slug);
  if (!fach || !fach.aktiv) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14">
      <div className="mb-10">
        <h1 className="text-[24px] font-semibold tracking-tight">
          Dateien — {fachAnzeigename(fach)}
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Lehrplan, Klausuren, Notizen oder eigene Ordner — jedes Dateiformat.
        </p>
      </div>
      <DateiUpload fachId={fach.slug} />
    </div>
  );
}
