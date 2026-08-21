"use client";

import { useEffect, useMemo, useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";
import { fachAnzeigename, faecher } from "@/lib/faecher-daten";
import { berechneGesamtabitur } from "@/lib/abitur/berechnung";
import type { BlockIEintrag, PruefungsArt, PruefungsEintrag } from "@/lib/abitur/typen";

const abiturFaecher = faecher.filter((f) => f.abiturRelevant);
const halbjahre = [1, 2, 3, 4] as const;

type ZelleState = { punkte: string; wirdEingebracht: boolean };
type MatrixState = Record<string, Record<number, ZelleState>>;

type PruefungState = {
  fachId: string;
  art: PruefungsArt;
  punkte: string;
};

const eingabeKlasse =
  "rounded-lg border border-border bg-transparent px-2 py-1.5 text-[13px] outline-none transition-colors focus:border-accent";

function leereMatrix(): MatrixState {
  const matrix: MatrixState = {};
  for (const fach of abiturFaecher) {
    matrix[fach.slug] = {};
    for (const hj of halbjahre) {
      matrix[fach.slug][hj] = { punkte: "", wirdEingebracht: true };
    }
  }
  return matrix;
}

function leerePruefungen(): PruefungState[] {
  return [1, 2, 3].map(() => ({ fachId: "", art: "schriftlich" as PruefungsArt, punkte: "" }))
    .concat([{ fachId: "", art: "muendlich", punkte: "" }]);
}

export function AbiturUebersicht() {
  const supabase = useMemo(() => erstelleBrowserClient(), []);
  const [matrix, setMatrix] = useState<MatrixState>(leereMatrix);
  const [pruefungen, setPruefungen] = useState<PruefungState[]>(leerePruefungen);
  const [laedt, setLaedt] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from("block_1_ergebnisse")
        .select("fach_id, halbjahr, punkte, wird_eingebracht"),
      supabase
        .from("pruefungsfaecher")
        .select("position, fach_id, pruefungsart, punkte")
        .order("position", { ascending: true }),
    ]).then(([blockRes, pruefungRes]) => {
      if (blockRes.data) {
        setMatrix((vorherige) => {
          const neu = structuredClone(vorherige);
          for (const row of blockRes.data) {
            if (!neu[row.fach_id]) continue;
            neu[row.fach_id][row.halbjahr] = {
              punkte: String(row.punkte),
              wirdEingebracht: row.wird_eingebracht,
            };
          }
          return neu;
        });
      }
      if (pruefungRes.data && pruefungRes.data.length > 0) {
        setPruefungen((vorherige) => {
          const neu = [...vorherige];
          for (const row of pruefungRes.data) {
            neu[row.position - 1] = {
              fachId: row.fach_id,
              art: row.pruefungsart,
              punkte: row.punkte === null ? "" : String(row.punkte),
            };
          }
          return neu;
        });
      }
      setLaedt(false);
    });
  }, [supabase]);

  async function zelleSpeichern(fachId: string, halbjahr: number, zelle: ZelleState) {
    const punkteNum = Number(zelle.punkte);
    if (zelle.punkte === "" || Number.isNaN(punkteNum)) return;
    await supabase.from("block_1_ergebnisse").upsert(
      {
        fach_id: fachId,
        halbjahr,
        punkte: punkteNum,
        wird_eingebracht: zelle.wirdEingebracht,
      },
      { onConflict: "user_id,fach_id,halbjahr" }
    );
  }

  function zelleAendern(fachId: string, halbjahr: number, aenderung: Partial<ZelleState>) {
    setMatrix((vorherige) => {
      const neu = structuredClone(vorherige);
      neu[fachId][halbjahr] = { ...neu[fachId][halbjahr], ...aenderung };
      zelleSpeichern(fachId, halbjahr, neu[fachId][halbjahr]);
      return neu;
    });
  }

  async function pruefungSpeichern(position: number, eintrag: PruefungState) {
    if (!eintrag.fachId) return;
    const punkteNum = eintrag.punkte === "" ? null : Number(eintrag.punkte);
    await supabase.from("pruefungsfaecher").upsert(
      {
        position,
        fach_id: eintrag.fachId,
        pruefungsart: eintrag.art,
        punkte: punkteNum,
      },
      { onConflict: "user_id,position" }
    );
  }

  function pruefungAendern(index: number, aenderung: Partial<PruefungState>) {
    setPruefungen((vorherige) => {
      const neu = [...vorherige];
      neu[index] = { ...neu[index], ...aenderung };
      pruefungSpeichern(index + 1, neu[index]);
      return neu;
    });
  }

  const ergebnis = useMemo(() => {
    const blockIEintraege: BlockIEintrag[] = [];
    for (const fach of abiturFaecher) {
      for (const hj of halbjahre) {
        const zelle = matrix[fach.slug]?.[hj];
        if (!zelle || zelle.punkte === "") continue;
        const punkte = Number(zelle.punkte);
        if (Number.isNaN(punkte)) continue;
        blockIEintraege.push({
          fachId: fach.slug,
          halbjahr: hj,
          punkte,
          wirdEingebracht: zelle.wirdEingebracht,
          zaehltDoppelt: Boolean(fach.zaehltDoppelt),
        });
      }
    }

    const pruefungsEintraege: PruefungsEintrag[] = pruefungen.map((p, i) => ({
      position: (i + 1) as 1 | 2 | 3 | 4,
      fachId: p.fachId,
      art: p.art,
      punkte: p.punkte === "" ? null : Number(p.punkte),
    }));

    return berechneGesamtabitur(blockIEintraege, pruefungsEintraege);
  }, [matrix, pruefungen]);

  if (laedt) return <p className="text-[13px] text-muted">Lädt…</p>;

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-border bg-surface/40 p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Block I</p>
            <p className="text-[20px] font-semibold">{ergebnis.blockI.punkte}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Block II</p>
            <p className="text-[20px] font-semibold">{ergebnis.blockII.punkte}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Gesamt</p>
            <p className="text-[20px] font-semibold">{ergebnis.gesamtpunkte} / 900</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Note</p>
            <p className="text-[20px] font-semibold">
              {ergebnis.note !== null ? ergebnis.note.toFixed(1) : "—"}
            </p>
          </div>
        </div>
        {(ergebnis.blockI.warnungen.length > 0 || ergebnis.blockII.warnungen.length > 0) && (
          <ul className="mt-4 space-y-1 border-t border-border pt-4 text-[12px] text-amber-600 dark:text-amber-400">
            {[...ergebnis.blockI.warnungen, ...ergebnis.blockII.warnungen].map((w) => (
              <li key={w}>⚠️ {w}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-[15px] font-semibold">Block I — Halbjahresergebnisse</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-3 font-medium">Fach</th>
                {halbjahre.map((hj) => (
                  <th key={hj} className="px-2 py-2 text-center font-medium">
                    HJ {hj}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {abiturFaecher.map((fach) => (
                <tr key={fach.slug} className="border-b border-border/60">
                  <td className="py-2 pr-3">
                    <span
                      className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                      style={{ backgroundColor: fach.akzentfarbe }}
                    />
                    {fachAnzeigename(fach)}
                  </td>
                  {halbjahre.map((hj) => {
                    const zelle = matrix[fach.slug][hj];
                    return (
                      <td key={hj} className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={15}
                            step={0.5}
                            value={zelle.punkte}
                            onChange={(e) =>
                              zelleAendern(fach.slug, hj, { punkte: e.target.value })
                            }
                            className={`w-14 text-center ${eingabeKlasse}`}
                          />
                          <input
                            type="checkbox"
                            title="einbringen"
                            checked={zelle.wirdEingebracht}
                            onChange={(e) =>
                              zelleAendern(fach.slug, hj, {
                                wirdEingebracht: e.target.checked,
                              })
                            }
                            className="h-3.5 w-3.5 accent-accent"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-muted">
          Häkchen = wird eingebracht (nicht gestrichen). Leer lassen, wenn noch
          keine Note vorliegt.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-[15px] font-semibold">Block II — Prüfungsfächer</h2>
        <div className="space-y-2">
          {pruefungen.map((p, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <span className="w-6 text-[12px] text-muted">P{i + 1}</span>
              <select
                value={p.fachId}
                onChange={(e) => pruefungAendern(i, { fachId: e.target.value })}
                className={eingabeKlasse}
              >
                <option value="">Fach wählen…</option>
                {abiturFaecher.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {fachAnzeigename(f)}
                  </option>
                ))}
              </select>
              <select
                value={p.art}
                onChange={(e) =>
                  pruefungAendern(i, { art: e.target.value as PruefungsArt })
                }
                className={eingabeKlasse}
              >
                <option value="schriftlich">Schriftlich</option>
                <option value="muendlich">Mündlich</option>
                <option value="praesentation">Präsentation</option>
              </select>
              <input
                type="number"
                min={0}
                max={15}
                step={0.5}
                placeholder="Punkte"
                value={p.punkte}
                onChange={(e) => pruefungAendern(i, { punkte: e.target.value })}
                className={`w-20 ${eingabeKlasse}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
