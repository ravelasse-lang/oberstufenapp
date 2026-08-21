"use client";

import { useEffect, useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";

/** true = anonymer Gast-Zugang (nur lesen), false = echter Besitzer-Login, null = wird noch geladen. */
export function useIstGast(): boolean | null {
  const [istGast, setIstGast] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = erstelleBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIstGast(Boolean(user?.is_anonymous));
    });
  }, []);

  return istGast;
}
