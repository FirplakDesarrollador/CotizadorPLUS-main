-- TW/W-SM-HOOD desde TW-SM-HOOD.iges y tabla de corte del usuario.
-- El servidor convierte A a Alto-HOOD; HOOD/FREE permanecen en pulgadas.
-- Fondo según tabla (534x634 a carcasa 550, ancho 650). Frente falso HOOD-FREE.
begin;

insert into public.cot_tipos_mueble
 (pref,pref_imperial,pref_metrico,nombre_es,nombre_en,categoria,margen_key,
  activo,permite_agrupacion,etiquetas_und,usa_carton,descripcion_es,notas)
select v.pref,v.pref,v.pref,v.nombre,v.nombre,'superior',t.margen_key,
 true,true,t.etiquetas_und,t.usa_carton,
 'Superior con gola, entrepaño fijo y frente falso paramétrico para extractor.',
 'Carcasa=Alto-HOOD. Frente falso=HOOD-FREE. FREE: parte visible del extractor. Fuente TW-SM-HOOD.iges.'
from public.cot_tipos_mueble t
cross join (values
 ('TW-SM-HOOD','Superior SM para extractor, una puerta'),
 ('W-SM-HOOD','Superior SM para extractor, dos puertas')
) v(pref,nombre)
where t.pref='W-SM'
on conflict(pref) do update set
 pref_imperial=excluded.pref_imperial,pref_metrico=excluded.pref_metrico,
 nombre_es=excluded.nombre_es,nombre_en=excluded.nombre_en,categoria=excluded.categoria,
 margen_key=excluded.margen_key,activo=true,permite_agrupacion=true,
 descripcion_es=excluded.descripcion_es,notas=excluded.notas,updated_at=now();

delete from public.cot_piezas_plantilla
where tipo_mueble_id in (select id from public.cot_tipos_mueble where pref in ('TW-SM-HOOD','W-SM-HOOD'));

insert into public.cot_piezas_plantilla
 (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
  cantos,tarugos,soportes,orden,modo_agrupacion,clave_fusion,formula_largo_grupo,visualizacion,notas)
select t.id,v.nombre,v.rol,v.cantidad,v.largo,v.ancho,v.cantos::jsonb,
 v.tarugos,v.soportes,v.orden,v.modo,v.clave,v.grupo,v.montaje::jsonb,
 'Derivada de TW-SM-HOOD.iges; fondo y HOOD/FREE según aclaración del usuario.'
from public.cot_tipos_mueble t
cross join (values
 ('base','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,10,'continua','base_tapa','LG-(2*TC)',
  '{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"0","confirmado":true}'),
 ('tapa','caja','1','L-2*TC','P','{"calibre":"19x0,45","largos":2,"anchos":0}',8,0,20,'continua','tapa','LG-(2*TC)',
  '{"version":1,"funcion":"tapa","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"A-TC","confirmado":true}'),
 ('lateral','caja','2','A','P','{"calibre":"19x0,45","largos":2,"anchos":0}',0,0,30,'lateral_compartido',null,null,
  '{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"x":"I*(L-TC)","y":"0","z":"0","confirmado":true}'),
 ('refuerzo_trasero','refuerzo','2','L-2*TC','80/25.4','{"calibre":"19x0,45","largos":0,"anchos":2}',4,0,40,'continua','refuerzo_trasero','LG-(2*TC)',
  '{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":false,"x":"TC","y":"P-TC","z":"I===0 ? TC : A-TC-H","confirmado":true}'),
 ('gola_madera','caja','1','L-2*TC','80/25.4','{"calibre":"19x0,45","largos":0,"anchos":2}',4,0,50,'continua_opcional','gola_hood','LG-(2*TC)',
  '{"version":1,"funcion":"gola","plano":"XZ","intercambiar":false,"x":"TC","y":"20","z":"120.85","confirmado":true}'),
 ('entrepano_fijo','refuerzo','1','L-2*TC','P-23/25.4','{"calibre":"19x0,45","largos":2,"anchos":0}',4,0,60,'local',null,null,
  '{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"x":"TC","y":"0","z":"200.85","confirmado":true}'),
 ('frente','frente','n_puertas','(L-n_puertas*RV)/n_puertas','A-179.15/25.4','{"calibre":"19x2","largos":2,"anchos":2}',0,0,70,'local',null,null,
  '{"version":1,"funcion":"frente","plano":"XZ","intercambiar":false,"x":"1.6+I*(W+3.2)","y":"-TF","z":"175.95","confirmado":true}'),
 ('frente_falso','frente','HOOD > FREE ? 1 : 0','L-RV','HOOD-FREE','{"calibre":"19x2","largos":2,"anchos":2}',0,0,80,'local',null,null,
  '{"version":1,"funcion":"frente_falso","plano":"XZ","intercambiar":false,"x":"1.6","y":"-TF","z":"-H","confirmado":true,"nota":"Cubre HOOD-FREE bajo la base; FREE queda visible debajo."}'),
 ('fondo','fondo','1','A-16/25.4','L-16/25.4','{}',0,0,90,'continua','fondo','LG-16/25.4',
  '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"x":"8","y":"P-TC-TB-1","z":"8","confirmado":true}')
) v(nombre,rol,cantidad,largo,ancho,cantos,tarugos,soportes,orden,modo,clave,grupo,montaje)
where t.pref in ('TW-SM-HOOD','W-SM-HOOD');

delete from public.cot_reglas_config
where tipo_mueble_id in (select id from public.cot_tipos_mueble where pref in ('TW-SM-HOOD','W-SM-HOOD'));
insert into public.cot_reglas_config(tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select id,'n_puertas','true',case when pref='TW-SM-HOOD' then '1' else '2' end,0,true,'Única diferencia entre TW y W.'
from public.cot_tipos_mueble where pref in ('TW-SM-HOOD','W-SM-HOOD')
union all
select id,'n_entrepanos','true','1',0,true,'Un entrepaño fijo, sin entrepaños móviles.'
from public.cot_tipos_mueble where pref in ('TW-SM-HOOD','W-SM-HOOD');

delete from public.cot_herrajes_plantilla
where tipo_mueble_id in (select id from public.cot_tipos_mueble where pref in ('TW-SM-HOOD','W-SM-HOOD'));
insert into public.cot_herrajes_plantilla(tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select t.id,h.rol,h.herraje_codigo,h.selector_key,h.formula_cantidad,h.orden,'Herrajes SM por puerta; frente falso sin bisagras.'
from public.cot_herrajes_plantilla h
join public.cot_tipos_mueble origen on origen.id=h.tipo_mueble_id and origen.pref='W-SM'
cross join public.cot_tipos_mueble t
where t.pref in ('TW-SM-HOOD','W-SM-HOOD');

do $$ begin
 if (select count(*) from public.cot_piezas_plantilla p join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
     where t.pref in ('TW-SM-HOOD','W-SM-HOOD'))<>18
 then raise exception 'TW/W-SM-HOOD deben contener nueve plantillas cada una'; end if;
end $$;
commit;
