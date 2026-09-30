-- Habilita agrupacion fisica para las tipologias SM de Gola creadas en
-- 0081-0108 y para WLD. Solo agrega metadatos de agrupacion: no modifica
-- formulas individuales, cantidades, costos ni visualizacion.

do $$
declare
  v_pref text;
begin
  foreach v_pref in array array[
    'BFD-SM', 'SBFD-SM', 'SB-SM',
    'W-SM', 'W-SM-PUSH', 'W-SM-LOC', 'WSM', 'WLD',
    'DB-2S-SM', 'DB-2-SM', 'DB-3-SM',
    'DB-2S-SM-FE', 'DB-2-SM-FE', 'DB-3-SM-FE'
  ] loop
    if not exists (select 1 from public.cot_tipos_mueble where pref = v_pref) then
      raise exception 'No existe la tipologia agrupable %', v_pref;
    end if;
    if (select count(*) from public.cot_piezas_plantilla p
        join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
        where t.pref = v_pref and p.nombre = 'lateral') <> 1
       or (select count(*) from public.cot_piezas_plantilla p
           join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
           where t.pref = v_pref and p.nombre = 'base') <> 1
       or (select count(*) from public.cot_piezas_plantilla p
           join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
           where t.pref = v_pref and p.nombre = 'fondo') <> 1 then
      raise exception 'La tipologia % no tiene una unica carcasa lateral/base/fondo', v_pref;
    end if;
  end loop;
end $$;

update public.cot_tipos_mueble
set permite_agrupacion = true,
    updated_at = now()
where pref in (
  'BFD-SM', 'SBFD-SM', 'SB-SM',
  'W-SM', 'W-SM-PUSH', 'W-SM-LOC', 'WSM', 'WLD',
  'DB-2S-SM', 'DB-2-SM', 'DB-3-SM',
  'DB-2S-SM-FE', 'DB-2-SM-FE', 'DB-3-SM-FE'
);

-- Restablecer primero el alcance evita heredar clasificaciones antiguas e
-- incompatibles. Golas, frentes, gavetas, entrepanos y refuerzos siguen siendo
-- locales y conservan exactamente su despiece por compartimento.
update public.cot_piezas_plantilla p
set modo_agrupacion = 'local',
    clave_fusion = null,
    formula_largo_grupo = null,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref in (
    'BFD-SM', 'SBFD-SM', 'SB-SM',
    'W-SM', 'W-SM-PUSH', 'W-SM-LOC', 'WSM', 'WLD',
    'DB-2S-SM', 'DB-2-SM', 'DB-3-SM',
    'DB-2S-SM-FE', 'DB-2-SM-FE', 'DB-3-SM-FE'
  );

-- Todas las familias comparten laterales, base y fondo. Este conjunto comun
-- permite, entre otras combinaciones compatibles, DB-2S-SM + BFD-SM.
update public.cot_piezas_plantilla p
set modo_agrupacion = case p.nombre
      when 'lateral' then 'lateral_compartido'
      else 'continua'
    end,
    clave_fusion = case p.nombre
      when 'base' then 'base'
      when 'fondo' then 'fondo'
      else null
    end,
    formula_largo_grupo = case p.nombre
      when 'base' then 'LG-(2*TC)'
      when 'fondo' then 'LG-TC'
      else null
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref in (
    'BFD-SM', 'SBFD-SM', 'SB-SM',
    'W-SM', 'W-SM-PUSH', 'W-SM-LOC', 'WSM', 'WLD',
    'DB-2S-SM', 'DB-2-SM', 'DB-3-SM',
    'DB-2S-SM-FE', 'DB-2-SM-FE', 'DB-3-SM-FE'
  )
  and p.nombre in ('lateral', 'base', 'fondo');

-- Los superiores que poseen tapa pueden fabricarla continua. Se mantiene el
-- mismo conjunto base/tapa/fondo en toda la familia superior agrupable.
update public.cot_piezas_plantilla p
set modo_agrupacion = 'continua',
    clave_fusion = 'tapa',
    formula_largo_grupo = 'LG-(2*TC)',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref in ('W-SM', 'W-SM-PUSH', 'W-SM-LOC', 'WSM', 'WLD')
  and p.nombre = 'tapa';
