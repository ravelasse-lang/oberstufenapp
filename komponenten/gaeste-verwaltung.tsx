"use client";

import { useEffect, useMemo, useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";

type Gastcode = {
  id: string;
  code: string;
  bezeichnung: string | null;
  aktiv: boolean;
  erstellt_am: string;
};

const ZEICHEN = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // ohne verwechselbare Zeichen (0/O, 1/I/l)

function zufallsCode(laenge = 8) {
  let code = "";
  for (let i = 0; i < laenge; i++) {
    code += ZEICHEN[Math.floor(Math.random() * ZEICHEN.length)];
  }
  return code;
}

const eingabeKlasse =
  "rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-accent";

export function GaesteVerwaltung() {
  const supabase = useMemo(() => erstelleBrowserClient(), []);
  const [codes, setCodes] = useState<Gastcode[]>([]);
  const [bezeichnung, setBezeichnung] = useState("");
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState("");

  useEffect(() => {
    supabase
      .from("gastcodes")
      .select("id, code, bezeichnung, aktiv, erstellt_am")
      .order("erstellt_am", { ascending: false })
      .then(({ data }) => {
        setCodes(data ?? []);
        setLaedt(false);
      });
  }, [supabase]);

  async function codeErstellen(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase
      .from("gastcodes")
      .insert({ code: zufallsCode(), bezeichnung: bezeichnung.trim() || null })
      .select("id, code, bezeichnung, aktiv, erstellt_am")
      .single();

    if (error) {
      setFehler(error.message);
      return;
    }
    setFehler("");
    setCodes((vorherige) => [data, ...vorherige]);
    setBezeichnung("");
  }

  async function aktivUmschalten(c: Gastcode) {
    const neuerStatus = !c.aktiv;
    setCodes((vorherige) =>
      vorherige.map((x) => (x.id === c.id ? { ...x, aktiv: neuerStatus } : x))
    );
    await supabase.from("gastcodes").update({ aktiv: neuerStatus }).eq("id", c.id);
  }

  async function codeLoeschen(c: Gastcode) {
    setCodes((vorherige) => vorherige.filter((x) => x.id !== c.id));
    await supabase.from("gastcodes").delete().eq("id", c.id);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={codeErstellen} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Bezeichnung (optional, z.B. Oma)"
          value={bezeichnung}
          onChange={(e) => setBezeichnung(e.target.value)}
          className={`flex-1 ${eingabeKlasse}`}
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Neuen Code erzeugen
        </button>
      </form>
      {fehler && <p className="text-[13px] text-red-500">{fehler}</p>}

      {laedt ? (
        <p className="text-[13px] text-muted">Lädt…</p>
      ) : codes.length === 0 ? (
        <p className="text-[13px] text-muted">Noch keine Gäste-Codes erstellt.</p>
      ) : (
        <ul className="space-y-2">
          {codes.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/40 px-3.5 py-2.5"
            >
              <span className="rounded-lg bg-background px-2.5 py-1 font-mono text-[15px] tracking-widest">
                {c.code}
              </span>
              {c.bezeichnung && (
                <span className="text-[13px] text-muted">{c.bezeichnung}</span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  c.aktiv
                    ? "bg-accent text-accent-foreground"
                    : "bg-background text-muted"
                }`}
              >
                {c.aktiv ? "Aktiv" : "Deaktiviert"}
              </span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => aktivUmschalten(c)}
                className="rounded-full border border-border px-3 py-1 text-[12px] font-medium transition-colors hover:bg-surface"
              >
                {c.aktiv ? "Rauswerfen" : "Wieder aktivieren"}
              </button>
              <button
                type="button"
                onClick={() => codeLoeschen(c)}
                aria-label="Löschen"
                className="text-[13px] opacity-40 hover:opacity-80"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
