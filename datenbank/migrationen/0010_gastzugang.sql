-- Gäste-Zugang: Besucher loggen sich anonym mit einem Code ein und dürfen
-- NUR LESEN (nie schreiben). Codes lassen sich jederzeit deaktivieren
-- ("rauswerfen") — RLS prüft den Status live bei jeder Anfrage.
--
-- Voraussetzung im Supabase-Dashboard: Authentication -> Providers ->
-- "Anonymous Sign-Ins" aktivieren, sonst funktioniert signInAnonymously() nicht.

create table if not exists gastcodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  code text not null unique,
  bezeichnung text,
  aktiv boolean not null default true,
  erstellt_am timestamptz not null default now()
);

create table if not exists gast_sitzungen (
  anon_user_id uuid primary key,
  gastcode_id uuid not null references gastcodes(id) on delete cascade,
  erstellt_am timestamptz not null default now()
);

alter table gastcodes enable row level security;
alter table gast_sitzungen enable row level security;

-- Besitzer: volle Kontrolle über eigene Codes
create policy "eigene_gastcodes" on gastcodes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Gast: darf nur den einen Code lesen, mit dem er verbunden ist (für den Aktiv-Check)
create policy "gast_liest_eigenen_code" on gastcodes
  for select using (
    id in (select gastcode_id from gast_sitzungen where anon_user_id = auth.uid())
  );

-- Gast: darf nur seine eigene Verknüpfung lesen
create policy "gast_liest_eigene_sitzung" on gast_sitzungen
  for select using (auth.uid() = anon_user_id);

-- Besitzer: sieht, welche Gast-Sitzungen zu seinen Codes gehören
create policy "eigentuemer_liest_gast_sitzungen" on gast_sitzungen
  for select using (
    gastcode_id in (select id from gastcodes where user_id = auth.uid())
  );

-- Funktion, die ein Gast (bereits anonym eingeloggt) aufruft, um sich mit
-- einem Code zu verknüpfen. SECURITY DEFINER = läuft mit erhöhten Rechten,
-- damit sie trotz RLS in gast_sitzungen schreiben kann.
create or replace function gast_login(eingegebener_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  gefundener_code_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select id into gefundener_code_id
  from gastcodes
  where code = eingegebener_code and aktiv = true;

  if gefundener_code_id is null then
    return false;
  end if;

  insert into gast_sitzungen (anon_user_id, gastcode_id)
  values (auth.uid(), gefundener_code_id)
  on conflict (anon_user_id) do update set gastcode_id = excluded.gastcode_id;

  return true;
end;
$$;

-- Gäste dürfen NUR LESEN auf allen bestehenden Daten-Tabellen. Diese Policies
-- kommen ZUSÄTZLICH zu den bestehenden Besitzer-Policies hinzu (mehrere
-- passende Policies werden mit ODER verknüpft) - Schreibrechte bleiben
-- exklusiv beim Besitzer, weil nur dessen Policy INSERT/UPDATE/DELETE erlaubt.

create policy "gast_liest_todos" on todos
  for select using (
    exists (
      select 1 from gast_sitzungen gs join gastcodes gc on gc.id = gs.gastcode_id
      where gs.anon_user_id = auth.uid() and gc.aktiv = true and gc.user_id = todos.user_id
    )
  );

create policy "gast_liest_noten" on noten
  for select using (
    exists (
      select 1 from gast_sitzungen gs join gastcodes gc on gc.id = gs.gastcode_id
      where gs.anon_user_id = auth.uid() and gc.aktiv = true and gc.user_id = noten.user_id
    )
  );

create policy "gast_liest_fach_ziele" on fach_ziele
  for select using (
    exists (
      select 1 from gast_sitzungen gs join gastcodes gc on gc.id = gs.gastcode_id
      where gs.anon_user_id = auth.uid() and gc.aktiv = true and gc.user_id = fach_ziele.user_id
    )
  );

create policy "gast_liest_dateien" on dateien
  for select using (
    exists (
      select 1 from gast_sitzungen gs join gastcodes gc on gc.id = gs.gastcode_id
      where gs.anon_user_id = auth.uid() and gc.aktiv = true and gc.user_id = dateien.user_id
    )
  );

create policy "gast_liest_block_1_ergebnisse" on block_1_ergebnisse
  for select using (
    exists (
      select 1 from gast_sitzungen gs join gastcodes gc on gc.id = gs.gastcode_id
      where gs.anon_user_id = auth.uid() and gc.aktiv = true and gc.user_id = block_1_ergebnisse.user_id
    )
  );

create policy "gast_liest_pruefungsfaecher" on pruefungsfaecher
  for select using (
    exists (
      select 1 from gast_sitzungen gs join gastcodes gc on gc.id = gs.gastcode_id
      where gs.anon_user_id = auth.uid() and gc.aktiv = true and gc.user_id = pruefungsfaecher.user_id
    )
  );

-- Gäste dürfen hochgeladene Dateien im Storage-Bucket lesen/öffnen (Pfad:
-- {besitzer_user_id}/{fach}/{thema}/{datei}), aber nichts hochladen/löschen.
create policy "gast_liest_dateien_storage" on storage.objects
  for select using (
    bucket_id = 'fach-dateien'
    and exists (
      select 1 from gast_sitzungen gs join gastcodes gc on gc.id = gs.gastcode_id
      where gs.anon_user_id = auth.uid()
        and gc.aktiv = true
        and gc.user_id::text = (storage.foldername(name))[1]
    )
  );
