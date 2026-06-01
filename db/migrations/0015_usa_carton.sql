-- Cotizador PLUS — flag usa_carton por tipo (paneles/fillers/zócalos NO usan cartón de protección)
alter table public.cot_tipos_mueble add column if not exists usa_carton boolean not null default true;
update public.cot_tipos_mueble set usa_carton = false where pref in ('F','PN','TK');
