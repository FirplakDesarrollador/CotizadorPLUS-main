-- W-MO-HOOD: variante paramétrica de UW con vano inferior para microondas/campana.
-- MO y HOOD se expresan internamente en pulgadas, como el resto de dimensiones.

insert into public.cot_tipos_mueble (
  pref,nombre_es,nombre_en,categoria,margen_key,margen_pct,familia_code,
  descripcion_es,descripcion_en,notas,activo,etiquetas_und,usa_carton,
  pref_imperial,pref_metrico,permite_agrupacion
)
select
  'W-MO-HOOD','Mueble superior MO + HOOD','Wall cabinet microwave + hood',
  categoria,margen_key,margen_pct,familia_code,
  'Mueble superior con entrepaño fijo, base elevada y espacio inferior libre.',
  'Wall cabinet with fixed shelf, raised base and open lower space.',
  'Basado en UW. MO define la distancia base–entrepaño fijo y HOOD la distancia final del lateral–base.',
  true,etiquetas_und,usa_carton,'W-MO-HOOD','W-MO-HOOD',permite_agrupacion
from public.cot_tipos_mueble
where pref='UW'
on conflict (pref) do update set
  nombre_es=excluded.nombre_es,nombre_en=excluded.nombre_en,categoria=excluded.categoria,
  margen_key=excluded.margen_key,margen_pct=excluded.margen_pct,familia_code=excluded.familia_code,
  descripcion_es=excluded.descripcion_es,descripcion_en=excluded.descripcion_en,
  notas=excluded.notas,activo=true,etiquetas_und=excluded.etiquetas_und,
  usa_carton=excluded.usa_carton,pref_imperial=excluded.pref_imperial,
  pref_metrico=excluded.pref_metrico,permite_agrupacion=excluded.permite_agrupacion,
  updated_at=now();

delete from public.cot_piezas_plantilla
where tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='W-MO-HOOD');

insert into public.cot_piezas_plantilla (
  tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
  resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,
  modo_agrupacion,clave_fusion,formula_largo_grupo,visualizacion
)
select
  destino.id,p.nombre,p.rol_tablero,p.formula_cantidad,p.formula_largo,p.formula_ancho,
  p.resta_largo,p.resta_ancho,p.cantos,p.tarugos,p.soportes,p.orden,p.notas,
  p.modo_agrupacion,p.clave_fusion,p.formula_largo_grupo,p.visualizacion
from public.cot_piezas_plantilla p
join public.cot_tipos_mueble origen on origen.id=p.tipo_mueble_id and origen.pref='UW'
join public.cot_tipos_mueble destino on destino.pref='W-MO-HOOD';

-- Solo la base toma la profundidad extendida de OW-MO: P + 130 mm.
update public.cot_piezas_plantilla p
set formula_ancho='P+5.11811',
    visualizacion=jsonb_build_object(
      'version',1,'funcion','base','plano','XY','intercambiar',false,
      'z','HOOD','confirmado',true,
      'nota','Base elevada HOOD mm desde el final inferior de los laterales.'
    ),
    notas='Profundidad de base heredada de OW-MO: P + 130 mm.',updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='W-MO-HOOD' and p.nombre='base';

update public.cot_piezas_plantilla p
set formula_ancho='A-MO-HOOD-RV',
    visualizacion=jsonb_build_object(
      'version',1,'funcion','frente','plano','XZ','intercambiar',false,
      'z','MO+HOOD','confirmado',true,
      'nota','Puerta desde el entrepaño fijo hasta arriba, con luz vertical de 3,2 mm.'
    ),
    notas='Alto de puerta = A - MO - HOOD - RV.',updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='W-MO-HOOD' and p.nombre='frente';

update public.cot_piezas_plantilla p
set visualizacion=jsonb_build_object(
      'version',1,'funcion','estante','plano','XY','intercambiar',false,
      'z','MO+HOOD','confirmado',true,
      'nota','Entrepaño fijo que limita las puertas y el espacio inferior libre.'
    ),updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='W-MO-HOOD' and p.nombre='entrepano_fijo';

-- Los entrepaños móviles se distribuyen exclusivamente en la zona con puertas.
update public.cot_piezas_plantilla p
set visualizacion=jsonb_build_object(
      'version',1,'funcion','estante','plano','XY','intercambiar',false,
      'z','MO+HOOD+H+40+I*((A-(MO+HOOD+H+40)-TC-H)/N)','confirmado',true,
      'nota','Entrepaños interiores distribuidos sobre el entrepaño fijo.'
    ),updated_at=now()
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id and t.pref='W-MO-HOOD' and p.nombre='entrepano';

delete from public.cot_reglas_config
where tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='W-MO-HOOD');

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select destino.id,r.variable,r.condicion,r.valor,r.prioridad,r.activo,
  concat_ws(' ',r.notas,'Heredado de UW.')
from public.cot_reglas_config r
join public.cot_tipos_mueble origen on origen.id=r.tipo_mueble_id and origen.pref='UW'
join public.cot_tipos_mueble destino on destino.pref='W-MO-HOOD';

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select id,'MO','true','200/25.4',1,true,'Valor inicial editable: 200 mm entre base y entrepaño fijo.'
from public.cot_tipos_mueble where pref='W-MO-HOOD'
union all
select id,'HOOD','true','0',1,true,'Valor inicial editable: distancia entre final inferior del lateral y base.'
from public.cot_tipos_mueble where pref='W-MO-HOOD';

delete from public.cot_herrajes_plantilla
where tipo_mueble_id=(select id from public.cot_tipos_mueble where pref='W-MO-HOOD');

insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select destino.id,h.rol,h.herraje_codigo,h.selector_key,h.formula_cantidad,h.orden,
  concat_ws(' ',h.notas,'Heredado de UW.')
from public.cot_herrajes_plantilla h
join public.cot_tipos_mueble origen on origen.id=h.tipo_mueble_id and origen.pref='UW'
join public.cot_tipos_mueble destino on destino.pref='W-MO-HOOD';

do $$
begin
  if not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='W-MO-HOOD' and p.nombre='base' and p.formula_ancho='P+5.11811'
  ) or not exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref='W-MO-HOOD' and p.nombre='frente' and p.formula_ancho='A-MO-HOOD-RV'
  ) then
    raise exception 'W-MO-HOOD no quedó configurado correctamente';
  end if;
end $$;
