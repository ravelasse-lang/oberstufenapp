import type { SupabaseClient } from "@supabase/supabase-js";
import { leseSeitenTexte } from "@/lib/pdf-text";

/**
 * Liest den Text einer PDF-Datei und legt ihn seitenweise für die Suche ab
 * (Tabelle dokument_seiten) und markiert die Datei als indexiert. Gibt die Zahl der
 * Seiten mit Text zurück. Wirft bei Fehlern; Aufrufer entscheiden, ob das stört.
 */
export async function indexiereDatei(
  supabase: SupabaseClient,
  userId: string,
  dateiId: string,
  daten: ArrayBuffer
): Promise<number> {
  const seiten = await leseSeitenTexte(daten);
  const zeilen = seiten
    .map((inhalt, i) => ({ user_id: userId, datei_id: dateiId, seite: i + 1, inhalt }))
    .filter((z) => z.inhalt.length > 0);

  // Alte Zeilen (falls neu indexiert wird) ersetzen.
  await supabase.from("dokument_seiten").delete().eq("datei_id", dateiId);
  for (let i = 0; i < zeilen.length; i += 25) {
    const { error } = await supabase.from("dokument_seiten").insert(zeilen.slice(i, i + 25));
    if (error) throw new Error(error.message);
  }
  const { error: markierFehler } = await supabase
    .from("dateien")
    .update({ indexiert_am: new Date().toISOString() })
    .eq("id", dateiId);
  if (markierFehler) throw new Error(markierFehler.message);
  return zeilen.length;
}

/**
 * Liest den Text aller PDFs, die noch nicht durchsuchbar sind (alle Fächer oder nur eines).
 * Meldet den Fortschritt über onStand. Einzelne Fehler stoppen den Rest nicht.
 */
export async function indexiereAlleOffenen(
  supabase: SupabaseClient,
  userId: string,
  onStand: (stand: { fertig: number; gesamt: number; fehler: string[] }) => void,
  fachId?: string
): Promise<{ fertig: number; gesamt: number; fehler: string[] }> {
  let abfrage = supabase
    .from("dateien")
    .select("id, dateiname, storage_pfad")
    .is("indexiert_am", null)
    .ilike("dateiname", "%.pdf");
  if (fachId) abfrage = abfrage.eq("fach_id", fachId);
  const { data: offen } = await abfrage;
  const liste = offen ?? [];
  let fertig = 0;
  const fehler: string[] = [];
  onStand({ fertig, gesamt: liste.length, fehler });
  for (const d of liste) {
    try {
      const { data: blob, error } = await supabase.storage.from("fach-dateien").download(d.storage_pfad);
      if (error || !blob) throw new Error(error?.message ?? "Download fehlgeschlagen");
      await indexiereDatei(supabase, userId, d.id, await blob.arrayBuffer());
      fertig++;
    } catch (e) {
      fehler.push(`${d.dateiname}: ${e instanceof Error ? e.message : "Fehler"}`);
    }
    onStand({ fertig, gesamt: liste.length, fehler: [...fehler] });
  }
  return { fertig, gesamt: liste.length, fehler };
}
