"use client";

import { useEffect, useMemo, useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";
import { useIstGast } from "@/lib/hooks/use-ist-gast";
import { indexiereAlleOffenen } from "@/lib/dokument-index";

/** Zeigt (nur dem Besitzer), wie viele PDFs noch nicht durchsuchbar sind, und liest sie ein. */
export function IndexKnopf() {
  const istGast = useIstGast();
  const supabase = useMemo(() => erstelleBrowserClient(), []);
  const [offen, setOffen] = useState<number | null>(null);
  const [stand, setStand] = useState<{ laeuft: boolean; fertig: number; gesamt: number; fehler: string[] }>(
    { laeuft: false, fertig: 0, gesamt: 0, fehler: [] }
  );

  useEffect(() => {
    supabase
      .from("dateien")
      .select("id", { count: "exact", head: true })
      .is("indexiert_am", null)
      .ilike("dateiname", "%.pdf")
      .then(({ count }) => setOffen(count ?? 0));
  }, [supabase]);

  if (istGast || (offen === 0 && !stand.laeuft && stand.fertig === 0)) return null;
  if (offen === null) return null;

  async function starten() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setStand({ laeuft: true, fertig: 0, gesamt: offen ?? 0, fehler: [] });
    const ergebnis = await indexiereAlleOffenen(supabase, user.id, (s) =>
      setStand({ laeuft: true, ...s })
    );
    setStand({ laeuft: false, ...ergebnis });
    setOffen(ergebnis.gesamt - ergebnis.fertig);
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-surface/40 p-4 text-[13px]">
      {stand.laeuft ? (
        <p>Liest Texte… {stand.fertig}/{stand.gesamt}</p>
      ) : stand.fertig > 0 && (offen ?? 0) === 0 ? (
        <p>Fertig: {stand.fertig} PDFs sind jetzt durchsuchbar. Such einfach noch einmal.</p>
      ) : (
        <>
          <p>
            {offen} PDFs sind noch nicht durchsuchbar. Die Suche findet sie erst, wenn ihr Text gelesen wurde.
          </p>
          <button
            type="button"
            onClick={starten}
            className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Durchsuchbar machen
          </button>
        </>
      )}
      {stand.fehler.map((f) => (
        <p key={f} className="text-red-500">{f}</p>
      ))}
    </div>
  );
}
