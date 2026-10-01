-- Nueva hoja OW3018: la base queda a profundidad completa y aparece un shelf
-- móvil con cuatro soportes, delante del BACKING.
update public.cot_piezas_plantilla p
set formula_ancho = 'P',
    visualizacion = coalesce(p.visualizacion, '{}'::jsonb) - 'y'
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref='OW' and p.nombre='base';

delete from public.cot_piezas_plantilla p using public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id and t.pref='OW' and p.nombre='entrepano';

insert into public.cot_piezas_plantilla
  (tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
   cantos,tarugos,soportes,orden,visualizacion)
select t.id,'entrepano','refuerzo','1','L-1.417323','P-1.5',
  '{"calibre":"22x1","largos":2,"anchos":2,"forceCalibre":true}'::jsonb,
  0,4,45,
  '{"version":1,"funcion":"estante","plano":"XY","y":"P-TC-TB-D","confirmado":true,"nota":"Shelf móvil delante del BACKING."}'::jsonb
from public.cot_tipos_mueble t
where t.pref='OW';

update public.cot_reglas_config r
set valor='1', notas='OW3018 contiene un shelf móvil'
from public.cot_tipos_mueble t
where r.tipo_mueble_id=t.id and t.pref='OW' and r.variable='n_entrepanos';
