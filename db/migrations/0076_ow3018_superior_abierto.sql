-- Hoja de ruta: OW3018 MBLE SUP COC SIN PUERTAS (L=30in, A=18in, P=12in).
-- OW es una carcasa abierta: no usa puertas, herrajes ni cartón protector.
insert into public.cot_tipos_mueble
  (pref,nombre_es,categoria,margen_key,etiquetas_und,usa_carton,permite_agrupacion,
   pref_imperial,pref_metrico,familia_code,activo)
values
  ('OW','Mueble superior abierto (sin puertas)','superior','muebles',4,false,true,
   'OW','OW','COC01',true)
on conflict (pref) do update set
  nombre_es=excluded.nombre_es, categoria=excluded.categoria, margen_key=excluded.margen_key,
  etiquetas_und=excluded.etiquetas_und, usa_carton=false, permite_agrupacion=true,
  pref_imperial=excluded.pref_imperial, pref_metrico=excluded.pref_metrico,
  familia_code=excluded.familia_code, activo=true;

delete from public.cot_piezas_plantilla p using public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref='OW';
delete from public.cot_reglas_config r using public.cot_tipos_mueble t
where r.tipo_mueble_id=t.id and t.pref='OW';
delete from public.cot_herrajes_plantilla h using public.cot_tipos_mueble t
where h.tipo_mueble_id=t.id and t.pref='OW';

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,orden,visualizacion)
select t.id,v.nombre,v.rol,v.cantidad,v.largo,v.ancho,v.cantos::jsonb,v.tarugos,v.soportes,v.orden,v.visualizacion::jsonb
from public.cot_tipos_mueble t
join (values
  -- BASE R20L: 726 x 434.8mm, tal como aparece en la hoja suministrada.
  ('base','caja','1','L-2*TC','A-0.88189','{"calibre":"22x1","largos":2,"anchos":2,"forceCalibre":true}',8,0,10,
   '{"version":1,"funcion":"base","plano":"XY","confirmado":true}'),
  ('tapa','caja','1','L-2*TC','P','{"calibre":"22x1","largos":2,"anchos":0,"forceCalibre":true}',8,0,20,
   '{"version":1,"funcion":"tapa","plano":"XY","confirmado":true}'),
  ('lateral','caja','2','A','P','{"calibre":"22x1","largos":2,"anchos":2,"forceCalibre":true}',0,0,30,
   '{"version":1,"funcion":"lateral","plano":"YZ","confirmado":true}'),
  ('refuerzo_trasero','refuerzo','2','L-2*TC','3.14961','{"calibre":"22x1","largos":2,"anchos":0,"forceCalibre":true}',4,0,40,
   '{"version":1,"funcion":"travesano_posterior","plano":"XZ","confirmado":true}'),
  -- BACKING F conserva el orden físico de la hoja: alto útil x largo útil.
  ('fondo','fondo','1','A-0.866142','L-0.866142','{}',0,0,50,
   '{"version":1,"funcion":"respaldo","plano":"XZ","y":"P-TC-TB","confirmado":true}')
) as v(nombre,rol,cantidad,largo,ancho,cantos,tarugos,soportes,orden,visualizacion) on true
where t.pref='OW';

insert into public.cot_reglas_config (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select t.id,v.variable,'true',v.valor,10,true,v.notas
from public.cot_tipos_mueble t
join (values
  ('n_puertas','0','OW es una carcasa abierta sin puertas'),
  ('n_cajones','0','OW no incorpora gavetas'),
  ('n_entrepanos','0','OW3018 no trae entrepaños'),
  ('n_patas','0','OW es un mueble superior')
) as v(variable,valor,notas) on true
where t.pref='OW';
