import Link from "next/link";
import { ZurueckPfeil } from "@/komponenten/zurueck-pfeil";
import { ThemeUmschalter } from "@/komponenten/theme-umschalter";
import { GastAbmeldenKnopf } from "@/komponenten/gast-abmelden-knopf";
import { ladeAktuellenNutzer } from "@/lib/auth/aktueller-nutzer";

export async function Navigation() {
  const { eingeloggt, istGast } = await ladeAktuellenNutzer();

  return (
    <header className="sticky top-4 z-10 mx-auto w-full max-w-5xl px-4">
      <div className="flex h-14 items-center justify-between rounded-full border border-border bg-surface/90 px-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md">
        <div className="flex items-center">
          <ZurueckPfeil />
          <Link href="/" className="text-[15px] font-semibold tracking-tight">
            OberstufenApp
          </Link>
        </div>
        <nav className="flex items-center gap-1 text-[13px] font-medium">
          {eingeloggt && (
            <>
              <Link
                href="/"
                className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                Fächer
              </Link>
              <Link
                href="/suche"
                className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                Suche
              </Link>
              <Link
                href="/todos"
                className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                To-Dos
              </Link>
              <Link
                href="/abitur"
                className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                Abitur
              </Link>
              {!istGast && (
                <Link
                  href="/lernzettel-anfragen"
                  className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  Lernzettel
                </Link>
              )}
              {!istGast && (
                <Link
                  href="/gaeste"
                  className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  Gäste
                </Link>
              )}
              {istGast && <GastAbmeldenKnopf />}
            </>
          )}
          <div className="ml-1">
            <ThemeUmschalter />
          </div>
        </nav>
      </div>
    </header>
  );
}
