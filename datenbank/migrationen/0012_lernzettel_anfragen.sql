-- "Postfach" für Lernzettel-Anfragen: Nutzer drückt in der App einen Knopf,
-- trägt Fach/Thema/Dokumenttyp ein, Claude Code verarbeitet das entweder auf
-- Zuruf im Chat oder automatisch über einen geplanten täglichen Check.

create table if not exists lernzettel_anfragen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  fach_id text references faecher(id),
  thema text not null,
  dokumenttyp text not null default 'lernzettel',
  notiz text,
  status text not null default 'offen' check (status in ('offen', 'in_bearbeitung', 'fertig')),
  ergebnis_pfad text,
  erstellt_am timestamptz not null default now(),
  bearbeitet_am timestamptz
);

alter table lernzettel_anfragen enable row level security;

create policy "eigene_lernzettel_anfragen" on lernzettel_anfragen
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
