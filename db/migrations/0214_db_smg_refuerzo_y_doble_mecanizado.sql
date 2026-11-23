-- DB-SMG: un solo refuerzo delantero horizontal a 27 mm del frente y dos
-- mecanizados 27 x 73 mm en cada lateral. No modifica tipos ni sus IDs.

begin;

with objetivos(pref) as (
  values
    ('DB-2S-SMG'),('DB-2-SMG'),('DB-2-1INT-SMG'),('DB-3-SMG'),
    ('DB-2S-SMG-FE'),('DB-2-SMG-FE'),('DB-2-1INT-SMG-FE'),('DB-3-SMG-FE'),
    ('DB-2S-SMG-SF'),('DB-2-SMG-SF'),('DB-2-1INT-SMG-SF'),('DB-3-SMG-SF')
)
update public.cot_piezas_plantilla p
set formula_cantidad = '1',
    visualizacion = jsonb_build_object(
      'version',1,
      'funcion','travesano_frontal',
      'plano','XY',
      'intercambiar',false,
      'x','TC',
      'y','27',
      'z','A-H',
      'confirmado',true,
      'nota','Refuerzo delantero horizontal, a 27 mm del frente.'
    ),
    notas = 'Unico refuerzo delantero horizontal, retirado 27 mm desde el frente.'
from public.cot_tipos_mueble t
join objetivos o on o.pref=t.pref
where p.tipo_mueble_id=t.id
  and lower(p.nombre)='refuerzo_delantero';

with objetivos(pref) as (
  values
    ('DB-2S-SMG'),('DB-2-SMG'),('DB-2-1INT-SMG'),('DB-3-SMG'),
    ('DB-2S-SMG-FE'),('DB-2-SMG-FE'),('DB-2-1INT-SMG-FE'),('DB-3-SMG-FE'),
    ('DB-2S-SMG-SF'),('DB-2-SMG-SF'),('DB-2-1INT-SMG-SF'),('DB-3-SMG-SF')
)
update public.cot_piezas_plantilla p
set visualizacion = (coalesce(p.visualizacion,'{}'::jsonb) - 'recorte') || jsonb_build_object(
      'version',1,
      'funcion','lateral',
      'plano','YZ',
      'intercambiar',false,
      'x','I*(L-TC)',
      'y','0',
      'z','0',
      'confirmado',true,
      'nota','Par lateral con dos mecanizados frontales de 27 x 73 mm para gola metalica.',
      'recortes',jsonb_build_array(
        jsonb_build_object('borde','frontal_superior','profundidad','27','alto','73'),
        jsonb_build_object('borde','frontal_nivel_gaveta','profundidad','27','alto','73')
      )
    ),
    notas = 'Par lateral con dos mecanizados frontales de 27 x 73 mm para gola metalica.'
from public.cot_tipos_mueble t
join objetivos o on o.pref=t.pref
where p.tipo_mueble_id=t.id
  and lower(p.nombre)='lateral';

do $$
declare
  v_objetivos text[] := array[
    'DB-2S-SMG','DB-2-SMG','DB-2-1INT-SMG','DB-3-SMG',
    'DB-2S-SMG-FE','DB-2-SMG-FE','DB-2-1INT-SMG-FE','DB-3-SMG-FE',
    'DB-2S-SMG-SF','DB-2-SMG-SF','DB-2-1INT-SMG-SF','DB-3-SMG-SF'
  ];
begin
  if (select count(*) from public.cot_tipos_mueble
      where pref=any(v_objetivos) and activo) <> 12 then
    raise exception 'DB-SMG no conserva sus doce tipologias activas';
  end if;

  if (select count(*) from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref=any(v_objetivos) and lower(p.nombre)='refuerzo_delantero'
        and p.formula_cantidad='1'
        and p.visualizacion->>'plano'='XY'
        and p.visualizacion->>'y'='27') <> 12 then
    raise exception 'El refuerzo horizontal unico a 27 mm no quedo en las doce DB-SMG';
  end if;

  if (select count(*) from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      where t.pref=any(v_objetivos) and lower(p.nombre)='lateral'
        and p.formula_cantidad='2'
        and jsonb_array_length(p.visualizacion->'recortes')=2
        and p.visualizacion#>>'{recortes,0,borde}'='frontal_superior'
        and p.visualizacion#>>'{recortes,1,borde}'='frontal_nivel_gaveta'
        and p.visualizacion#>>'{recortes,0,profundidad}'='27'
        and p.visualizacion#>>'{recortes,1,profundidad}'='27'
        and p.visualizacion#>>'{recortes,0,alto}'='73'
        and p.visualizacion#>>'{recortes,1,alto}'='73') <> 12 then
    raise exception 'Los dos mecanizados 27 x 73 no quedaron en ambos laterales DB-SMG';
  end if;

  if exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref=any(v_objetivos)
      and lower(p.nombre) in ('gola','gola_madera','gola_perfil')
  ) then raise exception 'Una DB-SMG recupero una pieza de gola de madera'; end if;

  if exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref like 'DB-%-SMG-SF' and lower(p.nombre)='fondo'
  ) then raise exception 'Una DB-SMG-SF recupero fondo'; end if;
end $$;

commit;
