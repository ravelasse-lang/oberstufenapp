-- Volltext-Suche über alle Dokumente (PDF-Texte, seitenweise).
--
-- Der Text wird beim Hochladen im Browser aus dem PDF gelesen (Texterkennung von GoodNotes
-- inklusive) und hier abgelegt. Gesucht wird mit Postgres-Volltextsuche (deutsch).
--   dokument_seiten : eine Zeile pro Seite und Datei (Text + berechneter Suchindex)
--   dateien.indexiert_am : wann der Text einer Datei gelesen wurde (leer = noch nicht)
--   suche_dokumente(q, fach) : Treffer mit Ausschnitt; läuft mit den Rechten des Aufrufers (RLS)
--
-- Rechte: Besitzer lesen/schreiben eigene Zeilen; Gäste (anonym) nur LESEN, wie bei dateien
-- (Policy wie gast_liest_*, plus restriktive Schreibsperre wie in 0014).
-- Sicher mehrfach ausführbar.

alter table dateien add column if not exists indexiert_am timestamptz;

create table if not exists dokument_seiten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  datei_id uuid not null references dateien(id) on delete cascade,
  seite integer not null check (seite >= 1),
  inhalt text not null check (char_length(inhalt) <= 30000),
  tsv tsvector generated always as (to_tsvector('german', inhalt)) stored,
  unique (datei_id, seite)
);

create index if not exists dokument_seiten_tsv_idx on dokument_seiten using gin (tsv);
create index if not exists dokument_seiten_datei_idx on dokument_seiten (datei_id);

alter table dokument_seiten enable row level security;

drop policy if exists "eigene_dokument_seiten" on dokument_seiten;
create policy "eigene_dokument_seiten" on dokument_seiten
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gast_liest_dokument_seiten" on dokument_seiten;
create policy "gast_liest_dokument_seiten" on dokument_seiten
  for select using (
    exists (
      select 1 from gast_sitzungen gs join gastcodes gc on gc.id = gs.gastcode_id
      where gs.anon_user_id = auth.uid()
        and gc.aktiv = true
        and gc.user_id = dokument_seiten.user_id
    )
  );

drop policy if exists "keine_gast_inserts" on dokument_seiten;
drop policy if exists "keine_gast_updates" on dokument_seiten;
drop policy if exists "keine_gast_deletes" on dokument_seiten;
create policy "keine_gast_inserts" on dokument_seiten as restrictive for insert to authenticated
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "keine_gast_updates" on dokument_seiten as restrictive for update to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "keine_gast_deletes" on dokument_seiten as restrictive for delete to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- Suche: Treffer seitenweise, mit Ausschnitt (Treffer in << >> markiert, kein HTML).
create or replace function public.suche_dokumente(q text, p_fach text default null, max_treffer integer default 60)
returns table (
  datei_id uuid,
  fach_id text,
  dateiname text,
  ordner text,
  seite integer,
  ausschnitt text,
  rang real
)
language sql
stable
security invoker
set search_path = public
as $$
  with abfrage as (select websearch_to_tsquery('german', q) as tq)
  select d.id, d.fach_id, d.dateiname, d.ordner, s.seite,
         ts_headline('german', s.inhalt, a.tq,
                     'MaxWords=30, MinWords=12, StartSel=<<, StopSel=>>, MaxFragments=1') as ausschnitt,
         ts_rank(s.tsv, a.tq) as rang
  from dokument_seiten s
  join dateien d on d.id = s.datei_id
  cross join abfrage a
  where s.tsv @@ a.tq
    and (p_fach is null or d.fach_id = p_fach)
  order by rang desc, d.dateiname, s.seite
  limit least(greatest(max_treffer, 1), 200);
$$;

revoke all on function public.suche_dokumente(text, text, integer) from public, anon;
grant execute on function public.suche_dokumente(text, text, integer) to authenticated;
