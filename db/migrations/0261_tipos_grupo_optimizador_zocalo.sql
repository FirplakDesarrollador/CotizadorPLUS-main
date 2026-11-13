-- 0261 — Zócalos (TK) como grupo propio del optimizador
--
-- El optimizador discrimina Muebles, Paneles, Fillers y Zócalos. Hasta 0260 el zócalo TK
-- contaba como panel por compartir margen_key 'pn_tk'; ahora va aparte según su
-- categoria 'zocalo'. PN y los complementos D/R siguen como panel.
-- Idempotente.

alter table public.cot_tipos_mueble
  drop constraint if exists cot_tipos_mueble_grupo_optimizador_chk;
alter table public.cot_tipos_mueble
  add constraint cot_tipos_mueble_grupo_optimizador_chk
  check (grupo_optimizador in ('mueble', 'panel', 'filler', 'zocalo'));

update public.cot_tipos_mueble
set grupo_optimizador = 'zocalo'
where categoria = 'zocalo' and grupo_optimizador <> 'zocalo';

create or replace function public.cot_tipos_mueble_grupo_optimizador()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and (new.grupo_optimizador is null or new.grupo_optimizador = 'mueble') then
    new.grupo_optimizador := case
      when new.categoria = 'zocalo' then 'zocalo'
      when new.margen_key = 'pn_tk' then 'panel'
      when new.margen_key = 'fillers' then 'filler'
      else coalesce(new.grupo_optimizador, 'mueble')
    end;
  elsif new.grupo_optimizador is null then
    new.grupo_optimizador := 'mueble';
  end if;
  return new;
end $$;

-- Verificación
select grupo_optimizador, count(*) as tipos, string_agg(pref, ' ' order by pref) filter (where grupo_optimizador <> 'mueble') as prefs
from public.cot_tipos_mueble
group by grupo_optimizador
order by grupo_optimizador;
