import type { Note } from "@/lib/noten";
import { notenTypLabel } from "@/lib/noten";

const BREITE = 640;
const HOEHE = 260;
const RAND = { oben: 20, unten: 32, links: 28, rechts: 16 };

function kurzesDatum(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

export function NotenKurve({
  noten,
  ziel,
}: {
  noten: Note[];
  ziel: number | null;
}) {
  if (noten.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-[13px] text-muted">
        Noch keine Noten erfasst — trag unten deine erste Note ein.
      </p>
    );
  }

  const sortiert = [...noten].sort(
    (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()
  );

  const plotBreite = BREITE - RAND.links - RAND.rechts;
  const plotHoehe = HOEHE - RAND.oben - RAND.unten;

  const x = (i: number) =>
    sortiert.length === 1
      ? RAND.links + plotBreite / 2
      : RAND.links + (i / (sortiert.length - 1)) * plotBreite;

  const y = (wert: number) => RAND.oben + plotHoehe - (wert / 15) * plotHoehe;

  const linienPfad = sortiert
    .map((n, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(n.wert)}`)
    .join(" ");

  const gitterWerte = [0, 5, 10, 15];
  const labelSchritt = Math.ceil(sortiert.length / 6);

  return (
    <div className="noten-kurve space-y-3">
      <style>{`
        .noten-kurve { --linie: #0071e3; --ziel-linie: #8e8e93; --gut: #0ca30c; --kritisch: #d03b3b; --gitter: #d2d2d7; --ring: var(--background); }
        .dark .noten-kurve { --linie: #2997ff; --ziel-linie: #98989d; --gut: #17c317; --kritisch: #e66767; --gitter: #2c2c2e; }
      `}</style>
      <svg viewBox={`0 0 ${BREITE} ${HOEHE}`} className="w-full" role="img" aria-label="Notenverlauf">
        {gitterWerte.map((wert) => (
          <g key={wert}>
            <line
              x1={RAND.links}
              x2={BREITE - RAND.rechts}
              y1={y(wert)}
              y2={y(wert)}
              stroke="var(--gitter)"
              strokeWidth={1}
            />
            <text x={4} y={y(wert) + 4} fontSize={10} fill="var(--muted)">
              {wert}
            </text>
          </g>
        ))}

        {ziel !== null && (
          <>
            <line
              x1={RAND.links}
              x2={BREITE - RAND.rechts}
              y1={y(ziel)}
              y2={y(ziel)}
              stroke="var(--ziel-linie)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            <text
              x={BREITE - RAND.rechts}
              y={y(ziel) - 5}
              fontSize={10}
              textAnchor="end"
              fill="var(--muted)"
            >
              Ziel: {ziel}
            </text>
          </>
        )}

        <path d={linienPfad} fill="none" stroke="var(--linie)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {sortiert.map((n, i) => {
          const istZeugnisnote = n.typ === "zeugnisnote";
          const radius = istZeugnisnote ? 6 : 4;
          const zeigeLabel = i % labelSchritt === 0 || i === sortiert.length - 1;
          let farbe = "var(--linie)";
          if (istZeugnisnote && ziel !== null) {
            farbe = n.wert >= ziel ? "var(--gut)" : "var(--kritisch)";
          }

          return (
            <g key={n.id}>
              <circle
                cx={x(i)}
                cy={y(n.wert)}
                r={radius}
                fill={farbe}
                stroke="var(--ring)"
                strokeWidth={2}
              >
                <title>
                  {notenTypLabel[n.typ]}: {n.wert} Punkte ({kurzesDatum(n.datum)}
                  {n.bezeichnung ? ` — ${n.bezeichnung}` : ""})
                </title>
              </circle>
              {istZeugnisnote && (
                <text
                  x={x(i)}
                  y={y(n.wert) - 12}
                  fontSize={11}
                  fontWeight={600}
                  textAnchor="middle"
                  fill="var(--foreground)"
                >
                  {n.wert}
                </text>
              )}
              {zeigeLabel && (
                <text
                  x={x(i)}
                  y={HOEHE - 10}
                  fontSize={9}
                  textAnchor="middle"
                  fill="var(--muted)"
                >
                  {kurzesDatum(n.datum)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--linie)" }} />
          Note
        </span>
        {ziel !== null && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-3 border-t-2 border-dashed" style={{ borderColor: "var(--ziel-linie)" }} />
              Ziel
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--gut)" }} />
              Zeugnisnote ≥ Ziel
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--kritisch)" }} />
              Zeugnisnote &lt; Ziel
            </span>
          </>
        )}
      </div>
    </div>
  );
}
