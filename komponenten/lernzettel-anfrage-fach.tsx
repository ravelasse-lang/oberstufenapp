"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { erstelleBrowserClient } from "@/lib/supabase/client";
import { useIstGast } from "@/lib/hooks/use-ist-gast";

type ThemaAuswahl = { slug: string; titel: string; halbjahr: number | null };
type DateiEintrag = { id: string; dateiname: string; ordner: string; halbjahr: number | null };
type Anfrage = {
  id: string;
  thema: string;
  dokumenttyp: string;
  ausgabeformat: string;
  status: "offen" | "in_bearbeitung" | "fertig";
  erstellt_am: string;
};

const DOKUMENTTYPEN = [
  { wert: "lernzettel", label: "Lernzettel (ausführlich, mit Glossar)" },
  { wert: "zusammenfassung", label: "Kurze Zusammenfassung" },
  { wert: "uebungsblatt", label: "Übungsaufgaben" },
];

const FORMATE = [
  { wert: "pdf", label: "PDF", hinweis: "schön gestaltet, zum Lernen und Drucken" },
  { wert: "html", label: "HTML", hinweis: "Seite zum Öffnen im Browser, ohne weiteres Programm" },
  { wert: "obsidian", label: "Obsidian-Datei", hinweis: "Markdown (.md) mit Glossar-Links, nur wenn du Obsidian nutzt" },
  { wert: "beides", label: "Alles", hinweis: "PDF, HTML und Obsidian-Datei" },
];

const statusLabel = { offen: "Offen", in_bearbeitung: "Wird bearbeitet", fertig: "Fertig" } as const;

const eingabeKlasse =
  "w-full rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-accent";

