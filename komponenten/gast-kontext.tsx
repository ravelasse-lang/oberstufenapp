"use client";

import { createContext } from "react";

/**
 * Vom Server bei jeder Seitenanfrage gesetzt: true = Gast (nur lesen), false = Besitzer
 * oder nicht angemeldet, null = nicht gesetzt (dann fragt useIstGast selbst nach).
 * Verhindert, dass Gäste kurz die Besitzer-Oberfläche sehen, bevor die Prüfung im
 * Browser fertig ist.
 */
export const GastKontext = createContext<boolean | null>(null);

export function GastKontextProvider({
  istGast,
  children,
}: {
  istGast: boolean;
  children: React.ReactNode;
}) {
  return <GastKontext.Provider value={istGast}>{children}</GastKontext.Provider>;
}
