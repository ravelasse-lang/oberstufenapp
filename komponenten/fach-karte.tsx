import Link from "next/link";
import { fachAnzeigename, type Fach } from "@/lib/faecher-daten";

export function FachKarte({ fach }: { fach: Fach }) {
  return (
    <Link
      href={`/faecher/${fach.slug}`}
      className="group flex items-center justify-between gap-3 rounded-3xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(0,0,0,0.2)]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[15px] font-semibold text-white"
          style={{ backgroundColor: fach.akzentfarbe }}
        >
          {fach.name.charAt(0)}
        </span>
        <p className="truncate text-[14px] font-medium text-foreground">
          {fachAnzeigename(fach)}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
          fach.aktiv
            ? "bg-accent text-accent-foreground"
            : "bg-background text-muted"
        }`}
      >
        {fach.aktiv ? "Aktiv" : "Bald"}
      </span>
    </Link>
  );
}
