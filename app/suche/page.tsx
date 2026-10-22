import Link from "next/link";
import { faecher, fachAnzeigename } from "@/lib/faecher-daten";
import { erstelleServerClient } from "@/lib/supabase/server";
import { sucheThemen } from "@/lib/vault/suche";
import { IndexKnopf } from "@/komponenten/index-knopf";

export const dynamic = "force-dynamic";

type Treffer = {
  datei_id: string;
  fach_id: string;
  dateiname: string;
  ordner: string;
  seite: number;
  ausschnitt: string;
};

function Markiert({ text }: { text: string }) {
  const teile = text.split(/(<<[^>]*>>)/g);
  return (
    <>
      {teile.map((t, i) =>
        t.startsWith("<<") && t.endsWith(">>") ? (
          <mark key={i} className="rounded bg-accent/20 px-0.5 text-foreground">
            {t.slice(2, -2)}
          </mark>
        ) : (
          <span key={i}>{t}</span>
        )
      )}
    </>
  );
}

function fachName(slug: string): string {
  const f = faecher.find((x) => x.slug === slug);
  return f ? fachAnzeigename(f) : slug;
}

export default async function SuchSeite({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; fach?: string }>;
}) {
  const { q: roh, fach: fachRoh } = await searchParams;
  const q = (roh ?? "").trim().slice(0, 120);
  const fach = faecher.some((f) => f.slug === fachRoh) ? fachRoh : undefined;

  let dokumente: Treffer[] = [];
  let dateinamen: { id: string; fach_id: string; dateiname: string; ordner: string }[] = [];
  let themen: Awaited<ReturnType<typeof sucheThemen>> = [];
  let fehler = "";

  if (q.length >= 2) {
    const supabase = await erstelleServerClient();
    const [volltext, namen] = await Promise.all([
      supabase.rpc("suche_dokumente", { q, p_fach: fach ?? null, max_treffer: 60 }),
      (() => {
        const muster = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
        let abfrage = supabase
          .from("dateien")
          .select("id, fach_id, dateiname, ordner")
          .or(`dateiname.ilike.${muster.replace(/[,()]/g, " ")},ordner.ilike.${muster.replace(/[,()]/g, " ")}`)
          .limit(30);
        if (fach) abfrage = abfrage.eq("fach_id", fach);
        return abfrage;
      })(),
    ]);
    if (volltext.error) fehler = "Die Dokument-Suche ist gerade nicht erreichbar.";
    dokumente = (volltext.data as Treffer[] | null) ?? [];
    dateinamen = namen.data ?? [];
    themen = await sucheThemen(q, fach);
  }

  const nachFach = new Map<string, Treffer[]>();
  for (const t of dokumente) nachFach.set(t.fach_id, [...(nachFach.get(t.fach_id) ?? []), t]);
  const gesamt = dokumente.length + dateinamen.length + themen.length;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="mb-1 text-[24px] font-semibold tracking-tight">Suche</h1>
      <p className="mb-5 text-[14px] text-muted">
        Durchsucht den Text deiner PDFs (seitenweise), Dateinamen sowie Themen und Lernzettel.
      </p>

      <form action="/suche" method="get" className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          type="search"
          defaultValue={q}
          required
          minLength={2}
          maxLength={120}
          autoFocus
          placeholder="Schlagwort oder Thema, z. B. Lac-Operon, Kurvendiskussion, Aggression"
          className="flex-1 rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-accent"
        />
        <select
          name="fach"
          defaultValue={fach ?? ""}
          aria-label="Fach"
          className="rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-[14px] outline-none focus:border-accent"
        >
          <option value="">Alle Fächer</option>
          {faecher.map((f) => (
            <option key={f.slug} value={f.slug}>
              {fachAnzeigename(f)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Suchen
        </button>
      </form>

      <div className="mb-6">
        <IndexKnopf />
      </div>

      {q.length >= 2 && fehler && <p className="mb-4 text-[13px] text-red-500">{fehler}</p>}
      {q.length >= 2 && !fehler && gesamt === 0 && (
        <p className="text-[14px] text-muted">
          Nichts gefunden für „{q}“. Probier ein anderes Wort oder den Wortstamm (z. B. „Mutation“ statt „Mutationen“).
          Handschriftliche Hefte werden nur ungenau erkannt.
        </p>
      )}

      {themen.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-[14px] font-semibold">Themen &amp; Lernzettel ({themen.length})</h2>
          <ul className="space-y-2">
            {themen.map((t) => (
              <li key={`${t.art}-${t.fach}-${t.slug}`}>
                <Link
                  href={`/faecher/${t.fach}/themen/${t.slug}`}
                  className="block rounded-xl border border-border bg-surface/40 px-3.5 py-2.5 transition-colors hover:bg-surface"
                >
                  <span className="text-[14px] font-medium">{t.titel}</span>
                  <span className="ml-2 text-[12px] text-muted">
                    {fachName(t.fach)} · {t.art}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-muted">{t.ausschnitt}…</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {[...nachFach.entries()].map(([fachSlug, liste]) => (
        <section key={fachSlug} className="mb-8">
          <h2 className="mb-2 text-[14px] font-semibold">
            {fachName(fachSlug)} <span className="font-normal text-muted">({liste.length})</span>
          </h2>
          <ul className="space-y-2">
            {liste.map((t) => (
              <li key={`${t.datei_id}-${t.seite}`}>
                <Link
                  href={`/faecher/${t.fach_id}/datei/${t.datei_id}?seite=${t.seite}`}
                  className="block rounded-xl border border-border bg-surface/40 px-3.5 py-2.5 transition-colors hover:bg-surface"
                >
                  <span className="text-[14px] font-medium">{t.dateiname}</span>
                  <span className="ml-2 text-[12px] text-muted">
                    Seite {t.seite} · {t.ordner}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">
                    <Markiert text={t.ausschnitt} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {dateinamen.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-[14px] font-semibold">Dateien mit passendem Namen ({dateinamen.length})</h2>
          <ul className="space-y-2">
            {dateinamen.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/faecher/${d.fach_id}/datei/${d.id}`}
                  className="block rounded-xl border border-border bg-surface/40 px-3.5 py-2.5 transition-colors hover:bg-surface"
                >
                  <span className="text-[14px] font-medium">{d.dateiname}</span>
                  <span className="ml-2 text-[12px] text-muted">
                    {fachName(d.fach_id)} · {d.ordner}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
