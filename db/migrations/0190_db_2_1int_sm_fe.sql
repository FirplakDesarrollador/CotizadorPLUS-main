-- DB-2-1INT-SM-FE: dos frentes exteriores, una gaveta interior y cajas de
-- madera para riel Full Extension. Conserva la fachada de DB-2-1INT-SM y usa
-- la construcción física validada de la familia DB-SM-FE.

insert into public.cot_tipos_mueble
  (pref,nombre_es,nombre_en,categoria,margen_key,descripcion_es,notas,activo,
   etiquetas_und,usa_carton,permite_agrupacion,pref_imperial,pref_metrico,familia_code)
values
  ('DB-2-1INT-SM-FE','Cajonera 2 gavetas + 1 interior con Gola y Full Extension',
   'Two-front drawer base with inner drawer, wood gola and full extension',
   'inferior','muebles',
   'DBXX-2-1INT-SM-FE: dos frentes exteriores iguales y una gaveta interior.',
   'Sin manijas ni barras. Dos cajas grandes, una caja interior pequeña y tres rieles RIELFE500.',
   true,4,true,true,'DB-2-1INT-SM-FE','DB-2-1INT-SM-FE','COC01')
on conflict (pref) do update set
  nombre_es=excluded.nombre_es,nombre_en=excluded.nombre_en,categoria=excluded.categoria,
  margen_key=excluded.margen_key,descripcion_es=excluded.descripcion_es,notas=excluded.notas,
  activo=true,etiquetas_und=excluded.etiquetas_und,usa_carton=excluded.usa_carton,
  permite_agrupacion=true,pref_imperial=excluded.pref_imperial,pref_metrico=excluded.pref_metrico,
  familia_code=excluded.familia_code,updated_at=now();

delete from public.cot_piezas_plantilla where tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='DB-2-1INT-SM-FE');
delete from public.cot_reglas_config where tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='DB-2-1INT-SM-FE');
delete from public.cot_herrajes_plantilla where tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='DB-2-1INT-SM-FE');

-- Parte de la carcasa FE vigente, incluyendo fondo y reglas de agrupación.
insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,visualizacion,
   modo_agrupacion,clave_fusion,formula_largo_grupo)
select destino.id,p.nombre,p.rol_tablero,p.formula_cantidad,p.formula_largo,p.formula_ancho,
  p.resta_largo,p.resta_ancho,p.cantos,p.tarugos,p.soportes,p.orden,p.notas,p.visualizacion,
  p.modo_agrupacion,p.clave_fusion,p.formula_largo_grupo
from public.cot_piezas_plantilla p
join public.cot_tipos_mueble origen on origen.id=p.tipo_mueble_id and origen.pref='DB-2S-SM-FE'
join public.cot_tipos_mueble destino on destino.pref='DB-2-1INT-SM-FE';

delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='DB-2-1INT-SM-FE'
  and (p.nombre like 'lateral_gaveta%' or p.nombre like 'trasero_gaveta%'
    or p.nombre like 'contraparche%' or p.nombre='base_gaveta'
    or p.nombre='frente' or p.nombre like 'frente_gaveta%');

update public.cot_piezas_plantilla p
set formula_cantidad=case when p.nombre in ('refuerzo_delantero','gola_madera') then '1' else p.formula_cantidad end,
    notas=case
      when p.nombre='refuerzo_delantero' then 'DB-2-1INT-SM-FE: un rail delantero superior.'
      when p.nombre='gola_madera' then 'DB-2-1INT-SM-FE: una Gola de madera; cuatro tarugos.'
      else p.notas end,
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='DB-2-1INT-SM-FE';

