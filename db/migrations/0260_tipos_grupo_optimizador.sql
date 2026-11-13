-- 0260 — Grupo de conteo del optimizador por tipo de mueble
--
-- El optimizador de corte separa los módulos de una cotización en tres grupos:
-- Muebles, Paneles y Fillers. La clasificación vive en el catálogo para que aplique
-- igual a cotizaciones existentes y nuevas sin depender de prefijos en el código.
--
--   mueble  ← margen_key 'muebles'  (inferior, superior, vanity, closet, kit, pieza BT/DF/E)
--   panel   ← margen_key 'pn_tk'    (PN, PN-SF, zócalo TK, complementos D y R)
--   filler  ← margen_key 'fillers'  (F, F-SF)
--
-- Los tipos que se creen después reciben el grupo de su margen_key mediante trigger
-- si no lo traen explícito. Se puede corregir a mano por tipo (columna editable).
-- Idempotente.

alter table public.cot_tipos_mueble
  add column if not exists grupo_optimizador text;

update public.cot_tipos_mueble
set grupo_optimizador = case margen_key
  when 'pn_tk' then 'panel'
  when 'fillers' then 'filler'
  else 'mueble'
end
where grupo_optimizador is null;

alter table public.cot_tipos_mueble
  alter column grupo_optimizador set default 'mueble';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cot_tipos_mueble_grupo_optimizador_chk') then
    alter table public.cot_tipos_mueble
      add constraint cot_tipos_mueble_grupo_optimizador_chk
      check (grupo_optimizador in ('mueble', 'panel', 'filler'));
  end if;
end $$;

create or replace function public.cot_tipos_mueble_grupo_optimizador()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and (new.grupo_optimizador is null or new.grupo_optimizador = 'mueble') then
    new.grupo_optimizador := case new.margen_key
      when 'pn_tk' then 'panel'
      when 'fillers' then 'filler'
      else coalesce(new.grupo_optimizador, 'mueble')
    end;
  elsif new.grupo_optimizador is null then
    new.grupo_optimizador := 'mueble';
  end if;
  return new;
end $$;

drop trigger if exists trg_cot_tipos_mueble_grupo_optimizador on public.cot_tipos_mueble;
create trigger trg_cot_tipos_mueble_grupo_optimizador
  before insert or update on public.cot_tipos_mueble
  for each row execute function public.cot_tipos_mueble_grupo_optimizador();

alter table public.cot_tipos_mueble
  alter column grupo_optimizador set not null;

-- Verificación
select grupo_optimizador, margen_key, count(*) as tipos, string_agg(pref, ' ' order by pref) as prefs
from public.cot_tipos_mueble
group by grupo_optimizador, margen_key
order by grupo_optimizador, margen_key;
