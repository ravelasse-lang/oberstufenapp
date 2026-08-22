-- Fix: "infinite recursion detected in policy for relation gastcodes"
--
-- Ursache: gastcodes-Policy "gast_liest_eigenen_code" fragt gast_sitzungen ab,
-- gast_sitzungen-Policy "eigentuemer_liest_gast_sitzungen" fragt wiederum
-- gastcodes ab -> Postgres evaluiert die Policies der jeweils anderen Tabelle
-- rekursiv und bricht ab.
--
-- Lösung: SECURITY DEFINER-Hilfsfunktionen umgehen RLS beim internen Check
-- (laufen als Funktionseigentümer, i.d.R. "postgres", der RLS nicht
-- unterliegt) und durchbrechen so den Kreis.

create or replace function gast_hat_zugriff_auf_gastcode(p_gastcode_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from gast_sitzungen
    where anon_user_id = auth.uid() and gastcode_id = p_gastcode_id
  );
$$;

create or replace function gastcode_gehoert_besitzer(p_gastcode_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from gastcodes
    where id = p_gastcode_id and user_id = p_user_id
  );
$$;

drop policy if exists "gast_liest_eigenen_code" on gastcodes;
create policy "gast_liest_eigenen_code" on gastcodes
  for select using (
    gast_hat_zugriff_auf_gastcode(id)
  );

drop policy if exists "eigentuemer_liest_gast_sitzungen" on gast_sitzungen;
create policy "eigentuemer_liest_gast_sitzungen" on gast_sitzungen
  for select using (
    gastcode_gehoert_besitzer(gastcode_id, auth.uid())
  );
