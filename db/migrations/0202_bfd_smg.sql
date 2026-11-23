-- BFD-SMG reconstruida desde la hoja BFD24-SMG suministrada. Incluye un
-- entrepaño, fondo estándar de 6 mm y mecanizado frontal para gola metálica.
insert into public.cot_tipos_mueble
  (pref,pref_imperial,pref_metrico,nombre_es,nombre_en,categoria,margen_key,
   descripcion_es,notas,activo,permite_agrupacion)
values
  ('BFD-SMG','BFD-SMG','BFD-SMG',
   'Mueble inferior con gola metálica, 2 puertas y entrepaño',
   'Base full door with metal gola and shelf','inferior','muebles',
   'Tipología BFD-SMG paramétrica con entrepaño y fondo estándar de 6 mm.',
   'Despiece reconstruido desde la hoja HRJ BFD24-SMG.',true,false)
on conflict (pref) do update set
  pref_imperial=excluded.pref_imperial,pref_metrico=excluded.pref_metrico,
  nombre_es=excluded.nombre_es,nombre_en=excluded.nombre_en,
  categoria=excluded.categoria,margen_key=excluded.margen_key,
  descripcion_es=excluded.descripcion_es,notas=excluded.notas,
  activo=true,permite_agrupacion=false,updated_at=now();

delete from public.cot_piezas_plantilla
where tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='BFD-SMG');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,orden,notas,visualizacion)
select t.id,v.nombre,v.rol,v.cantidad,v.largo,v.ancho,v.cantos::jsonb,
       v.tarugos,v.soportes,v.orden,v.notas,v.visualizacion::jsonb
from public.cot_tipos_mueble t
cross join (values
  ('base','caja','1','L-2*TC','P-0.70866-TB',
   '{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,10,
   'BASE B: profundidad estándar descontando 18 mm y el fondo.',
   '{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"0","confirmado":true}'),
  ('lateral','caja','2','A','P',
   '{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,20,
   'SIDE R/L B: mecanizado frontal superior 27 × 73 mm para gola metálica.',
   '{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"x":"I*(L-TC)","y":"0","z":"0","confirmado":true,"nota":"Par lateral con mecanizado frontal superior para gola metálica.","recorte":{"borde":"frontal_superior","profundidad":"27","alto":"73"}}'),
  ('refuerzo_delantero','caja','1','L-2*TC','80/25.4',
   '{"calibre":"19x0,45","largos":2,"anchos":2}',4,0,30,
   'REF DEL B: riel de 80 mm retirado 27 mm del frente.',
   '{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"x":"TC","y":"27","z":"A-TC","confirmado":true,"nota":"Riel delantero horizontal retirado 27 mm para la gola metálica."}'),
  ('refuerzo_trasero','refuerzo','2','L-2*TC','80/25.4',
   '{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,40,
   'RAIL TRASERO P: dos rieles de 80 mm, canto largo blanco.',
   '{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"x":"TC","y":"P-TC","z":"I*(A-H)","confirmado":true}'),
  ('entrepano','refuerzo','1','L-2*TC-0.03937',
   'P >= 23.5 ? 558.8/25.4 : (P <= 12.5 ? 266.7/25.4 : P-1.5)',
   '{"calibre":"19x0,45","largos":2,"anchos":2}',0,4,50,
   'SHELF 0 P: un entrepaño con 1 mm de holgura lateral.',
   '{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"confirmado":true}'),
  ('frente','frente','2','(L-2*RV)/2','A-30/25.4',
   '{"calibre":"22x1","largos":2,"anchos":2}',0,0,60,
   'DOOR R/L C: dos puertas con 30 mm libres para gola metálica.',
   '{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"x":"RV+I*W","y":"0","z":"0","confirmado":true}'),
  ('fondo','fondo','1','A-0.07874','L-0.62992',
   '{}',0,0,70,'BACKING F: fondo estándar de 6 mm.',
   '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":true}')
) as v(nombre,rol,cantidad,largo,ancho,cantos,tarugos,soportes,orden,notas,visualizacion)
where t.pref='BFD-SMG';

delete from public.cot_reglas_config
where tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='BFD-SMG');

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select destino.id,r.variable,r.condicion,r.valor,r.prioridad,r.activo,
       'Heredado de BFD-SM para BFD-SMG.'
from public.cot_reglas_config r
join public.cot_tipos_mueble origen on origen.id=r.tipo_mueble_id and origen.pref='BFD-SM'
join public.cot_tipos_mueble destino on destino.pref='BFD-SMG';

delete from public.cot_herrajes_plantilla
where tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='BFD-SMG');

insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select destino.id,h.rol,h.herraje_codigo,h.selector_key,h.formula_cantidad,h.orden,
       'Heredado de BFD-SM para BFD-SMG; se excluyen manijas.'
from public.cot_herrajes_plantilla h
join public.cot_tipos_mueble origen on origen.id=h.tipo_mueble_id and origen.pref='BFD-SM'
join public.cot_tipos_mueble destino on destino.pref='BFD-SMG'
where lower(coalesce(h.rol,'')) not like '%manija%'
  and lower(coalesce(h.rol,'')) not like '%handle%';

do $$
begin
  if (select count(*) from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref='BFD-SMG') <> 7 then
    raise exception 'BFD-SMG no quedó con sus siete plantillas de pieza';
  end if;
  if exists (select 1 from public.cot_piezas_plantilla p
             join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
             where t.pref='BFD-SMG' and p.nombre='gola_madera') then
    raise exception 'BFD-SMG no debe incluir gola de madera';
  end if;
end $$;
