-- Corrige la distribución física de DB-2-1INT-SM-FE:
-- la gaveta exterior superior y la interior usan caja pequeña FE;
-- únicamente la gaveta exterior inferior usa caja grande FE.

update public.cot_piezas_plantilla p
set formula_cantidad=case
      when p.nombre in ('lateral_gaveta_grande') then '2'
      when p.nombre in ('trasero_gaveta_grande','contraparche_grande') then '1'
      when p.nombre in ('lateral_gaveta_pequena') then '4'
      when p.nombre in ('trasero_gaveta_pequena','contraparche_pequeno') then '2'
      else p.formula_cantidad
    end,
    notas=case
      when p.nombre='lateral_gaveta_grande' then 'Laterales de la gaveta exterior inferior: 500 x 200 mm.'
      when p.nombre='trasero_gaveta_grande' then 'Trasero de la gaveta exterior inferior: L-86 mm x 180 mm; seis tarugos.'
      when p.nombre='contraparche_grande' then 'Contraplaca de la gaveta exterior inferior: L-86 mm x 200 mm; seis tarugos.'
      when p.nombre='lateral_gaveta_pequena' then 'Laterales de la gaveta exterior superior y de la interior: 500 x 100 mm.'
      when p.nombre='trasero_gaveta_pequena' then 'Traseros de la gaveta exterior superior y de la interior: L-86 mm x 80 mm; cuatro tarugos.'
      when p.nombre='contraparche_pequeno' then 'Contraplacas de la gaveta exterior superior y de la interior: L-86 mm x 100 mm; cuatro tarugos.'
      else p.notas
    end,
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref='DB-2-1INT-SM-FE'
  and p.nombre in (
    'lateral_gaveta_grande','trasero_gaveta_grande','contraparche_grande',
    'lateral_gaveta_pequena','trasero_gaveta_pequena','contraparche_pequeno'
  );

update public.cot_reglas_config r
set valor='2',
    notas='Dos cajas pequeñas FE: gaveta exterior superior y gaveta interior.',
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=r.tipo_mueble_id
  and t.pref='DB-2-1INT-SM-FE'
  and r.variable='n_cajones_pequenos';

update public.cot_tipos_mueble
set notas='Sin manijas ni barras. Dos cajas pequeñas, una caja grande inferior y tres rieles RIELFE500.',
    updated_at=now()
where pref='DB-2-1INT-SM-FE';

do $$
declare v_tipo uuid;
begin
  select id into v_tipo from public.cot_tipos_mueble where pref='DB-2-1INT-SM-FE';
  if (select formula_cantidad from public.cot_piezas_plantilla where tipo_mueble_id=v_tipo and nombre='lateral_gaveta_pequena') <> '4'
    or (select formula_cantidad from public.cot_piezas_plantilla where tipo_mueble_id=v_tipo and nombre='lateral_gaveta_grande') <> '2'
    or (select valor from public.cot_reglas_config where tipo_mueble_id=v_tipo and variable='n_cajones_pequenos') <> '2' then
    raise exception 'DB-2-1INT-SM-FE debe tener dos cajas pequeñas y una grande';
  end if;
end $$;
