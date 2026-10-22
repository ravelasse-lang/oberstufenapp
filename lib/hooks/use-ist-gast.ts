"use client";

import { useContext, useEffect, useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";
import { GastKontext } from "@/komponenten/gast-kontext";

/**
 * true = anonymer Gast-Zugang (nur lesen), false = echter Besitzer-Login.
 * Normalerweise kommt der Wert schon vom Server (GastKontext), sodass es kein
 * Flackern gibt. Nur ohne Kontext wird im Browser nachgefragt (null = lädt noch).
 */
export function useIstGast(): boolean | null {
  const vomServer = useContext(GastKontext);
  const [selbstErmittelt, setSelbstErmittelt] = useState<boolean | null>(null);

  useEffect(() => {
    if (vomServer !== null) return;
    const supabase = erstelleBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSelbstErmittelt(Boolean(user?.is_anonymous));
    });
  }, [vomServer]);

  return vomServer ?? selbstErmittelt;
}
