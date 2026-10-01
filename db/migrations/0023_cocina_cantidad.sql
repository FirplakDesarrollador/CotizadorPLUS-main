-- Adicionar columna cantidad a cot_cocinas
alter table public.cot_cocinas add column if not exists cantidad numeric not null default 1;
