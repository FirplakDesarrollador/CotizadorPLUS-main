-- ============================================================================
-- Migración 0055: Visualización y agrupación física para familias FE (B-FE, UB-FE, V-FE)
-- 1. Asigna metadatos de montaje 3D confirmados a las 13 piezas de B-FE/UB-FE/V-FE
--    para evitar piezas "sueltas" fuera de la carcasa (fondo_gaveta) y posicionar
--    la gaveta de madera arriba y la puerta abajo.
-- 2. Habilita permite_agrupacion y define modo_agrupacion continuo en base, refuerzos,
--    fondo y laterales para permitir combinarlos con tipologías base compatibles (B, UB, V).
-- ============================================================================

-- 1. Habilitar agrupación en tipos FE
update public.cot_tipos_mueble
set permite_agrupacion = true
where pref in ('B-FE', 'UB-FE', 'V-FE');

-- 2. Homologar piezas para agrupación física continua
update public.cot_piezas_plantilla p
set modo_agrupacion = case
      when p.nombre = 'lateral' then 'lateral_compartido'
      when p.nombre in ('base', 'refuerzo_delantero', 'refuerzo_trasero', 'fondo') then 'continua'
      else 'local'
    end,
    clave_fusion = case
      when p.nombre = 'refuerzo_delantero' then 'refuerzo_frontal'
      when p.nombre = 'refuerzo_trasero' then 'refuerzo_trasero'
      when p.nombre in ('base', 'fondo') then p.nombre
      else null
    end,
    formula_largo_grupo = case
      when p.nombre = 'fondo' then 'LG-TC'
      when p.nombre in ('base', 'refuerzo_delantero', 'refuerzo_trasero') then 'LG-(2*TC)'
      else null
    end
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id and t.pref in ('B-FE', 'UB-FE', 'V-FE');

-- 3. Metadatos de visualización 3D confirmados
update public.cot_piezas_plantilla p
set visualizacion = case
      when p.nombre = 'lateral'
        then '{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"confirmado":true}'::jsonb
      when p.nombre = 'base'
        then '{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"confirmado":true}'::jsonb
      when p.nombre in ('refuerzo_delantero', 'refuerzo_delantero_removible')
        then '{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"confirmado":true}'::jsonb
      when p.nombre in ('refuerzo_trasero', 'refuerzo_trasero_removible')
        then '{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"confirmado":true}'::jsonb
      when p.nombre = 'entrepano'
        then '{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"confirmado":true}'::jsonb
      when p.nombre = 'fondo'
        then '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":true}'::jsonb
      when p.nombre = 'frente'
        then '{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"confirmado":true}'::jsonb
      when p.nombre = 'frente_cajon'
        then '{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'::jsonb
      when p.nombre = 'fondo_gaveta'
        then '{"version":1,"funcion":"base_gaveta","plano":"XY","intercambiar":false,"confirmado":true}'::jsonb
      when p.nombre in ('lateral_gaveta_der', 'lateral_gaveta_izq')
        then '{"version":1,"funcion":"lateral_gaveta","plano":"YZ","intercambiar":false,"confirmado":true}'::jsonb
      when p.nombre = 'trasero_gaveta'
        then '{"version":1,"funcion":"trasero_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'::jsonb
      when p.nombre = 'contraparche'
        then '{"version":1,"funcion":"frente_interior","plano":"XZ","intercambiar":false,"confirmado":true}'::jsonb
      else p.visualizacion
    end
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id and t.pref in ('B-FE', 'UB-FE', 'V-FE');
