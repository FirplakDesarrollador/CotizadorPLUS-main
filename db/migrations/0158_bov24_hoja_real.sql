-- BOV24 según hoja de ruta: siete piezas físicas en cinco renglones.
do $$
declare
  v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='BOV';
  if v is null then raise exception 'No existe la tipología BOV'; end if;

  delete from public.cot_piezas_plantilla where tipo_mueble_id=v;

  insert into public.cot_piezas_plantilla
    (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
     cantos,tarugos,soportes,orden,notas,visualizacion)
  values
    (v,'base','caja','1','L-2*TC','P-TC',
     '{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,10,'BASE B.',
     '{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"z":"0","confirmado":true}'),
    (v,'lateral','caja','2','A','P',
     '{"calibre":"19x0,45","largos":2,"anchos":2}',0,0,20,'SIDE R/L B.',
     '{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"confirmado":true}'),
    (v,'refuerzo_trasero','refuerzo','2','L-2*TC','80/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,30,'Dos RAIL TRASERO P.',
     '{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"z":"I===0 ? TC : A-H","confirmado":true}'),
    (v,'refuerzo_delantero','caja','1','L-2*TC','80/25.4',
     '{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,40,'RIEL DEL B.',
     '{"version":1,"funcion":"travesano_frontal","plano":"XZ","intercambiar":false,"y":"0","z":"A-H","confirmado":true}'),
    (v,'frente','frente','1','124/25.4','L-RV',
     '{"calibre":"22x1","largos":2,"anchos":2}',0,0,50,'FRONT OVEN C.',
     '{"version":1,"funcion":"frente","plano":"XZ","intercambiar":true,"y":"-EP","z":"0","confirmado":true}');

  update public.cot_tipos_mueble set updated_at=now() where id=v;

  if (select count(*) from public.cot_piezas_plantilla where tipo_mueble_id=v) <> 5
     or (select sum(formula_cantidad::int) from public.cot_piezas_plantilla where tipo_mueble_id=v) <> 7
     or not exists (
       select 1 from public.cot_piezas_plantilla
       where tipo_mueble_id=v and nombre='refuerzo_trasero' and formula_cantidad='2'
         and formula_largo='L-2*TC' and formula_ancho='80/25.4'
     ) then
    raise exception 'El despiece BOV no coincide con las 7 piezas de la hoja BOV24';
  end if;
end $$;
