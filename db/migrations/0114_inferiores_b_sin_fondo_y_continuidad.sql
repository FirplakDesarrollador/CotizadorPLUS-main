-- Muebles inferiores de familia B: se elimina el respaldo, la base recupera
-- el espesor TB en profundidad y se explicita la continuidad estructural.

alter table public.cot_piezas_plantilla
  drop constraint if exists cot_piezas_plantilla_modo_agrupacion_check;

alter table public.cot_piezas_plantilla
  add constraint cot_piezas_plantilla_modo_agrupacion_check
  check (modo_agrupacion in ('local', 'continua', 'continua_opcional', 'lateral_compartido'));

-- Solo inferiores cuyo prefijo comercial contiene B. El reemplazo elimina el
-- espesor del backing sin tocar el descuento constructivo de 18 mm ni la rama
-- removible de las bases que la poseen.
update public.cot_piezas_plantilla p
set formula_ancho = replace(p.formula_ancho, '-TB', ''),
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.categoria = 'inferior'
  and t.pref ilike '%B%'
  and p.nombre = 'base'
  and p.formula_ancho like '%-TB%';

delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.categoria = 'inferior'
  and t.pref ilike '%B%'
  and p.nombre = 'fondo';

-- Base y refuerzo trasero son continuos obligatorios en toda familia B que ya
-- admite agrupacion. No se habilitan aqui esquineros o especiales bloqueados.
update public.cot_piezas_plantilla p
set modo_agrupacion = 'continua',
    clave_fusion = case p.nombre when 'base' then 'base' else 'refuerzo_trasero' end,
    formula_largo_grupo = 'LG-(2*TC)',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.categoria = 'inferior'
  and t.pref ilike '%B%'
  and t.permite_agrupacion
  and p.nombre in ('base', 'refuerzo_trasero');

-- Refuerzos delanteros y Gola se fusionan solo si el motor confirma igualdad
-- de cantidad, seccion, material, canto, orientacion y posicion de montaje.
update public.cot_piezas_plantilla p
set modo_agrupacion = 'continua_opcional',
    clave_fusion = case when p.nombre = 'gola_madera' then 'gola_madera' else 'refuerzo_frontal' end,
    formula_largo_grupo = 'LG-(2*TC)',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.categoria = 'inferior'
  and t.pref ilike '%B%'
  and t.permite_agrupacion
  and p.nombre in ('refuerzo_delantero', 'refuerzo_horizontal', 'gola_madera');
