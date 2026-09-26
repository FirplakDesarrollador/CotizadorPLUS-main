-- Hoja de ruta real: "UDV1228 3/4-2S MBLE INF BAÑO 3 GAVETAS PEQUEÑA CARB2".
-- UDV comparte el selector DB, pero sus cajones pequeños miden 5.5 in (139.7mm),
-- no la rejilla de cuatro unidades de DB-2S.
delete from public.cot_reglas_config r
using public.cot_tipos_mueble t
where r.tipo_mueble_id = t.id
  and t.pref = 'UDV'
  and r.variable = 'n_cajones_pequenos';

insert into public.cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad)
select id, 'n_cajones_pequenos', 'true', '0', 5
from public.cot_tipos_mueble
where pref = 'UDV';

-- Las piezas uniformes se conservan en modos manuales o sin cajones pequeños.
update public.cot_piezas_plantilla p
set formula_cantidad = 'n_cajones_pequenos>0?0:n_cajones'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UDV'
  and p.nombre in ('frente', 'trasero_gaveta');

-- Fondo de cada gaveta: la hoja mide 199.8 x 441 mm a L=12, P=21.
update public.cot_piezas_plantilla p
set formula_largo = 'L-4.13386',
    formula_ancho = 'P-3.6378'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UDV'
  and p.nombre = 'base_gaveta';

-- BACKING: A-2mm por L-16mm, igual al despiece físico.
update public.cot_piezas_plantilla p
set formula_largo = 'A-0.07874',
    formula_ancho = 'L-0.62992'
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UDV'
  and p.nombre = 'fondo';

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden, tarugos, soportes)
select id, 'frente_gaveta_pequena', 'frente',
  'n_cajones_pequenos', 'L-RV', '5.5',
  '{"anchos":2,"largos":2,"calibre":"22x1"}'::jsonb, 71, 0, 0
from public.cot_tipos_mueble t
where t.pref = 'UDV'
  and not exists (
    select 1 from public.cot_piezas_plantilla p
    where p.tipo_mueble_id = t.id and p.nombre = 'frente_gaveta_pequena'
  );

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden, tarugos, soportes)
select id, 'frente_gaveta_grande', 'frente',
  'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:0', 'L-RV',
  '(n_cajones-n_cajones_pequenos)>0?(A-n_cajones*RV-n_cajones_pequenos*5.5)/(n_cajones-n_cajones_pequenos):0',
  '{"anchos":2,"largos":2,"calibre":"22x1"}'::jsonb, 72, 0, 0
from public.cot_tipos_mueble t
where t.pref = 'UDV'
  and not exists (
    select 1 from public.cot_piezas_plantilla p
    where p.tipo_mueble_id = t.id and p.nombre = 'frente_gaveta_grande'
  );

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden, tarugos, soportes)
select id, 'trasero_gaveta_pequena', 'refuerzo',
  'n_cajones_pequenos', 'L-4.607', '68/25.4',
  '{"anchos":0,"largos":2,"calibre":"19x0,45","despEdges":0}'::jsonb, 61, 0, 0
from public.cot_tipos_mueble t
where t.pref = 'UDV'
  and not exists (
    select 1 from public.cot_piezas_plantilla p
    where p.tipo_mueble_id = t.id and p.nombre = 'trasero_gaveta_pequena'
  );

insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden, tarugos, soportes)
select id, 'trasero_gaveta_grande', 'refuerzo',
  'n_cajones_pequenos>0?n_cajones-n_cajones_pequenos:0', 'L-4.607', '183/25.4',
  '{"anchos":0,"largos":2,"calibre":"19x0,45","despEdges":0}'::jsonb, 62, 0, 0
from public.cot_tipos_mueble t
where t.pref = 'UDV'
  and not exists (
    select 1 from public.cot_piezas_plantilla p
    where p.tipo_mueble_id = t.id and p.nombre = 'trasero_gaveta_grande'
  );
