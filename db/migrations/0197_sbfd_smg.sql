-- SBFD-SMG reconstruida desde la hoja de corte suministrada y el montaje
-- HRJ SBFD33 SMG.iges. Es una carcasa lavaplatos con gola metálica, fondo
-- estándar de 6 mm, sin entrepaño, gola de madera ni manijas.
insert into public.cot_tipos_mueble
  (pref, pref_imperial, pref_metrico, nombre_es, nombre_en, categoria,
   margen_key, descripcion_es, notas, activo, permite_agrupacion)
values
  ('SBFD-SMG', 'SBFD-SMG', 'SBFD-SMG',
   'Mueble inferior lavaplatos con gola metálica y 2 puertas',
   'Sink base full door with metal gola', 'inferior', 'muebles',
   'Tipología SBFD-SMG paramétrica, con fondo estándar de 6 mm y sin entrepaño.',
   'Geometría y despiece reconstruidos desde HRJ SBFD33 SMG.iges y hoja SBFD38 SMG.',
   true, false)
on conflict (pref) do update set
  pref_imperial = excluded.pref_imperial,
  pref_metrico = excluded.pref_metrico,
  nombre_es = excluded.nombre_es,
  nombre_en = excluded.nombre_en,
  categoria = excluded.categoria,
  margen_key = excluded.margen_key,
  descripcion_es = excluded.descripcion_es,
  notas = excluded.notas,
  activo = true,
  permite_agrupacion = false,
  updated_at = now();

delete from public.cot_piezas_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SBFD-SMG');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,orden,notas,visualizacion)
select t.id, v.nombre, v.rol, v.cantidad, v.largo, v.ancho,
  v.cantos::jsonb, v.tarugos, 0, v.orden, v.notas, v.visualizacion::jsonb
from public.cot_tipos_mueble t
cross join (values
  ('base','caja','1','L-2*TC','P-0.70866-TB',
   '{"calibre":"19x0,45","largos":2,"anchos":0}',8,10,
   'BASE C: profundidad estándar SBFD, descontando 18 mm y el espesor del fondo.',
   '{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"0","confirmado":true,"nota":"Posición reconstruida desde HRJ SBFD33 SMG.iges."}'),
  ('lateral','caja','2','A','P',
   '{"calibre":"19x0,45","largos":2,"anchos":2}',0,20,
   'SIDE R/L C: par de laterales completos.',
   '{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"x":"I*(L-TC)","y":"0","z":"0","confirmado":true,"nota":"Par lateral con mecanizado frontal superior para gola metálica.","recorte":{"borde":"frontal_superior","profundidad":"27","alto":"73"}}'),
  ('refuerzo_delantero','caja','1','L-2*TC','80/25.4',
   '{"calibre":"19x0,45","largos":2,"anchos":0}',4,30,
   'RAIL DEL C: riel delantero de 80 mm.',
   '{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"x":"TC","y":"27","z":"A-TC","confirmado":true,"nota":"Riel delantero horizontal de 80 mm de profundidad, retirado 27 mm del frente para la gola metálica."}'),
  ('refuerzo_trasero','refuerzo','2','L-2*TC','80/25.4',
   '{"calibre":"19x0,45","largos":2,"anchos":0}',4,40,
   'RAIL TRAS C: dos rieles traseros de 80 mm.',
   '{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"x":"TC","y":"P-TC","z":"I*(A-H)","confirmado":true,"nota":"Rieles traseros inferior y superior reconstruidos desde HRJ SBFD33 SMG.iges."}'),
  ('frente','frente','2','(L-2*RV)/2','A-30/25.4',
   '{"calibre":"22x1","largos":2,"anchos":2}',0,50,
   'DOOR R/L C: dos puertas con 30 mm libres para gola metálica.',
   '{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"x":"RV+I*W","y":"0","z":"0","confirmado":true,"nota":"Dos puertas y hueco superior SMG reconstruidos desde HRJ SBFD33 SMG.iges."}'),
  ('fondo','fondo','1','A-0.07874','L-0.62992',
   '{}',0,60,
   'Fondo estándar de 6 mm, con las mismas holguras del SBFD.',
   '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":true,"nota":"Fondo estándar montado inmediatamente detrás de la base."}')
) as v(nombre,rol,cantidad,largo,ancho,cantos,tarugos,orden,notas,visualizacion)
where t.pref = 'SBFD-SMG';

delete from public.cot_reglas_config
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SBFD-SMG');

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select destino.id, r.variable, r.condicion, r.valor, r.prioridad, r.activo,
  'Heredado de SBFD-SM para SBFD-SMG.'
from public.cot_reglas_config r
join public.cot_tipos_mueble origen on origen.id = r.tipo_mueble_id and origen.pref = 'SBFD-SM'
join public.cot_tipos_mueble destino on destino.pref = 'SBFD-SMG'
where r.variable <> 'n_entrepanos';

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select id, 'n_entrepanos', 'true', '0', 10, true, 'SBFD-SMG no lleva entrepaño.'
from public.cot_tipos_mueble where pref = 'SBFD-SMG';

delete from public.cot_herrajes_plantilla
where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'SBFD-SMG');

insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select destino.id, h.rol, h.herraje_codigo, h.selector_key, h.formula_cantidad, h.orden,
  'Heredado de SBFD-SM: patas, tornillos y bisagras; sin manijas.'
from public.cot_herrajes_plantilla h
join public.cot_tipos_mueble origen on origen.id = h.tipo_mueble_id and origen.pref = 'SBFD-SM'
join public.cot_tipos_mueble destino on destino.pref = 'SBFD-SMG';

do $$
begin
  if (select count(*) from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
      where t.pref = 'SBFD-SMG') <> 6 then
    raise exception 'SBFD-SMG no quedó con sus seis plantillas de pieza';
  end if;
  if exists (select 1 from public.cot_piezas_plantilla p
             join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
             where t.pref = 'SBFD-SMG' and p.nombre in ('entrepano','gola_madera')) then
    raise exception 'SBFD-SMG contiene piezas no certificadas por la hoja';
  end if;
end $$;
