"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { elternPfad } from "@/lib/eltern-pfad";

/**
 * Zurück-Pfeil in der Navigationsleiste: führt auf die übergeordnete Seite (siehe lib/eltern-pfad.ts),
 * nicht einen Schritt im Browser-Verlauf zurück. Auf Startseite und Login wird er nicht angezeigt.
 */
export function ZurueckPfeil() {
  const pfad = usePathname();
  if (pfad === "/" || pfad.startsWith("/login")) return null;

  return (
    <Link
      href={elternPfad(pfad)}
      aria-label="Zurück zur vorherigen Ebene"
      title="Zurück zur vorherigen Ebene"
      className="mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-[16px] text-muted transition-colors hover:bg-background hover:text-foreground"
    >
      ←
    </Link>
  );
}
