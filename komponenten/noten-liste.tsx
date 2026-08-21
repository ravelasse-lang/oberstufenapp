"use client";

import { useState } from "react";
import type { Note, NotenTyp } from "@/lib/noten";
import { notenTypLabel } from "@/lib/noten";

const eingabeKlasse =
  "rounded-lg border border-border bg-transparent px-2 py-1 text-[13px] outline-none transition-colors focus:border-accent";

function kurzesDatum(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

export function NotenListe({
  noten,
  istGast,
  onAendern,
  onLoeschen,
}: {
  noten: Note[];
  istGast: boolean;
  onAendern: (id: string, patch: Partial<Note>) => Promise<boolean>;
  onLoeschen: (id: string) => void;
}) {
  const [bearbeiteId, setBearbeiteId] = useState<string | null>(null);
  const [entwurf, setEntwurf] = useState<{
    typ: NotenTyp;
    wert: string;
    datum: string;
    bezeichnung: string;
  } | null>(null);
  const [fehler, setFehler] = useState("");

  if (noten.length === 0) return null;

  function bearbeitenStarten(n: Note) {
    setBearbeiteId(n.id);
    setFehler("");
    setEntwurf({
      typ: n.typ,
      wert: String(n.wert),
      datum: n.datum,
      bezeichnung: n.bezeichnung ?? "",
    });
  }

  async function bearbeitenSpeichern(id: string) {
    if (!entwurf) return;
    const wertNum = Number(entwurf.wert);
    if (Number.isNaN(wertNum) || wertNum < 0 || wertNum > 15) {
      setFehler("Punkte müssen zwischen 0 und 15 liegen.");
      return;
    }
    const erfolg = await onAendern(id, {
      typ: entwurf.typ,
      wert: wertNum,
      datum: entwurf.datum,
      bezeichnung: entwurf.bezeichnung.trim() || null,
    });
    if (erfolg) {
      setBearbeiteId(null);
      setEntwurf(null);
      setFehler("");
    } else {
      setFehler("Speichern fehlgeschlagen.");
    }
  }

  const sortiert = [...noten].sort(
    (a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()
  );

  return (
    <div className="space-y-2">
      <p className="text-[13px] font-medium">Eingetragene Noten</p>
      <ul className="space-y-2">
        {sortiert.map((n) => {
          const wirdBearbeitet = bearbeiteId === n.id;

          if (wirdBearbeitet && entwurf) {
            return (
              <li
                key={n.id}
                className="space-y-2 rounded-xl border border-accent/40 bg-surface/60 p-3"
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <select
                    value={entwurf.typ}
                    onChange={(e) =>
                      setEntwurf({ ...entwurf, typ: e.target.value as NotenTyp })
                    }
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
                    value={entwurf.wert}
                    onChange={(e) => setEntwurf({ ...entwurf, wert: e.target.value })}
                    className={eingabeKlasse}
                  />
                  <input
                    type="date"
                    value={entwurf.datum}
                    onChange={(e) => setEntwurf({ ...entwurf, datum: e.target.value })}
                    className={eingabeKlasse}
                  />
                  <input
                    type="text"
                    placeholder="Bezeichnung"
                    value={entwurf.bezeichnung}
                    onChange={(e) =>
                      setEntwurf({ ...entwurf, bezeichnung: e.target.value })
                    }
                    className={eingabeKlasse}
                  />
                </div>
                {fehler && <p className="text-[12px] text-red-500">{fehler}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => bearbeitenSpeichern(n.id)}
                    className="rounded-full bg-accent px-3 py-1 text-[12px] font-medium text-accent-foreground"
                  >
                    Speichern
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBearbeiteId(null);
                      setEntwurf(null);
                      setFehler("");
                    }}
                    className="rounded-full border border-border px-3 py-1 text-[12px] text-muted"
                  >
                    Abbrechen
                  </button>
                </div>
              </li>
            );
          }

          return (
            <li
              key={n.id}
              className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-surface/40 px-3.5 py-2.5"
            >
              <span className="text-[13px] tabular-nums text-muted">
                {kurzesDatum(n.datum)}
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
                {notenTypLabel[n.typ]}
              </span>
              <span className="text-[14px] font-medium">{n.wert} Punkte</span>
              {n.bezeichnung && (
                <span className="text-[13px] text-muted">{n.bezeichnung}</span>
              )}
              <span className="flex-1" />
              {!istGast && (
                <>
                  <button
                    type="button"
                    onClick={() => bearbeitenStarten(n)}
                    aria-label="Bearbeiten"
                    className="text-[13px] opacity-40 hover:opacity-80"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoeschen(n.id)}
                    aria-label="Löschen"
                    className="text-[13px] opacity-40 hover:opacity-80"
                  >
                    🗑
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
