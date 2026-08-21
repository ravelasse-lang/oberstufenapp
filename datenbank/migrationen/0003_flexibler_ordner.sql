-- Nur nötig, falls du 0001_schema.sql schon VOR diesem Update ausgeführt hattest
-- (mit der alten festen kategorie-Liste). Wandelt die feste Kategorie in ein
-- freies "Ordner"-Feld um, damit z.B. eigene Ordner wie "Nachhilfe" oder
-- "Crashkurs Ferien" möglich sind. Kann gefahrlos mehrfach ausgeführt werden.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'dateien' and column_name = 'kategorie'
  ) then
    alter table dateien rename column kategorie to ordner;
    alter table dateien drop constraint if exists dateien_kategorie_check;
    alter table dateien alter column ordner set default 'Allgemein';
  end if;
end $$;
