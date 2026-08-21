-- Block I (Halbjahresergebnisse mit Streichen-Status) + Block II (Prüfungsfächer)
-- für die Hamburger Abischnitt-Berechnung. Siehe Abi-Regeln/Hamburg.md.

create table if not exists block_1_ergebnisse (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  fach_id text not null references faecher(id),
  halbjahr smallint not null check (halbjahr between 1 and 4),
  punkte numeric not null check (punkte >= 0 and punkte <= 15),
  wird_eingebracht boolean not null default true,
  aktualisiert_am timestamptz not null default now(),
  unique (user_id, fach_id, halbjahr),
  check (not (wird_eingebracht and punkte = 0))
);

create table if not exists pruefungsfaecher (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  fach_id text not null references faecher(id),
  position smallint not null check (position between 1 and 4),
  pruefungsart text not null check (pruefungsart in ('schriftlich', 'muendlich', 'praesentation')),
  punkte numeric check (punkte >= 0 and punkte <= 15),
  unique (user_id, position)
);

alter table block_1_ergebnisse enable row level security;
alter table pruefungsfaecher enable row level security;

create policy "eigene_block_1_ergebnisse" on block_1_ergebnisse
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene_pruefungsfaecher" on pruefungsfaecher
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
