-- Homologa los traseros Tandem de la familia DB-SM con la nomenclatura de DB:
-- 68 mm = trasero_gaveta_pequena y 183 mm = trasero_gaveta_grande.
-- Las variantes DB-SM-FE usan medidas propias (80/180 mm) y no se modifican.

delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'trasero_gaveta';

update public.cot_piezas_plantilla p
set formula_cantidad = case p.nombre
      when 'trasero_gaveta_pequena' then 'n_cajones_pequenos'
      else 'n_cajones-n_cajones_pequenos'
    end,
    formula_ancho = case p.nombre
      when 'trasero_gaveta_pequena' then '68/25.4'
      else '183/25.4'
    end,
    notas = case p.nombre
      when 'trasero_gaveta_pequena' then 'DB-2S-SM: dos traseros pequenos de 68 mm.'
      else 'DB-2S-SM: un trasero grande de 183 mm.'
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre in ('trasero_gaveta_pequena', 'trasero_gaveta_grande');

delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref in ('DB-2-SM', 'DB-3-SM')
  and p.nombre = 'trasero_gaveta'
  and p.formula_ancho = '68/25.4';

update public.cot_piezas_plantilla p
set nombre = 'trasero_gaveta_grande',
    formula_cantidad = case t.pref when 'DB-2-SM' then '2' else '3' end,
    formula_ancho = '183/25.4',
    cantos = jsonb_set(
      jsonb_set(coalesce(p.cantos, '{}'::jsonb), '{largos}', '1'::jsonb, true),
      '{anchos}', '2'::jsonb, true
    ),
    tarugos = 6,
    notas = case t.pref
      when 'DB-2-SM' then 'DB-2-SM: dos traseros grandes de 183 mm.'
      else 'DB-3-SM: tres traseros grandes de 183 mm.'
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref in ('DB-2-SM', 'DB-3-SM')
  and p.nombre = 'trasero_gaveta'
  and p.formula_ancho = '183/25.4';

do $$
begin
  if exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref in ('DB-2S-SM', 'DB-2-SM', 'DB-3-SM')
      and p.nombre = 'trasero_gaveta'
  ) then
    raise exception 'La familia DB-SM aun contiene traseros de gaveta genericos';
  end if;

  if (select count(*)
      from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
      where t.pref = 'DB-2S-SM'
        and p.nombre in ('trasero_gaveta_pequena', 'trasero_gaveta_grande')) <> 2 then
    raise exception 'DB-2S-SM debe contener exactamente un trasero pequeno y uno grande';
  end if;

  if exists (
    select 1
    from public.cot_tipos_mueble t
    where t.pref in ('DB-2-SM', 'DB-3-SM')
      and (select count(*)
           from public.cot_piezas_plantilla p
           where p.tipo_mueble_id = t.id
             and p.nombre = 'trasero_gaveta_grande'
             and p.formula_ancho = '183/25.4') <> 1
  ) then
    raise exception 'DB-2-SM y DB-3-SM deben contener exactamente un trasero grande de 183 mm';
  end if;
end $$;
