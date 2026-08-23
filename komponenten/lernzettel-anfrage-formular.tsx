"use client";

import { useEffect, useMemo, useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";
import { useIstGast } from "@/lib/hooks/use-ist-gast";
import { faecher, fachAnzeigename } from "@/lib/faecher-daten";

type Anfrage = {
  id: string;
  fach_id: string | null;
  thema: string;
  dokumenttyp: string;
  notiz: string | null;
  status: "offen" | "in_bearbeitung" | "fertig";
  erstellt_am: string;
};

const DOKUMENTTYPEN = [
  { wert: "lernzettel", label: "Lernzettel" },
  { wert: "zusammenfassung", label: "Kurze Zusammenfassung" },
  { wert: "uebungsblatt", label: "Übungsaufgaben" },
];

const eingabeKlasse =
  "w-full rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-accent";

const statusLabel: Record<Anfrage["status"], string> = {
  offen: "Offen",
  in_bearbeitung: "Wird bearbeitet",
  fertig: "Fertig",
};

const statusKlasse: Record<Anfrage["status"], string> = {
  offen: "bg-background text-muted",
  in_bearbeitung: "bg-accent/20 text-accent-foreground",
  fertig: "bg-accent text-accent-foreground",
};

export function LernzettelAnfrageFormular() {
  const istGast = useIstGast();
  const supabase = useMemo(() => erstelleBrowserClient(), []);
  const [anfragen, setAnfragen] = useState<Anfrage[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [fachId, setFachId] = useState(faecher[0].slug);
  const [thema, setThema] = useState("");
  const [dokumenttyp, setDokumenttyp] = useState("lernzettel");
  const [notiz, setNotiz] = useState("");
  const [status, setStatus] = useState<"idle" | "sendet" | "fehler">("idle");
  const [fehler, setFehler] = useState("");

  useEffect(() => {
    supabase
      .from("lernzettel_anfragen")
      .select("id, fach_id, thema, dokumenttyp, notiz, status, erstellt_am")
      .order("erstellt_am", { ascending: false })
      .then(({ data }) => {
        setAnfragen(data ?? []);
        setLaedt(false);
      });
  }, [supabase]);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sendet");
    const { data, error } = await supabase
      .from("lernzettel_anfragen")
      .insert({
        fach_id: fachId,
        thema: thema.trim(),
        dokumenttyp,
        notiz: notiz.trim() || null,
      })
      .select("id, fach_id, thema, dokumenttyp, notiz, status, erstellt_am")
      .single();

    if (error || !data) {
      setFehler(error?.message ?? "Unbekannter Fehler");
      setStatus("fehler");
      return;
    }
    setAnfragen((vorherige) => [data, ...vorherige]);
    setThema("");
    setNotiz("");
    setStatus("idle");
  }

  if (istGast) {
    return (
      <p className="text-[13px] text-muted">
        Als Gast kannst du keine Lernzettel-Anfragen erstellen.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={absenden} className="space-y-3 rounded-2xl border border-border bg-surface/40 p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select value={fachId} onChange={(e) => setFachId(e.target.value)} className={eingabeKlasse}>
            {faecher.map((f) => (
              <option key={f.slug} value={f.slug}>
                {fachAnzeigename(f)}
              </option>
            ))}
          </select>
          <select value={dokumenttyp} onChange={(e) => setDokumenttyp(e.target.value)} className={eingabeKlasse}>
            {DOKUMENTTYPEN.map((d) => (
              <option key={d.wert} value={d.wert}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          required
          placeholder="Thema (z.B. Genetik, Analysis: Ableitungsregeln)"
          value={thema}
          onChange={(e) => setThema(e.target.value)}
          className={eingabeKlasse}
        />
        <textarea
          placeholder="Zusätzliche Wünsche (optional) — z.B. worauf besonders eingehen, was du schon weißt"
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          rows={2}
          className={eingabeKlasse}
        />
        <button
          type="submit"
          disabled={status === "sendet"}
          className="rounded-full bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "sendet" ? "Wird gesendet…" : "Anfrage abschicken"}
        </button>
        {status === "fehler" && <p className="text-[13px] text-red-500">{fehler}</p>}
        <p className="text-[12.5px] text-muted">
          Wird automatisch einmal täglich bearbeitet — oder sag Claude im Chat
          Bescheid, dass es sofort nachschauen soll.
        </p>
      </form>

      {laedt ? (
        <p className="text-[13px] text-muted">Lädt…</p>
      ) : anfragen.length === 0 ? (
        <p className="text-[13px] text-muted">Noch keine Anfragen erstellt.</p>
      ) : (
        <ul className="space-y-2">
          {anfragen.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/40 px-3.5 py-2.5"
            >
              <span className="text-[14px] font-medium">{a.thema}</span>
              <span className="text-[12px] text-muted">
                {DOKUMENTTYPEN.find((d) => d.wert === a.dokumenttyp)?.label ?? a.dokumenttyp}
              </span>
              <span className="flex-1" />
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusKlasse[a.status]}`}>
                {statusLabel[a.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