export function LernzettelAnfrageFach({
  fachId,
  themen,
}: {
  fachId: string;
  themen: ThemaAuswahl[];
}) {
  const istGast = useIstGast();
  const supabase = useMemo(() => erstelleBrowserClient(), []);
  const [gewaehlt, setGewaehlt] = useState<string[]>([]);
  const [freitext, setFreitext] = useState("");
  const [dateiId, setDateiId] = useState("");
  const [dateien, setDateien] = useState<DateiEintrag[]>([]);
  const [dokumenttyp, setDokumenttyp] = useState("lernzettel");
  const [format, setFormat] = useState("pdf");
  const [notiz, setNotiz] = useState("");
  const [anfragen, setAnfragen] = useState<Anfrage[]>([]);
  const [status, setStatus] = useState<"idle" | "sendet" | "gesendet" | "fehler">("idle");
  const [fehler, setFehler] = useState("");

  async function dateienLaden() {
    const { data } = await supabase
      .from("dateien")
      .select("id, dateiname, ordner, halbjahr")
      .eq("fach_id", fachId)
      .order("hochgeladen_am", { ascending: false });
    setDateien(data ?? []);
  }

  useEffect(() => {
    let abgebrochen = false;
    supabase
      .from("dateien")
      .select("id, dateiname, ordner, halbjahr")
      .eq("fach_id", fachId)
      .order("hochgeladen_am", { ascending: false })
      .then(({ data }) => {
        if (!abgebrochen) setDateien(data ?? []);
      });
    supabase
      .from("lernzettel_anfragen")
      .select("id, thema, dokumenttyp, ausgabeformat, status, erstellt_am")
      .eq("fach_id", fachId)
      .order("erstellt_am", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!abgebrochen) setAnfragen((data as Anfrage[] | null) ?? []);
      });
    return () => {
      abgebrochen = true;
    };
  }, [supabase, fachId]);

  function umschalten(titel: string) {
    setGewaehlt((alt) => (alt.includes(titel) ? alt.filter((t) => t !== titel) : [...alt, titel]));
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    const eigene = freitext
      .split(/[\n,;]/)
      .map((t) => t.trim().slice(0, 200))
      .filter(Boolean);
    const alleThemen = [...gewaehlt, ...eigene].slice(0, 40);
    const datei = dateien.find((d) => d.id === dateiId);

    if (alleThemen.length === 0 && !datei) {
      setFehler("Wähle mindestens ein Thema, schreib eins auf oder wähle eine Themenübersicht.");
      setStatus("fehler");
      return;
    }

    const kurz = alleThemen.length > 0 ? alleThemen.join(", ") : `Themenübersicht: ${datei?.dateiname}`;
    const thema = kurz.length > 200 ? `${kurz.slice(0, 197)}…` : kurz;

    setStatus("sendet");
    const { data, error } = await supabase
      .from("lernzettel_anfragen")
      .insert({
        fach_id: fachId,
        thema,
        themen: alleThemen,
        datei_id: datei?.id ?? null,
        dokumenttyp,
        ausgabeformat: format,
        notiz: notiz.trim() || null,
      })
      .select("id, thema, dokumenttyp, ausgabeformat, status, erstellt_am")
      .single();

    if (error || !data) {
      setFehler(error?.message ?? "Unbekannter Fehler");
      setStatus("fehler");
      return;
    }
    setAnfragen((alt) => [data as Anfrage, ...alt]);
    setGewaehlt([]);
    setFreitext("");
    setDateiId("");
    setNotiz("");
    setFehler("");
    setStatus("gesendet");
  }

  if (istGast) {
    return (
      <p className="text-[13px] text-muted">
        Als Gast kannst du keine Lernzettel-Anfragen erstellen.
      </p>
    );
  }

  const gruppen = [...new Set(themen.map((t) => t.halbjahr))].sort((a, b) => (a ?? 99) - (b ?? 99));

  return (
    <div className="space-y-8">
      <form onSubmit={absenden} className="space-y-6 rounded-3xl border border-border bg-surface/40 p-5">
        <fieldset className="space-y-3">
          <legend className="text-[14px] font-semibold">1. Themen</legend>
          {themen.length === 0 ? (
            <p className="text-[13px] text-muted">Für dieses Fach gibt es noch keine Themen im Vault. Schreib sie unten auf.</p>
          ) : (
            gruppen.map((hj) => (
              <div key={hj ?? "ohne"} className="space-y-1.5">
                <p className="text-[12px] font-medium uppercase tracking-wide text-muted">
                  {hj ? `Halbjahr ${hj}` : "Ohne Halbjahr"}
                </p>
                {themen
                  .filter((t) => t.halbjahr === hj)
                  .map((t) => (
                    <label key={t.slug} className="flex cursor-pointer items-center gap-2.5 text-[14px]">
                      <input
                        type="checkbox"
                        checked={gewaehlt.includes(t.titel)}
                        onChange={() => umschalten(t.titel)}
                        className="size-4 accent-[var(--accent)]"
                      />
                      {t.titel}
                    </label>
                  ))}
              </div>
            ))
          )}
          <textarea
            value={freitext}
            onChange={(e) => setFreitext(e.target.value)}
            rows={2}
            maxLength={1000}
            aria-label="Weitere Themen"
            placeholder="Weitere Themen (optional, durch Komma oder Zeilenumbruch getrennt)"
            className={eingabeKlasse}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-[14px] font-semibold">2. Themenübersicht (optional)</legend>
          <select
            value={dateiId}
            onChange={(e) => setDateiId(e.target.value)}
            aria-label="Themenübersicht"
            className={eingabeKlasse}
          >
            <option value="">– keine –</option>
            {dateien.map((d) => (
              <option key={d.id} value={d.id}>
                {d.dateiname} ({d.ordner}
                {d.halbjahr ? `, HJ ${d.halbjahr}` : ""})
              </option>
            ))}
          </select>
          <p className="text-[12.5px] text-muted">
            Noch nichts da?{" "}
            <Link
              href={`/faecher/${fachId}/hochladen`}
              target="_blank"
              className="text-accent underline underline-offset-2"
            >
              Datei hochladen
            </Link>{" "}
            (neuer Tab), danach{" "}
            <button type="button" onClick={dateienLaden} className="text-accent underline underline-offset-2">
              Liste aktualisieren
            </button>
            .
          </p>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-[14px] font-semibold">3. Art und Format</legend>
          <select
            value={dokumenttyp}
            onChange={(e) => setDokumenttyp(e.target.value)}
            aria-label="Art des Dokuments"
            className={eingabeKlasse}
          >
            {DOKUMENTTYPEN.map((d) => (
              <option key={d.wert} value={d.wert}>
                {d.label}
              </option>
            ))}
          </select>
          <div className="space-y-1.5 pt-1">
            {FORMATE.map((f) => (
              <label key={f.wert} className="flex cursor-pointer items-start gap-2.5 text-[14px]">
                <input
                  type="radio"
                  name="ausgabeformat"
                  value={f.wert}
                  checked={format === f.wert}
                  onChange={() => setFormat(f.wert)}
                  className="mt-1 size-4 accent-[var(--accent)]"
                />
                <span>
                  {f.label}
                  <span className="block text-[12.5px] text-muted">{f.hinweis}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-[14px] font-semibold">4. Wünsche (optional)</legend>
          <textarea
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            rows={2}
            maxLength={2000}
            aria-label="Zusätzliche Wünsche"
            placeholder="z.B. worauf besonders eingehen, was du schon kannst, wann die Klausur ist"
            className={eingabeKlasse}
          />
        </fieldset>

        <button
          type="submit"
          disabled={status === "sendet"}
          className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "sendet" ? "Wird gesendet…" : "Anfrage abschicken"}
        </button>
        {status === "fehler" && <p className="text-[13px] text-red-500">{fehler}</p>}
        {status === "gesendet" && (
          <p className="text-[13px] text-foreground">
            Gespeichert. Sag Claude im Chat Bescheid (z.B. „schau nach offenen
            Lernzettel-Anfragen“), dann wird der Lernzettel erstellt.
          </p>
        )}
      </form>

      {anfragen.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[14px] font-semibold">Bisherige Anfragen in diesem Fach</h2>
          <ul className="space-y-2">
            {anfragen.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/40 px-3.5 py-2.5"
              >
                <span className="text-[14px] font-medium">{a.thema}</span>
                <span className="text-[12px] text-muted">
                  {FORMATE.find((f) => f.wert === a.ausgabeformat)?.label ?? a.ausgabeformat}
                </span>
                <span className="flex-1" />
                <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
                  {statusLabel[a.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
