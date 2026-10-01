-- Corrige el alcance de 0114. Las plantillas individuales se restauran para
-- todas las familias B; quitar fondo y recuperar TB corresponde exclusivamente
-- al calculo temporal de grupos SM, no a los datos persistidos.

update public.cot_piezas_plantilla p
set formula_ancho = case
      when p.formula_ancho = 'P-0.70866' then 'P-0.70866-TB'
      when p.formula_ancho = 'removible ? P-TC : (P-0.70866)' then 'removible ? P-TC : (P-0.70866-TB)'
      else p.formula_ancho
    end,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.categoria = 'inferior'
  and t.pref ilike '%B%'
  and p.nombre = 'base'
  and p.formula_ancho in ('P-0.70866', 'removible ? P-TC : (P-0.70866)');

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,visualizacion,
   modo_agrupacion,clave_fusion,formula_largo_grupo)
select t.id,'fondo','fondo',v.cantidad,v.largo,v.ancho,0,0,v.cantos::jsonb,0,0,
       v.orden,v.notas,v.visualizacion::jsonb,v.modo,v.clave,v.formula_grupo
from public.cot_tipos_mueble t
join (values
  ('B','1','A-0.07874','L-0.62992','{}',100,'Fondo | restaurado por 0115','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','continua','fondo','LG-TC'),
  ('B-FE','1','A-0.07874','L-0.62992','{}',130,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":true}','continua','fondo','LG-TC'),
  ('BBL','1','A-0.07874','L-0.62992','{}',120,'Fondo/backing','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','local',null,null),
  ('BBLFD','1','A-0.07874','L-0.62992','{}',80,'Fondo/backing','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','local',null,null),
  ('BFD','1','A-0.07874','L-0.62992','{}',70,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','continua','fondo','LG-TC'),
  ('BFD-SM','1','A-0.07874','L-0.62992','{}',80,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true}','continua','fondo','LG-TC'),
  ('BLS','2','L-4.94882','A-TC','{"calibre":"19x0,45","largos":0,"anchos":0}',20,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":false,"x":"I==0?0:EP","y":"I==0?L-EP:0","giro":"I==0?0:90","confirmado":false,"nota":"Respaldos perpendiculares de esquina; montaje inferido, confirmar recortes."}','local',null,null),
  ('BMW','1','9.50079','L-0.86614','{"calibre":"19x0,45","largos":0,"anchos":0}',80,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','local',null,null),
  ('BOMH','1','A-0.07874','L-0.62992','{}',60,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','local',null,null),
  ('DB','1','A-0.07874','L-0.62992','{}',80,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','continua','fondo','LG-TC'),
  ('DB-2S-SM','1','A-0.07874','L-0.62992','{}',80,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true}','continua','fondo','LG-TC'),
  ('DB-2-SM','1','A-0.07874','L-0.62992','{}',80,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true}','continua','fondo','LG-TC'),
  ('DB-3-SM','1','A-0.07874','L-0.62992','{}',80,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true}','continua','fondo','LG-TC'),
  ('DB-2S-SM-FE','1','A-0.07874','L-0.62992','{}',200,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true}','continua','fondo','LG-TC'),
  ('DB-2-SM-FE','1','A-0.07874','L-0.62992','{}',200,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true}','continua','fondo','LG-TC'),
  ('DB-3-SM-FE','1','A-0.07874','L-0.62992','{}',200,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true}','continua','fondo','LG-TC'),
  ('SB-SM','1','A-0.07874','L-0.62992','{}',90,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"y":"P-TC-TB","confirmado":true}','continua','fondo','LG-TC'),
  ('SBFD','1','A-0.07874','L-0.62992','{}',60,'Fondo','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','continua','fondo','LG-TC'),
  ('SBFD-SM','1','A-0.07874','L-0.62992','{}',80,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true}','continua','fondo','LG-TC'),
  ('SDB','1','A-0.07874','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}',70,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','local',null,null),
  ('UB','1','A-0.07874','L-0.62992','{}',100,'Fondo | restaurado por 0115','{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','continua','fondo','LG-TC'),
  ('UB-FE','1','A-0.07874','L-0.62992','{}',130,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":true}','continua','fondo','LG-TC'),
  ('UBFD','1','A-0.07874','L-0.62992','{}',70,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','continua','fondo','LG-TC'),
  ('UDB','1','A-0.07874','L-0.62992','{"calibre":"19x0,45","largos":0,"anchos":0}',100,null,'{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":true,"confirmado":false}','local',null,null)
) as v(pref,cantidad,largo,ancho,cantos,orden,notas,visualizacion,modo,clave,formula_grupo)
  on t.pref=v.pref
where not exists (
  select 1 from public.cot_piezas_plantilla p
  where p.tipo_mueble_id=t.id and p.nombre='fondo'
);
