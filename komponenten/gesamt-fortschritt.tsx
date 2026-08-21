"use client";

import { useEffect, useMemo, useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";
import { fachAnzeigename, faecher } from "@/lib/faecher-daten";

type NotenPunkt = { fach_id: string; wert: number; datum: string };

const BREITE = 720;
const HOEHE = 240;
const RAND = { oben: 16, unten: 24, links: 28, rechts: 16 };

export function GesamtFortschritt() {
  const supabase = useMemo(() => erstelleBrowserClient(), []);
  const [punkte, setPunkte] = useState<NotenPunkt[]>([]);
  const [laedt, setLaedt] = useState(true);

  useEffect(() => {
    supabase
      .from("noten")
      .select("fach_id, wert, datum")
      .order("datum", { ascending: true })
      .then(({ data }) => {
        setPunkte(data ?? []);
        setLaedt(false);
      });
  }, [supabase]);

  if (laedt) return null;
  if (punkte.length === 0) return null;

  const gruppen: Record<string, NotenPunkt[]> = {};
  for (const p of punkte) {
    (gruppen[p.fach_id] ??= []).push(p);
  }

  const alleDaten = punkte.map((p) => new Date(p.datum).getTime());
  const minDatum = Math.min(...alleDaten);
  const maxDatum = Math.max(...alleDaten);
  const spanne = maxDatum - minDatum || 1;

  const plotBreite = BREITE - RAND.links - RAND.rechts;
  const plotHoehe = HOEHE - RAND.oben - RAND.unten;

  const x = (datum: string) =>
    RAND.links + ((new Date(datum).getTime() - minDatum) / spanne) * plotBreite;
  const y = (wert: number) => RAND.oben + plotHoehe - (wert / 15) * plotHoehe;

  const serien = Object.entries(gruppen)
    .map(([fachId, werte]) => {
      const fach = faecher.find((f) => f.slug === fachId);
      if (!fach) return null;
      const sortiert = [...werte].sort(
        (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()
      );
      return { fach, punkte: sortiert };
    })
    .filter((s): s is { fach: (typeof faecher)[number]; punkte: NotenPunkt[] } => s !== null);

  const gitterWerte = [0, 5, 10, 15];

  return (
    <div className="mb-8 rounded-3xl border border-border bg-surface p-5">
      <p className="mb-3 text-[13px] font-medium text-muted">
        Fortschritt über alle Fächer
      </p>
      <svg viewBox={`0 0 ${BREITE} ${HOEHE}`} className="w-full" role="img" aria-label="Gesamtfortschritt">
        {gitterWerte.map((wert) => (
          <g key={wert}>
            <line
              x1={RAND.links}
              x2={BREITE - RAND.rechts}
              y1={y(wert)}
              y2={y(wert)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text x={4} y={y(wert) + 4} fontSize={10} fill="var(--muted)">
              {wert}
            </text>
          </g>
        ))}

        {serien.map(({ fach, punkte: serienPunkte }) => {
          const pfad = serienPunkte
            .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.datum)} ${y(p.wert)}`)
            .join(" ");
          return (
            <g key={fach.slug}>
              <path
                d={pfad}
                fill="none"
                stroke={fach.akzentfarbe}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {serienPunkte.map((p, i) => (
                <circle
                  key={i}
                  cx={x(p.datum)}
                  cy={y(p.wert)}
                  r={3.5}
                  fill={fach.akzentfarbe}
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  <title>
                    {fachAnzeigename(fach)}: {p.wert} Punkte
                  </title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
        {serien.map(({ fach }) => (
          <span key={fach.slug} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: fach.akzentfarbe }}
            />
            {fachAnzeigename(fach)}
          </span>
        ))}
      </div>
    </div>
  );
}
