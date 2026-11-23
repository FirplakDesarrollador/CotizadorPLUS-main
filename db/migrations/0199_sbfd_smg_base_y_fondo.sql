-- SBFD-SMG adopta el mismo cálculo de base y el fondo estándar de 6 mm de
-- SBFD. La visualización coloca el respaldo justo al terminar la base.
update public.cot_piezas_plantilla p
set formula_ancho = 'P-0.70866-TB',
    notas = 'BASE C: profundidad estándar SBFD, descontando 18 mm y el espesor del fondo.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SBFD-SMG'
  and p.nombre = 'base';

delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'SBFD-SMG'
  and p.nombre = 'fondo';

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,orden,notas,visualizacion,
   modo_agrupacion,clave_fusion,formula_largo_grupo)
select id,'fondo','fondo','1','A-0.07874','L-0.62992',
       '{}'::jsonb,0,0,60,
       'Fondo estándar de 6 mm, con las mismas holguras del SBFD.',
       '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":true,"nota":"Fondo estándar montado inmediatamente detrás de la base."}'::jsonb,
       'continua','fondo','LG-TC'
from public.cot_tipos_mueble
where pref = 'SBFD-SMG';

update public.cot_tipos_mueble
set descripcion_es = 'Tipología SBFD-SMG paramétrica, con fondo estándar de 6 mm y sin entrepaño.',
    updated_at = now()
where pref = 'SBFD-SMG';

do $$
begin
  if not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'SBFD-SMG' and p.nombre = 'base'
      and p.formula_ancho = 'P-0.70866-TB'
  ) then
    raise exception 'La base de SBFD-SMG no adoptó el cálculo estándar de SBFD';
  end if;

  if not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'SBFD-SMG' and p.nombre = 'fondo'
      and p.rol_tablero = 'fondo'
      and p.formula_largo = 'A-0.07874'
      and p.formula_ancho = 'L-0.62992'
      and p.visualizacion->>'funcion' = 'respaldo'
  ) then
    raise exception 'El fondo estándar no quedó configurado en SBFD-SMG';
  end if;
end $$;