-- Las dos gavetas exteriores usan caja grande de 500 x 200 mm. La gaveta
-- interior usa caja pequeña de 500 x 100 mm y queda última en el orden de
-- montaje para vincularla al slot interior del visor.
insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,modo_agrupacion,orden,notas,visualizacion)
select t.id,v.nombre,v.rol,v.cant,v.largo,v.ancho,v.cantos::jsonb,v.tarugos,0,'local',v.orden,v.notas,v.visualizacion::jsonb
from public.cot_tipos_mueble t
cross join (values
  ('lateral_gaveta_grande','refuerzo','4','19.68504','7.87402','{"largos":2,"anchos":1,"calibre":"19x0,45"}',0,60,'Laterales de dos gavetas exteriores: 500 x 200 mm.','{"version":1,"funcion":"lateral_gaveta","plano":"YZ","intercambiar":true,"confirmado":true}'),
  ('trasero_gaveta_grande','refuerzo','2','L-3.38583','7.08661','{"largos":2,"anchos":0,"calibre":"19x0,45"}',6,70,'Traseros exteriores: L-86 mm x 180 mm; seis tarugos.','{"version":1,"funcion":"trasero_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'),
  ('contraparche_grande','refuerzo','2','L-3.38583','7.87402','{"largos":2,"anchos":0,"calibre":"19x0,45"}',6,80,'Contraplacas exteriores: L-86 mm x 200 mm; seis tarugos.','{"version":1,"funcion":"frente_interior","plano":"XZ","intercambiar":false,"confirmado":true}'),
  ('lateral_gaveta_pequena','refuerzo','2','19.68504','3.93701','{"largos":2,"anchos":1,"calibre":"19x0,45"}',0,90,'Laterales de la gaveta interior: 500 x 100 mm.','{"version":1,"funcion":"lateral_gaveta","plano":"YZ","intercambiar":true,"confirmado":true}'),
  ('trasero_gaveta_pequena','refuerzo','1','L-3.38583','3.14961','{"largos":2,"anchos":0,"calibre":"19x0,45"}',4,100,'Trasero interior: L-86 mm x 80 mm; cuatro tarugos.','{"version":1,"funcion":"trasero_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'),
  ('contraparche_pequeno','refuerzo','1','L-3.38583','3.93701','{"largos":2,"anchos":0,"calibre":"19x0,45"}',4,110,'Contraplaca interior: L-86 mm x 100 mm; cuatro tarugos.','{"version":1,"funcion":"frente_interior","plano":"XZ","intercambiar":false,"confirmado":true}'),
  ('base_gaveta','fondo','3','492/25.4','L-2.83465','{}',0,120,'Tres fondos FE de 492 mm x (L-72 mm).','{"version":1,"funcion":"base_gaveta","plano":"XY","intercambiar":true,"confirmado":true}'),
  ('frente_gaveta_exterior','frente','2','L-RV','(A-(n_cajones-n_cajones_ocultos)*RV-gola*2.11024)/(n_cajones-n_cajones_ocultos)','{"largos":2,"anchos":2,"calibre":"22x1"}',0,130,'Dos frentes exteriores iguales; 351 x 555,6 mm para DB22.','{"version":1,"funcion":"frente_gaveta","plano":"XZ","intercambiar":false,"confirmado":true}'),
  ('frente_gaveta_interior','frente','1','L-2*TC-RV','100/25.4','{"largos":2,"anchos":2,"calibre":"22x1"}',0,140,'Frente interior de 100 mm, retirado detrás del frente superior.','{"version":1,"funcion":"frente_interior","plano":"XZ","intercambiar":false,"confirmado":true}')
) as v(nombre,rol,cant,largo,ancho,cantos,tarugos,orden,notas,visualizacion)
where t.pref='DB-2-1INT-SM-FE';

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select t.id,v.variable,'true',v.valor,5,true,v.notas
from public.cot_tipos_mueble t
cross join (values
  ('n_cajones','3','Dos gavetas exteriores y una interior.'),
  ('n_cajones_pequenos','1','La gaveta interior usa caja pequeña FE.'),
  ('n_cajones_ocultos','1','Una gaveta interior detrás del frente superior.'),
  ('n_puertas','0','Sin puertas.'),('n_entrepanos','0','Sin entrepaños.'),
  ('n_patas','4','Mueble inferior: cuatro patas.'),
  ('n_barras','0','Las cajas FE no llevan barras.'),
  ('gola','1','Una Gola de madera entre los frentes exteriores.')
) as v(variable,valor,notas)
where t.pref='DB-2-1INT-SM-FE';

insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select t.id,v.rol,v.codigo,v.selector,v.cant,v.orden,v.notas
from public.cot_tipos_mueble t
cross join (values
  ('pata','PATA10AJUST','pata','n_patas',10,'Cuatro patas ajustables.'),
  ('tornillo','TORNILLO858','tornillo','n_patas*4',20,'Cuatro tornillos por pata.'),
  ('riel','RIELFE500','riel_fe','n_cajones',30,'Un par Full Extension de 500 mm por gaveta.')
) as v(rol,codigo,selector,cant,orden,notas)
where t.pref='DB-2-1INT-SM-FE';

do $$
declare v_tipo uuid;
begin
  select id into v_tipo from public.cot_tipos_mueble where pref='DB-2-1INT-SM-FE';
  if v_tipo is null then raise exception 'No se creó DB-2-1INT-SM-FE'; end if;
  if (select count(*) from public.cot_piezas_plantilla where tipo_mueble_id=v_tipo and nombre='lateral_gaveta_grande') <> 1
    or (select formula_cantidad from public.cot_piezas_plantilla where tipo_mueble_id=v_tipo and nombre='lateral_gaveta_grande') <> '4'
    or (select formula_cantidad from public.cot_piezas_plantilla where tipo_mueble_id=v_tipo and nombre='lateral_gaveta_pequena') <> '2' then
    raise exception 'DB-2-1INT-SM-FE no tiene dos cajas grandes y una pequeña';
  end if;
  if (select formula_cantidad from public.cot_herrajes_plantilla where tipo_mueble_id=v_tipo and herraje_codigo='RIELFE500') <> 'n_cajones' then
    raise exception 'DB-2-1INT-SM-FE no tiene tres rieles FE parametrizados';
  end if;
end $$;
