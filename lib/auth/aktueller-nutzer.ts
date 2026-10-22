import "server-only";
import { cache } from "react";
import { erstelleServerClient } from "@/lib/supabase/server";

/**
 * Wer ist gerade angemeldet? Einmal pro Anfrage geladen (cache), damit Layout und
 * Navigation nicht doppelt bei Supabase nachfragen.
 */
export const ladeAktuellenNutzer = cache(
  async (): Promise<{ eingeloggt: boolean; istGast: boolean }> => {
    const konfiguriert = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    if (!konfiguriert) return { eingeloggt: false, istGast: false };

    const supabase = await erstelleServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { eingeloggt: Boolean(user), istGast: Boolean(user?.is_anonymous) };
  }
);
