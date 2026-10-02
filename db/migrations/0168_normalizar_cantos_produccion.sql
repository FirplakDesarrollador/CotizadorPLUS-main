-- Normaliza cantos según las reglas de producción auditadas.
-- Base/tapa/refuerzos/Gola: dos lados largos.
update public.cot_piezas_plantilla
set cantos=jsonb_set(cantos,'{largos}','2'::jsonb,true), updated_at=now()
where lower(nombre) like 'refuerzo%'
   or lower(nombre)='gola_madera'
   or lower(nombre)='base'
   or lower(nombre)='tapa';

-- Frentes, laterales y laterales de gaveta: cuatro lados.
update public.cot_piezas_plantilla
set cantos=jsonb_set(jsonb_set(cantos,'{largos}','2'::jsonb,true),'{anchos}','2'::jsonb,true), updated_at=now()
where lower(nombre) in ('frente','lateral','lateral_gaveta');

-- Entrepaños que quedaban un milímetro por debajo de la base: cuatro lados.
update public.cot_piezas_plantilla
set cantos=jsonb_set(jsonb_set(cantos,'{largos}','2'::jsonb,true),'{anchos}','2'::jsonb,true), updated_at=now()
where lower(nombre)='entrepano'
  and (coalesce((cantos->>'largos')::int,0)<>2 or coalesce((cantos->>'anchos')::int,0)<>2);

-- Fondo/base de gaveta: dos anchos con canto.
update public.cot_piezas_plantilla
set cantos=jsonb_set(cantos,'{anchos}','2'::jsonb,true), updated_at=now()
where lower(nombre) in ('base_gaveta','fondo_gaveta');

-- Trasero Tandem: 68 mm lleva un largo; 183 mm lleva un largo y dos anchos.
update public.cot_piezas_plantilla p
set cantos=jsonb_set(jsonb_set(p.cantos,'{largos}','1'::jsonb,true),'{anchos}','0'::jsonb,true), updated_at=now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and lower(p.nombre)='trasero_gaveta'
  and (p.formula_ancho ilike '%68/25.4%' or p.formula_ancho ilike '%2.677%');

update public.cot_piezas_plantilla p
set cantos=jsonb_set(jsonb_set(p.cantos,'{largos}','1'::jsonb,true),'{anchos}','2'::jsonb,true), updated_at=now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and lower(p.nombre)='trasero_gaveta'
  and (p.formula_ancho ilike '%183/25.4%' or p.formula_ancho ilike '%7.204%');

-- Fórmulas condicionales 68/183 se cortan normalmente como 183; el caso 68
-- conserva el ancho adicional de manera explícita cuando tenga fórmula fija.
update public.cot_piezas_plantilla p
set cantos=jsonb_set(jsonb_set(p.cantos,'{largos}','1'::jsonb,true),'{anchos}','2'::jsonb,true), updated_at=now()
where lower(p.nombre)='trasero_gaveta'
  and p.formula_ancho ilike '%68/25.4%'
  and p.formula_ancho ilike '%183/25.4%';

-- Trasero de gaveta FE: dos lados largos.
update public.cot_piezas_plantilla p
set cantos=jsonb_set(p.cantos,'{largos}','2'::jsonb,true), updated_at=now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref ilike '%-FE'
  and lower(p.nombre)='trasero_gaveta';
