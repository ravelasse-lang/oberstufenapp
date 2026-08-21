-- Grundschema für die OberstufenApp
-- Ausführen im Supabase SQL-Editor (Dashboard -> SQL Editor -> New query)

create table if not exists faecher (
  id text primary key,
  name text not null,
  akzentfarbe text not null,
  aktiv boolean not null default false
);

create table if not exists dateien (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  fach_id text not null references faecher(id),
  dateiname text not null,
  storage_pfad text not null,
  ordner text not null default 'Allgemein',
  hochgeladen_am timestamptz not null default now()
);

create table if not exists fortschritt_eintraege (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  fach_id text not null references faecher(id),
  titel text not null,
  beschreibung text,
  datum date not null default current_date,
  erstellt_am timestamptz not null default now()
);

create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  fach_id text references faecher(id),
  text text not null,
  erledigt boolean not null default false,
  erstellt_am timestamptz not null default now(),
  erledigt_am timestamptz
);

create table if not exists chat_nachrichten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users default auth.uid(),
  fach_id text not null references faecher(id),
  rolle text not null check (rolle in ('user', 'model')),
  inhalt text not null,
  erstellt_am timestamptz not null default now()
);

-- Fächerliste befüllen (Bio & Chemie aktiv für Phase B)
insert into faecher (id, name, akzentfarbe, aktiv) values
  ('biologie', 'Biologie (erhöhtes Niveau)', '#2E7D32', true),
  ('chemie', 'Chemie', '#EF6C00', true),
  ('psychologie', 'Psychologie', '#8E24AA', false),
  ('seminarkurs', 'Seminar(kurs)', '#546E7A', false),
  ('deutsch', 'Deutsch (erhöhtes Niveau)', '#C62828', false),
  ('englisch', 'Englisch (erhöhtes Niveau)', '#1565C0', false),
  ('mathe', 'Mathe (grundlegendes Niveau)', '#00838F', false),
  ('cambridge', 'Cambridge Zertifikat', '#283593', false),
  ('theater', 'Theater', '#AD1457', false),
  ('geschichte', 'Geschichte', '#6D4C41', false),
  ('recht', 'Rechtswissenschaft', '#37474F', false),
  ('philosophie', 'Philosophie', '#4527A0', false),
  ('sport', 'Sport', '#2E7D32', false)
on conflict (id) do nothing;
