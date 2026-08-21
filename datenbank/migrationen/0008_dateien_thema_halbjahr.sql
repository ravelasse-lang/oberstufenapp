-- Dateien optional einem Thema (Vault-Slug) und/oder Halbjahr zuordnen können.

alter table dateien add column if not exists thema_slug text;
alter table dateien add column if not exists halbjahr smallint check (halbjahr between 1 and 4);
