import Link from "next/link";
import { notFound } from "next/navigation";
import { fachAnzeigename, findeFach } from "@/lib/faecher-daten";

export default async function FachSeite({
  params,
}: {
  params: Promise<{ fach: string }>;
}) {
  const { fach: slug } = await params;
  const fach = findeFach(slug);

  if (!fach) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[16px] font-semibold text-white"
          style={{ backgroundColor: fach.akzentfarbe }}
        >
          {fach.name.charAt(0)}
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">
          {fachAnzeigename(fach)}
        </h1>
      </div>

      {fach.aktiv ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href={`/faecher/${fach.slug}/themen`}
            className="rounded-3xl border border-border bg-surface px-4 py-6 text-[14px] font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(0,0,0,0.2)]"
          >
            📚 Themen
          </Link>
          <Link
            href={`/faecher/${fach.slug}/hochladen`}
            className="rounded-3xl border border-border bg-surface px-4 py-6 text-[14px] font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(0,0,0,0.2)]"
          >
            📁 Dateien
          </Link>
          <Link
            href={`/faecher/${fach.slug}/fortschritt`}
            className="rounded-3xl border border-border bg-surface px-4 py-6 text-[14px] font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(0,0,0,0.2)]"
          >
            📈 Fortschritt
          </Link>
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-border p-6 text-[14px] text-muted">
          Dieses Fach ist noch nicht freigeschaltet. Wir testen das Konzept
          zuerst mit Biologie und Chemie — {fachAnzeigename(fach)} folgt danach.
        </p>
      )}
    </div>
  );
}
