"use client";

import { useEffect, useMemo, useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";
import { NotenKurve } from "@/komponenten/noten-kurve";
import { NotenListe } from "@/komponenten/noten-liste";
import type { Note, NotenTyp } from "@/lib/noten";
import { notenTypLabel } from "@/lib/noten";

const eingabeKlasse =
  "rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-accent";

export function NotenEingabe({ fachId }: { fachId: string }) {
  const supabase = useMemo(() => erstelleBrowserClient(), []);
  const [noten, setNoten] = useState<Note[]>([]);
  const [ziel, setZiel] = useState<number | null>(null);
  const [zielEingabe, setZielEingabe] = useState("");
  const [zielFehler, setZielFehler] = useState("");
  const [laedt, setLaedt] = useState(true);

  const [typ, setTyp] = useState<NotenTyp>("schriftlich");
  const [wert, setWert] = useState("");
  const [bezeichnung, setBezeichnung] = useState("");
  const [datum, setDatum] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    Promise.all([
      supabase
        .from("noten")
        .select("id, fach_id, typ, wert, bezeichnung, datum")
        .eq("fach_id", fachId)
        .order("datum", { ascending: true }),
      supabase
        .from("fach_ziele")
        .select("ziel_note")
        .eq("fach_id", fachId)
        .maybeSingle(),
    ]).then(([notenRes, zielRes]) => {
      setNoten(notenRes.data ?? []);
      if (zielRes.data) {
        setZiel(zielRes.data.ziel_note);
        setZielEingabe(String(zielRes.data.ziel_note));
      }
      setLaedt(false);
    });
  }, [supabase, fachId]);

  async function noteHinzufuegen(e: React.FormEvent) {
    e.preventDefault();
    const wertNum = Number(wert);
    if (Number.isNaN(wertNum) || wertNum < 0 || wertNum > 15) return;

    const { data, error } = await supabase
      .from("noten")
      .insert({
        fach_id: fachId,
        typ,
        wert: wertNum,
        bezeichnung: bezeichnung.trim() || null,
        datum,
      })
      .select("id, fach_id, typ, wert, bezeichnung, datum")
      .single();

    if (!error && data) {
      setNoten((vorherige) =>
        [...vorherige, data].sort(
          (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()
        )
      );
      setWert("");
      setBezeichnung("");
    }
  }

  async function noteAendern(id: string, patch: Partial<Note>) {
    const { data, error } = await supabase
      .from("noten")
      .update(patch)
      .eq("id", id)
      .select("id, fach_id, typ, wert, bezeichnung, datum")
      .single();

    if (error || !data) return false;
    setNoten((vorherige) => vorherige.map((n) => (n.id === id ? data : n)));
    return true;
  }

  async function noteLoeschen(id: string) {
    setNoten((vorherige) => vorherige.filter((n) => n.id !== id));
    await supabase.from("noten").delete().eq("id", id);
  }

  async function zielSpeichern(e: React.FormEvent) {
    e.preventDefault();
    const zielNum = Number(zielEingabe);
    if (Number.isNaN(zielNum) || zielNum < 0 || zielNum > 15) return;

    const { error } = await supabase
      .from("fach_ziele")
      .upsert(
        { fach_id: fachId, ziel_note: zielNum },
        { onConflict: "user_id,fach_id" }
      );

    if (error) {
      setZielFehler(error.message);
    } else {
      setZielFehler("");
      setZiel(zielNum);
    }
  }

  if (laedt) return <p className="text-[13px] text-muted">Lädt…</p>;

  return (
    <div className="space-y-8">
      <NotenKurve noten={noten} ziel={ziel} />

      <NotenListe noten={noten} onAendern={noteAendern} onLoeschen={noteLoeschen} />

      <form onSubmit={zielSpeichern} className="space-y-1.5">
        <div className="flex items-end gap-2">
          <label className="flex-1 space-y-1.5">
            <span className="text-[12px] text-muted">Ziel-Note (0–15 Punkte)</span>
            <input
              type="number"
              min={0}
              max={15}
              step={0.5}
              value={zielEingabe}
              onChange={(e) => setZielEingabe(e.target.value)}
              className={`w-full ${eingabeKlasse}`}
            />
          </label>
          <button
            type="submit"
            className="rounded-xl border border-border px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-surface"
          >
            Ziel speichern
          </button>
        </div>
        {zielFehler && <p className="text-[13px] text-red-500">{zielFehler}</p>}
      </form>

      <form onSubmit={noteHinzufuegen} className="space-y-3 rounded-2xl border border-border bg-surface/40 p-4">
        <p className="text-[13px] font-medium">Neue Note eintragen</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            value={typ}
            onChange={(e) => setTyp(e.target.value as NotenTyp)}
            className={eingabeKlasse}
          >
            {(Object.keys(notenTypLabel) as NotenTyp[]).map((t) => (
              <option key={t} value={t}>
                {notenTypLabel[t]}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={15}
            step={0.5}
            required
            placeholder="Punkte"
            value={wert}
            onChange={(e) => setWert(e.target.value)}
            className={eingabeKlasse}
          />
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className={eingabeKlasse}
          />
          <input
            type="text"
            placeholder="Bezeichnung (optional)"
            value={bezeichnung}
            onChange={(e) => setBezeichnung(e.target.value)}
            className={eingabeKlasse}
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Note hinzufügen
        </button>
      </form>
    </div>
  );
}
