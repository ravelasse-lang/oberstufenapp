"use client";

import { useRouter } from "next/navigation";
import { erstelleBrowserClient } from "@/lib/supabase/client";

export function GastAbmeldenKnopf() {
  const router = useRouter();

  async function abmelden() {
    const supabase = erstelleBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={abmelden}
      className="rounded-full bg-background px-3 py-1.5 text-muted transition-colors hover:text-foreground"
    >
      👁 Nur ansehen · Abmelden
    </button>
  );
}
