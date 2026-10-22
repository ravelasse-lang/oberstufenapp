"use client";

import { useEffect, useMemo, useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";
import { useIstGast } from "@/lib/hooks/use-ist-gast";
import { ordneMaterialZu } from "@/lib/material-zuordnung";

type Datei = {
  id: string;
  dateiname: string;
  storage_pfad: string;
  ordner: string;
  halbjahr: number | null;
  hochgeladen_am: string;
};

const STORAGE_BUCKET = "fach-dateien";
const ORDNER_VORSCHLAEGE = ["Lehrplan", "Klausuren", "Notizen", "Aufgaben", "Semesterplan", "Heft"];

const eingabeKlasse =
  "rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-accent";

export function DateiUpload({
  fachId,
  themaSlug,
}: {
  fachId: string;
  themaSlug?: string;
}) {
  const istGast = useIstGast();
  const supabase = useMemo(() => erstelleBrowserClient(), []);
  const [dateien, setDateien] = useState<Datei[]>([]);
  const [ordner, setOrdner] = useState("Lehrplan");
  const [halbjahr, setHalbjahr] = useState("");
  const [datei, setDatei] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "laedt-hoch" | "fehler">("idle");
  const [laedt, setLaedt] = useState(true);
  const [sammel, setSammel] = useState<File[]>([]);
  const [sammelStand, setSammelStand] = useState<{ laeuft: boolean; fertig: number; uebersprungen: number; fehler: string[] }>(
    { laeuft: false, fertig: 0, uebersprungen: 0, fehler: [] }
  );

  useEffect(() => {
    let query = supabase
      .from("dateien")
      .select("id, dateiname, storage_pfad, ordner, halbjahr, hochgeladen_am")
      .eq("fach_id", fachId)
      .order("hochgeladen_am", { ascending: false });

    query = themaSlug ? query.eq("thema_slug", themaSlug) : query.is("thema_slug", null);

    query.then(({ data }) => {
      setDateien(data ?? []);
      setLaedt(false);
    });
  }, [supabase, fachId, themaSlug]);

  async function hochladen(e: React.FormEvent) {
    e.preventDefault();
    if (!datei) return;
    setStatus("laedt-hoch");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("fehler");
      return;
    }

    const eindeutigerName = `${crypto.randomUUID()}-${datei.name}`;
    const pfad = `${user.id}/${fachId}/${themaSlug ?? "allgemein"}/${eindeutigerName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(pfad, datei);

    if (uploadError) {
      setStatus("fehler");
      return;
    }

    const { data, error } = await supabase
      .from("dateien")
      .insert({
        fach_id: fachId,
        thema_slug: themaSlug ?? null,
        dateiname: datei.name,
        storage_pfad: pfad,
        ordner: ordner.trim() || "Allgemein",
        halbjahr: halbjahr ? Number(halbjahr) : null,
      })
      .select("id, dateiname, storage_pfad, ordner, halbjahr, hochgeladen_am")
      .single();

    if (!error && data) {
      setDateien((vorherige) => [data, ...vorherige]);
      setDatei(null);
      setStatus("idle");
    } else {
      setStatus("fehler");
    }
  }

  // Mehrere Dateien auf einmal: Ordner und Halbjahr kommen aus dem Dateinamen
  // (lib/material-zuordnung.ts). Dateien, die es im Fach schon gibt, werden übersprungen.
  async function sammelHochladen() {
    if (sammel.length === 0) return;
    setSammelStand({ laeuft: true, fertig: 0, uebersprungen: 0, fehler: [] });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSammelStand({ laeuft: false, fertig: 0, uebersprungen: 0, fehler: ["Nicht angemeldet."] });
      return;
    }
    const vorhanden = new Set(dateien.map((d) => d.dateiname));
    let fertig = 0;
    let uebersprungen = 0;
    const fehler: string[] = [];
    for (const f of sammel) {
      if (vorhanden.has(f.name)) {
        uebersprungen++;
        continue;
      }
      const zuordnung = ordneMaterialZu(fachId, f.name);
      const pfad = `${user.id}/${fachId}/allgemein/${crypto.randomUUID()}-${f.name}`;
      const { error: uploadFehler } = await supabase.storage.from(STORAGE_BUCKET).upload(pfad, f);
      if (uploadFehler) {
        fehler.push(`${f.name}: ${uploadFehler.message}`);
        continue;
      }
      const { data, error } = await supabase
        .from("dateien")
        .insert({
          fach_id: fachId,
          thema_slug: null,
          dateiname: f.name,
          storage_pfad: pfad,
          ordner: zuordnung.ordner,
          halbjahr: zuordnung.halbjahr,
        })
        .select("id, dateiname, storage_pfad, ordner, halbjahr, hochgeladen_am")
        .single();
      if (error || !data) {
        // Datei im Speicher wieder entfernen, damit keine Waisen bleiben.
        await supabase.storage.from(STORAGE_BUCKET).remove([pfad]);
        fehler.push(`${f.name}: ${error?.message ?? "Eintrag fehlgeschlagen"}`);
        continue;
      }
      vorhanden.add(f.name);
      fertig++;
      setDateien((vorherige) => [data, ...vorherige]);
      setSammelStand({ laeuft: true, fertig, uebersprungen, fehler: [...fehler] });
    }
    setSammel([]);
    setSammelStand({ laeuft: false, fertig, uebersprungen, fehler });
  }

  async function herunterladen(pfad: string) {
    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(pfad, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  const gruppen = dateien.reduce<Record<string, Datei[]>>((acc, d) => {
    (acc[d.ordner] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {!istGast && (
      <form onSubmit={hochladen} className="space-y-3 rounded-2xl border border-border bg-surface/40 p-4">
        <p className="text-[13px] font-medium">Datei hochladen</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            type="file"
            required
            onChange={(e) => setDatei(e.target.files?.[0] ?? null)}
            className={`sm:col-span-2 ${eingabeKlasse} file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-accent-foreground`}
          />
          <select
            value={halbjahr}
            onChange={(e) => setHalbjahr(e.target.value)}
            className={eingabeKlasse}
          >
            <option value="">Kein Halbjahr</option>
            <option value="1">Halbjahr 1</option>
            <option value="2">Halbjahr 2</option>
            <option value="3">Halbjahr 3</option>
            <option value="4">Halbjahr 4</option>
          </select>
          <input
            type="text"
            list="ordner-vorschlaege"
            placeholder="Ordner (z.B. Lehrplan, Nachhilfe, Crashkurs)"
            value={ordner}
            onChange={(e) => setOrdner(e.target.value)}
            className={`sm:col-span-3 ${eingabeKlasse}`}
          />
          <datalist id="ordner-vorschlaege">
            {ORDNER_VORSCHLAEGE.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
        <button
          type="submit"
          disabled={status === "laedt-hoch" || !datei}
          className="rounded-full bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "laedt-hoch" ? "Lädt hoch…" : "Hochladen"}
        </button>
        {status === "fehler" && (
          <p className="text-[13px] text-red-500">
            Hochladen fehlgeschlagen. Ist der Storage-Bucket &quot;fach-dateien&quot;
            angelegt? (siehe dokumentation/setup.md)
          </p>
        )}
      </form>
      )}

      {!istGast && !themaSlug && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface/40 p-4">
          <p className="text-[13px] font-medium">Mehrere Dateien auf einmal (automatisch nach Thema sortiert)</p>
          <input
            type="file"
            multiple
            onChange={(e) => setSammel(Array.from(e.target.files ?? []))}
            className={`w-full ${eingabeKlasse} file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-accent-foreground`}
          />
          {sammel.length > 0 && (
            <ul className="max-h-60 space-y-1 overflow-y-auto text-[12.5px]">
              {sammel.map((f) => (
                <li key={f.name} className="flex justify-between gap-3">
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-muted">→ {ordneMaterialZu(fachId, f.name).ordner}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={sammelHochladen}
            disabled={sammel.length === 0 || sammelStand.laeuft}
            className="rounded-full bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {sammelStand.laeuft ? `Lädt hoch… (${sammelStand.fertig}/${sammel.length})` : `${sammel.length || ""} Dateien hochladen`.trim()}
          </button>
          {(sammelStand.fertig > 0 || sammelStand.uebersprungen > 0 || sammelStand.fehler.length > 0) && !sammelStand.laeuft && (
            <div className="space-y-1 text-[13px]">
              <p>
                {sammelStand.fertig} hochgeladen
                {sammelStand.uebersprungen > 0 ? `, ${sammelStand.uebersprungen} übersprungen (gab es schon)` : ""}.
              </p>
              {sammelStand.fehler.map((f) => (
                <p key={f} className="text-red-500">{f}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {laedt ? (
        <p className="text-[13px] text-muted">Lädt…</p>
      ) : dateien.length === 0 ? (
        <p className="text-[13px] text-muted">Noch keine Dateien hochgeladen.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(gruppen)
            .sort(([a], [b]) => a.localeCompare(b, "de", { numeric: true }))
            .map(([ordnerName, dateienImOrdner]) => (
            <div key={ordnerName}>
              <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted">
                {ordnerName}
              </p>
              <ul className="space-y-2">
                {dateienImOrdner.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface/40 px-3.5 py-2.5"
                  >
                    <span className="truncate text-[14px]">
                      {d.dateiname}
                      {d.halbjahr && (
                        <span className="ml-2 text-[11px] text-muted">HJ {d.halbjahr}</span>
                      )}
                    </span>
                    <button
                      onClick={() => herunterladen(d.storage_pfad)}
                      className="shrink-0 text-[13px] font-medium text-accent hover:opacity-80"
                    >
                      Öffnen
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
