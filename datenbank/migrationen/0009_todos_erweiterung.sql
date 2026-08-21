-- To-Do-Erweiterung: Kategorie, Fälligkeitsdatum, Anpinnen (alles optional).

alter table todos add column if not exists kategorie text;
alter table todos add column if not exists faellig_am timestamptz;
alter table todos add column if not exists angepinnt boolean not null default false;
