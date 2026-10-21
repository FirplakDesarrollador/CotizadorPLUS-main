-- Corrige el montaje y la regla de entrepanos de W-MO-HOOD.
-- Las dimensiones del motor permanecen en pulgadas; las coordenadas visuales
-- se evaluan en milimetros.

update public.cot_piezas_plantilla p
set visualizacion = jsonb_build_object(
      'version',1,'funcion','base','plano','XY','intercambiar',false,
      'y','P-D','z','HOOD','confirmado',true,
      'nota','Alineada con la parte posterior del lateral; los 130 mm adicionales salen hacia el frente.'
    ),
    notas='Profundidad de base heredada de OW-MO: P + 130 mm, extendida hacia el frente.',
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='W-MO-HOOD' and p.nombre='base';

update public.cot_piezas_plantilla p
set formula_largo='A-HOOD-0.62992',
    visualizacion=jsonb_build_object(
      'version',1,'funcion','respaldo','plano','XZ','intercambiar',true,
      'y','P-TC-TB','z','HOOD','confirmado',true,
      'nota','El fondo inicia a la altura de la base y no baja hasta el final de los laterales.'
    ),
    notas='Alto limitado desde la base elevada hasta la zona superior.',
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='W-MO-HOOD' and p.nombre='fondo';

update public.cot_piezas_plantilla p
set visualizacion=jsonb_build_object(
      'version',1,'funcion','estante','plano','XY','intercambiar',false,
      'y','0','z','MO+HOOD','confirmado',true,
      'nota','Entrepaño fijo alineado al frente del lateral, justo detras de los frentes.'
    ),
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='W-MO-HOOD' and p.nombre='entrepano_fijo';

update public.cot_piezas_plantilla p
set visualizacion=jsonb_build_object(
      'version',1,'funcion','estante','plano','XY','intercambiar',false,
      'z','MO+HOOD+TC+(I+1)*(A-MO-HOOD-2*TC-H)/(N+1)',
      'confirmado',true,
      'nota','Distribuido en la altura interna entre el entrepaño fijo y la tapa.'
    ),
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='W-MO-HOOD' and p.nombre='entrepano';

update public.cot_piezas_plantilla p
set visualizacion=jsonb_build_object(
      'version',1,'funcion','travesano_posterior','plano','XZ','intercambiar',false,
      'z','I===0 ? A-H : HOOD+TC','confirmado',true,
      'nota','Refuerzo superior bajo la tapa y refuerzo inferior justo sobre la base elevada.'
    ),
    updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='W-MO-HOOD' and p.nombre='refuerzo_trasero';

delete from public.cot_reglas_config
where tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='W-MO-HOOD')
  and variable='n_entrepanos';

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select t.id,'n_entrepanos',r.condicion,r.valor,r.prioridad,true,r.notas
from public.cot_tipos_mueble t
cross join (values
  ('A-MO-HOOD <= 16','1',1,'Sin entrepaños móviles: solo el fijo.'),
  ('A-MO-HOOD <= 24','2',2,'Un entrepaño móvil más el fijo.'),
  ('A-MO-HOOD <= 36','3',3,'Dos entrepaños móviles más el fijo.'),
  ('true','4',4,'Tres entrepaños móviles más el fijo.')
) as r(condicion,valor,prioridad,notas)
where t.pref='W-MO-HOOD';

do $$
begin
  if not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='W-MO-HOOD' and p.nombre='base'
      and p.visualizacion->>'y'='P-D'
  ) or not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='W-MO-HOOD' and p.nombre='fondo'
      and p.formula_largo='A-HOOD-0.62992'
  ) then
    raise exception 'Las correcciones de montaje W-MO-HOOD no quedaron aplicadas';
  end if;
end $$;
