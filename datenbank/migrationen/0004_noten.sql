-- Noten-Tracking: einzelne Noten pro Fach + optionales Ziel pro Fach

create table if not exists noten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  fach_id text not null references faecher(id),
  typ text not null check (typ in ('muendlich', 'schriftlich', 'zwischennote', 'zeugnisnote')),
  wert numeric not null check (wert >= 0 and wert <= 15),
  bezeichnung text,
  datum date not null default current_date,
  erstellt_am timestamptz not null default now()
);

create table if not exists fach_ziele (
  user_id uuid not null references auth.users default auth.uid(),
  fach_id text not null references faecher(id),
  ziel_note numeric not null check (ziel_note >= 0 and ziel_note <= 15),
  primary key (user_id, fach_id)
);

alter table noten enable row level security;
alter table fach_ziele enable row level security;

create policy "eigene_noten" on noten
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene_fach_ziele" on fach_ziele
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
