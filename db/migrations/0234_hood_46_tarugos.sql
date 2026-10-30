-- TW/W-SM-HOOD completos: 46 tarugos. Entrepaño fijo 8, frente falso 10,
-- gola 4 y cada refuerzo trasero 4; base/tapa mantienen 8 cada una.
begin;
update public.cot_piezas_plantilla p
set tarugos=case p.nombre when 'entrepano_fijo' then 8 when 'frente_falso' then 10 else 4 end,
    soportes=case when p.nombre='entrepano_fijo' then 0 else p.soportes end,
    updated_at=now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref in ('TW-SM-HOOD','W-SM-HOOD')
  and p.nombre in ('entrepano_fijo','frente_falso','gola_madera','refuerzo_trasero');
do $$ declare prefijo text; total numeric; begin
 foreach prefijo in array array['TW-SM-HOOD','W-SM-HOOD'] loop
  select sum(p.tarugos*case when p.nombre in ('lateral','refuerzo_trasero') then 2
    when p.nombre='frente' and prefijo='W-SM-HOOD' then 2 else 1 end)
  into total from public.cot_piezas_plantilla p join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
  where t.pref=prefijo;
  if total is distinct from 46 then raise exception '% debe tener 46 tarugos; obtuvo %',prefijo,total; end if;
 end loop;
end $$;
commit;
