import { notFound } from "next/navigation";
import { fachAnzeigename, findeFach } from "@/lib/faecher-daten";
import { NotenEingabe } from "@/komponenten/noten-eingabe";

export const dynamic = "force-dynamic";

export default async function FortschrittSeite({
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
          Fortschritt — {fachAnzeigename(fach)}
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Zwischennoten, mündliche & schriftliche Noten und Zeugnisnoten im
          Verlauf.
        </p>
      </div>
      <NotenEingabe fachId={fach.slug} />
    </div>
  );
}
