"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { erstelleBrowserClient } from "@/lib/supabase/client";
import { useIstGast } from "@/lib/hooks/use-ist-gast";
import { ordneMaterialZu } from "@/lib/material-zuordnung";
import { sichererSpeicherName } from "@/lib/speicher-pfad";
import { indexiereAlleOffenen, indexiereDatei } from "@/lib/dokument-index";

type Datei = {
  id: string;
  dateiname: string;
  storage_pfad: string;
  ordner: string;
  halbjahr: number | null;
  hochgeladen_am: string;
  indexiert_am: string | null;
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
  const [indexStand, setIndexStand] = useState<{ laeuft: boolean; fertig: number; gesamt: number; fehler: string[] }>(
    { laeuft: false, fertig: 0, gesamt: 0, fehler: [] }
  );
  const [sammelStand, setSammelStand] = useState<{ laeuft: boolean; fertig: number; aktualisiert: number; uebersprungen: number; fehler: string[] }>(
    { laeuft: false, fertig: 0, aktualisiert: 0, uebersprungen: 0, fehler: [] }
  );

  useEffect(() => {
    let query = supabase
      .from("dateien")
      .select("id, dateiname, storage_pfad, ordner, halbjahr, hochgeladen_am, indexiert_am")
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

    const eindeutigerName = `${crypto.randomUUID()}-${sichererSpeicherName(datei.name)}`;
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
      .select("id, dateiname, storage_pfad, ordner, halbjahr, hochgeladen_am, indexiert_am")
      .single();

    if (!error && data) {
      setDateien((vorherige) => [data, ...vorherige]);
      if (/\.pdf$/i.test(datei.name)) {
        try {
          await indexiereDatei(supabase, user.id, data.id, await datei.arrayBuffer());
          setDateien((vorherige) =>
            vorherige.map((d) => (d.id === data.id ? { ...d, indexiert_am: new Date().toISOString() } : d))
          );
        } catch {
          // später über "Durchsuchbar machen" nachholen
        }
      }
      setDatei(null);
      setStatus("idle");
    } else {
      setStatus("fehler");
    }
  }

  // Mehrere Dateien auf einmal: Ordner und Halbjahr kommen aus Dateiname bzw. Ordnerstruktur
  // (lib/material-zuordnung.ts). Gibt es den Dateinamen im Fach schon, wird die Datei nur
  // ERSETZT, wenn sie neuer ist als der Upload (z. B. aktualisiertes GoodNotes-Backup); sonst
  // wird sie übersprungen. Erst wird die neue Fassung gespeichert, dann die alte entfernt.
  async function sammelHochladen() {
    if (sammel.length === 0) return;
    const leer = { laeuft: false, fertig: 0, aktualisiert: 0, uebersprungen: 0, fehler: [] as string[] };
    setSammelStand({ ...leer, laeuft: true });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSammelStand({ ...leer, fehler: ["Nicht angemeldet."] });
      return;
    }
    const vorhandene = new Map(dateien.map((d) => [d.dateiname, d]));
    let fertig = 0;
    let aktualisiert = 0;
    let uebersprungen = 0;
    const fehler: string[] = [];
    for (const f of sammel) {
      const alt = vorhandene.get(f.name);
      if (alt && f.lastModified <= new Date(alt.hochgeladen_am).getTime()) {
        uebersprungen++;
        continue;
      }
      const zuordnung = ordneMaterialZu(fachId, f.name, f.webkitRelativePath || undefined);
      const pfad = `${user.id}/${fachId}/allgemein/${crypto.randomUUID()}-${sichererSpeicherName(f.name)}`;
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
        .select("id, dateiname, storage_pfad, ordner, halbjahr, hochgeladen_am, indexiert_am")
        .single();
      if (error || !data) {
        // Datei im Speicher wieder entfernen, damit keine Waisen bleiben.
        await supabase.storage.from(STORAGE_BUCKET).remove([pfad]);
        fehler.push(`${f.name}: ${error?.message ?? "Eintrag fehlgeschlagen"}`);
        continue;
      }
      if (alt) {
        // Neue Fassung ist sicher gespeichert: alte Zeile und alte Datei entfernen.
        await supabase.from("dateien").delete().eq("id", alt.id);
        await supabase.storage.from(STORAGE_BUCKET).remove([alt.storage_pfad]);
        aktualisiert++;
        setDateien((vorherige) => [data, ...vorherige.filter((d) => d.id !== alt.id)]);
      } else {
        fertig++;
        setDateien((vorherige) => [data, ...vorherige]);
      }
      vorhandene.set(f.name, data);
      if (/\.pdf$/i.test(f.name)) {
        try {
          await indexiereDatei(supabase, user.id, data.id, await f.arrayBuffer());
          setDateien((vorherige) =>
            vorherige.map((d) => (d.id === data.id ? { ...d, indexiert_am: new Date().toISOString() } : d))
          );
        } catch {
          // Suche für diese Datei später über "Durchsuchbar machen" nachholen.
        }
      }
      setSammelStand({ laeuft: true, fertig, aktualisiert, uebersprungen, fehler: [...fehler] });
    }
    setSammel([]);
    setSammelStand({ laeuft: false, fertig, aktualisiert, uebersprungen, fehler });
  }

  // Liest den Text aller PDFs dieses Fachs, die noch nicht durchsuchbar sind (z. B. früher hochgeladene).
  async function offeneIndexieren() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setIndexStand({ laeuft: true, fertig: 0, gesamt: 0, fehler: [] });
    const ergebnis = await indexiereAlleOffenen(
      supabase,
      user.id,
      (stand) => setIndexStand({ laeuft: true, ...stand }),
      fachId
    );
    setIndexStand({ laeuft: false, ...ergebnis });
    const { data } = await supabase
      .from("dateien")
      .select("id, dateiname, storage_pfad, ordner, halbjahr, hochgeladen_am, indexiert_am")
      .eq("fach_id", fachId)
      .order("hochgeladen_am", { ascending: false });
    if (data) setDateien(themaSlug ? data.filter((d) => dateien.some((x) => x.id === d.id)) : data);
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
          <label className="block text-[12.5px] text-muted">
            Oder einen ganzen Ordner wählen (die Unterordner werden als Ordner übernommen):
            <input
              type="file"
              multiple
              // @ts-expect-error webkitdirectory ist nicht in den React-Typen, wird aber von allen Browsern unterstützt
              webkitdirectory=""
              onChange={(e) => setSammel(Array.from(e.target.files ?? []))}
              className={`mt-1 w-full ${eingabeKlasse} file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-accent-foreground`}
            />
          </label>
          {sammel.length > 0 && (
            <ul className="max-h-60 space-y-1 overflow-y-auto text-[12.5px]">
              {sammel.map((f) => (
                <li key={f.webkitRelativePath || f.name} className="flex justify-between gap-3">
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-muted">→ {ordneMaterialZu(fachId, f.name, f.webkitRelativePath || undefined).ordner}</span>
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
            {sammelStand.laeuft ? `Lädt hoch… (${sammelStand.fertig + sammelStand.aktualisiert}/${sammel.length})` : `${sammel.length || ""} Dateien hochladen`.trim()}
          </button>
          {(sammelStand.fertig > 0 || sammelStand.aktualisiert > 0 || sammelStand.uebersprungen > 0 || sammelStand.fehler.length > 0) && !sammelStand.laeuft && (
            <div className="space-y-1 text-[13px]">
              <p>
                {sammelStand.fertig} hochgeladen
                {sammelStand.aktualisiert > 0 ? `, ${sammelStand.aktualisiert} aktualisiert` : ""}
                {sammelStand.uebersprungen > 0 ? `, ${sammelStand.uebersprungen} übersprungen (unverändert)` : ""}.
              </p>
              {sammelStand.fehler.map((f) => (
                <p key={f} className="text-red-500">{f}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {!istGast && dateien.some((d) => !d.indexiert_am && /\.pdf$/i.test(d.dateiname)) && (
        <div className="space-y-2 rounded-2xl border border-border bg-surface/40 p-4">
          <p className="text-[13px] font-medium">
            {dateien.filter((d) => !d.indexiert_am && /\.pdf$/i.test(d.dateiname)).length} PDFs sind noch nicht durchsuchbar
          </p>
          <button
            type="button"
            onClick={offeneIndexieren}
            disabled={indexStand.laeuft}
            className="rounded-full bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {indexStand.laeuft ? `Liest Text… (${indexStand.fertig}/${indexStand.gesamt})` : "Durchsuchbar machen"}
          </button>
          {indexStand.fehler.map((f) => (
            <p key={f} className="text-[13px] text-red-500">{f}</p>
          ))}
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
                    {/\.(pdf|png|jpe?g|gif|webp)$/i.test(d.dateiname) ? (
                      <Link
                        href={`/faecher/${fachId}/datei/${d.id}`}
                        className="shrink-0 text-[13px] font-medium text-accent hover:opacity-80"
                      >
                        Ansehen
                      </Link>
                    ) : (
                      <button
                        onClick={() => herunterladen(d.storage_pfad)}
                        className="shrink-0 text-[13px] font-medium text-accent hover:opacity-80"
                      >
                        Öffnen
                      </button>
                    )}
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
