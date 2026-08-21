"use client";

import { useEffect, useMemo, useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";
import { fachAnzeigename, faecher } from "@/lib/faecher-daten";

type Todo = {
  id: string;
  fach_id: string | null;
  text: string;
  erledigt: boolean;
  kategorie: string | null;
  faellig_am: string | null;
  angepinnt: boolean;
  erstellt_am: string;
};

function nichtKonfiguriertHinweis() {
  return (
    <p className="rounded-2xl border border-dashed border-amber-400/60 bg-amber-50 p-4 text-[13px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
      Supabase ist noch nicht verbunden. Trage <code>NEXT_PUBLIC_SUPABASE_URL</code>{" "}
      und <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>{" "}
      ein (siehe dokumentation/setup.md) und starte den Server neu.
    </p>
  );
}

const SPALTEN = "id, fach_id, text, erledigt, kategorie, faellig_am, angepinnt, erstellt_am";
const KATEGORIE_VORSCHLAEGE = ["Privat", "Schule", "Sonstiges"];

const eingabeKlasse =
  "rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-accent";

function formatDatum(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function formatFaellig(iso: string) {
  const d = new Date(iso);
  const hatUhrzeit = d.getHours() !== 0 || d.getMinutes() !== 0;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) +
    (hatUhrzeit
      ? " · " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
      : "");
}

function TodoZeile({
  todo,
  onAbhaken,
  onAnpinnen,
  onLoeschen,
}: {
  todo: Todo;
  onAbhaken: (todo: Todo) => void;
  onAnpinnen: (todo: Todo) => void;
  onLoeschen: (todo: Todo) => void;
}) {
  const [jetzt] = useState(() => Date.now());
  const fach = faecher.find((f) => f.slug === todo.fach_id);
  const ueberfaellig =
    !todo.erledigt && todo.faellig_am && new Date(todo.faellig_am).getTime() < jetzt;

  return (
    <li
      title={`Hinzugefügt am ${formatDatum(todo.erstellt_am)}`}
      className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-surface/40 px-3.5 py-2.5"
    >
      <input
        type="checkbox"
        checked={todo.erledigt}
        onChange={() => onAbhaken(todo)}
        className="h-4 w-4 accent-accent"
      />
      <span
        className={`flex-1 text-[14px] ${
          todo.erledigt ? "text-muted line-through" : "text-foreground"
        }`}
      >
        {todo.text}
      </span>
      {todo.kategorie && (
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
          {todo.kategorie}
        </span>
      )}
      {todo.faellig_am && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            ueberfaellig
              ? "bg-red-500/15 text-red-600 dark:text-red-400"
              : "bg-background text-muted"
          }`}
        >
          bis {formatFaellig(todo.faellig_am)}
        </span>
      )}
      {fach && (
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
          style={{ backgroundColor: fach.akzentfarbe }}
        >
          {fachAnzeigename(fach)}
        </span>
      )}
      <button
        type="button"
        onClick={() => onAnpinnen(todo)}
        aria-label="Anpinnen"
        className={`text-[13px] ${todo.angepinnt ? "opacity-100" : "opacity-30 hover:opacity-70"}`}
      >
        📌
      </button>
      <button
        type="button"
        onClick={() => onLoeschen(todo)}
        aria-label="Löschen"
        className="text-[13px] opacity-30 hover:opacity-70"
      >
        🗑
      </button>
    </li>
  );
}

function sortiereTodos(todos: Todo[]) {
  return [...todos].sort((a, b) => {
    if (a.angepinnt !== b.angepinnt) return a.angepinnt ? -1 : 1;
    if (a.faellig_am && b.faellig_am) {
      return new Date(a.faellig_am).getTime() - new Date(b.faellig_am).getTime();
    }
    if (a.faellig_am) return -1;
    if (b.faellig_am) return 1;
    return new Date(b.erstellt_am).getTime() - new Date(a.erstellt_am).getTime();
  });
}

export function TodoListe() {
  const konfiguriert = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const supabase = useMemo(
    () => (konfiguriert ? erstelleBrowserClient() : null),
    [konfiguriert]
  );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [neuerText, setNeuerText] = useState("");
  const [neuesFach, setNeuesFach] = useState("");
  const [neueKategorie, setNeueKategorie] = useState("");
  const [neueFaelligkeit, setNeueFaelligkeit] = useState("");
  const [detailsOffen, setDetailsOffen] = useState(false);
  const [filterFach, setFilterFach] = useState("alle");
  const [erledigteOffen, setErledigteOffen] = useState(false);
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("todos")
      .select(SPALTEN)
      .order("erstellt_am", { ascending: false })
      .then(({ data }) => {
        setTodos(data ?? []);
        setLaedt(false);
      });
  }, [supabase]);

  if (!supabase) return nichtKonfiguriertHinweis();
  const client = supabase;

  async function todoHinzufuegen(e: React.FormEvent) {
    e.preventDefault();
    if (!neuerText.trim()) return;

    const { data, error } = await client
      .from("todos")
      .insert({
        text: neuerText.trim(),
        fach_id: neuesFach || null,
        kategorie: neueKategorie.trim() || null,
        faellig_am: neueFaelligkeit ? new Date(neueFaelligkeit).toISOString() : null,
      })
      .select(SPALTEN)
      .single();

    if (error) {
      setFehler(error.message);
      return;
    }
    setFehler("");
    if (data) {
      setTodos((vorherige) => [data, ...vorherige]);
      setNeuerText("");
      setNeuesFach("");
      setNeueKategorie("");
      setNeueFaelligkeit("");
    }
  }

  async function abhaken(todo: Todo) {
    const neuerStatus = !todo.erledigt;
    setTodos((vorherige) =>
      vorherige.map((t) => (t.id === todo.id ? { ...t, erledigt: neuerStatus } : t))
    );
    const { error } = await client
      .from("todos")
      .update({
        erledigt: neuerStatus,
        erledigt_am: neuerStatus ? new Date().toISOString() : null,
      })
      .eq("id", todo.id);
    if (error) setFehler(error.message);
  }

  async function anpinnen(todo: Todo) {
    const neuerStatus = !todo.angepinnt;
    setTodos((vorherige) =>
      vorherige.map((t) => (t.id === todo.id ? { ...t, angepinnt: neuerStatus } : t))
    );
    const { error } = await client
      .from("todos")
      .update({ angepinnt: neuerStatus })
      .eq("id", todo.id);
    if (error) setFehler(error.message);
  }

  async function loeschen(todo: Todo) {
    setTodos((vorherige) => vorherige.filter((t) => t.id !== todo.id));
    const { error } = await client.from("todos").delete().eq("id", todo.id);
    if (error) setFehler(error.message);
  }

  const gefiltert =
    filterFach === "alle" ? todos : todos.filter((t) => t.fach_id === filterFach);
  const offene = sortiereTodos(gefiltert.filter((t) => !t.erledigt));
  const erledigte = sortiereTodos(gefiltert.filter((t) => t.erledigt));

  return (
    <div className="space-y-7">
      <form onSubmit={todoHinzufuegen} className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Neue Aufgabe…"
            value={neuerText}
            onChange={(e) => setNeuerText(e.target.value)}
            className={`flex-1 ${eingabeKlasse}`}
          />
          <select
            value={neuesFach}
            onChange={(e) => setNeuesFach(e.target.value)}
            className={eingabeKlasse}
          >
            <option value="">Kein Fach</option>
            {faecher.map((f) => (
              <option key={f.slug} value={f.slug}>
                {fachAnzeigename(f)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Hinzufügen
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDetailsOffen((v) => !v)}
          className="text-[12px] text-muted hover:text-foreground"
        >
          {detailsOffen ? "− weniger" : "+ Kategorie / Fälligkeit"}
        </button>

        {detailsOffen && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              list="kategorie-vorschlaege"
              placeholder="Kategorie (z.B. Privat)"
              value={neueKategorie}
              onChange={(e) => setNeueKategorie(e.target.value)}
              className={`flex-1 ${eingabeKlasse}`}
            />
            <datalist id="kategorie-vorschlaege">
              {KATEGORIE_VORSCHLAEGE.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
            <input
              type="datetime-local"
              value={neueFaelligkeit}
              onChange={(e) => setNeueFaelligkeit(e.target.value)}
              className={eingabeKlasse}
            />
          </div>
        )}
        {fehler && <p className="text-[13px] text-red-500">{fehler}</p>}
      </form>

      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-muted">Filter:</span>
        <select
          value={filterFach}
          onChange={(e) => setFilterFach(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-2 py-1 text-[13px] outline-none"
        >
          <option value="alle">Alle Fächer</option>
          {faecher.map((f) => (
            <option key={f.slug} value={f.slug}>
              {fachAnzeigename(f)}
            </option>
          ))}
        </select>
      </div>

      {laedt ? (
        <p className="text-[13px] text-muted">Lädt…</p>
      ) : (
        <div className="space-y-4">
          {offene.length === 0 ? (
            <p className="text-[13px] text-muted">Keine offenen Aufgaben.</p>
          ) : (
            <ul className="space-y-2">
              {offene.map((todo) => (
                <TodoZeile
                  key={todo.id}
                  todo={todo}
                  onAbhaken={abhaken}
                  onAnpinnen={anpinnen}
                  onLoeschen={loeschen}
                />
              ))}
            </ul>
          )}

          {erledigte.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setErledigteOffen((v) => !v)}
                className="mb-2 text-[12px] text-muted hover:text-foreground"
              >
                {erledigteOffen ? "▾" : "▸"} Erledigt ({erledigte.length})
              </button>
              {erledigteOffen && (
                <ul className="space-y-2">
                  {erledigte.map((todo) => (
                    <TodoZeile
                      key={todo.id}
                      todo={todo}
                      onAbhaken={abhaken}
                      onAnpinnen={anpinnen}
                      onLoeschen={loeschen}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
