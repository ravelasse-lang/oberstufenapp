/**
 * Gemeinsamer Besitzer-Vergleich für proxy.ts und app/auth/callback/route.ts,
 * damit beide E-Mails gleich behandeln (getrimmt, Groß-/Kleinschreibung egal).
 * OWNER_EMAIL ist eine rein serverseitige Env-Variable (kein NEXT_PUBLIC).
 */
function normalisiere(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** Ist OWNER_EMAIL auf dem Server gesetzt? Ohne sie gibt es keine Besitzer-Sperre. */
export function besitzerKonfiguriert(): boolean {
  return normalisiere(process.env.OWNER_EMAIL) !== "";
}

/** Gehört diese E-Mail dem Besitzer? Immer false, wenn OWNER_EMAIL fehlt. */
export function istBesitzer(email: string | null | undefined): boolean {
  const besitzer = normalisiere(process.env.OWNER_EMAIL);
  return besitzer !== "" && normalisiere(email) === besitzer;
}
