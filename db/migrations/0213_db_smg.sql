-- Familia DB-SMG: doce cajoneras con gola metálica derivadas de sus pares
-- DB-SM. Conservan reglas, cajas, frentes, rieles y agrupación; eliminan la
-- pieza de gola de madera y mecanizan ambos laterales 27 x 73 mm.
--
-- El perfil de aluminio no se costea todavía: no existe en cot_herrajes un
-- código, unidad ni precio confirmado. No se inventan datos comerciales.

begin;

create temporary table if not exists pg_temp.db_smg_map (
  source_pref text not null,
  target_pref text primary key,
  variant text not null check (variant in ('base','fe','sf'))
) on commit drop;
truncate pg_temp.db_smg_map;
insert into pg_temp.db_smg_map (source_pref,target_pref,variant) values
  ('DB-2S-SM','DB-2S-SMG','base'),
  ('DB-2-SM','DB-2-SMG','base'),
  ('DB-2-1INT-SM','DB-2-1INT-SMG','base'),
  ('DB-3-SM','DB-3-SMG','base'),
  ('DB-2S-SM-FE','DB-2S-SMG-FE','fe'),
  ('DB-2-SM-FE','DB-2-SMG-FE','fe'),
  ('DB-2-1INT-SM-FE','DB-2-1INT-SMG-FE','fe'),
  ('DB-3-SM-FE','DB-3-SMG-FE','fe'),
  ('DB-2S-SM','DB-2S-SMG-SF','sf'),
  ('DB-2-SM','DB-2-SMG-SF','sf'),
  ('DB-2-1INT-SM','DB-2-1INT-SMG-SF','sf'),
  ('DB-3-SM','DB-3-SMG-SF','sf');

insert into public.cot_tipos_mueble (
  pref,nombre_es,nombre_en,categoria,margen_key,margen_pct,familia_code,
  descripcion_es,descripcion_en,notas,activo,etiquetas_und,usa_carton,
  pref_imperial,pref_metrico,permite_agrupacion
)
select
  m.target_pref,
  replace(coalesce(s.nombre_es,s.pref),'Gola','Gola metálica')
    || case when m.variant='sf' then ' (sin fondo)' else '' end,
  replace(coalesce(s.nombre_en,s.pref),'wood gola','metal gola')
    || case when m.variant='sf' then ' (without back panel)' else '' end,
  s.categoria,s.margen_key,s.margen_pct,s.familia_code,
  'Variante ' || m.target_pref || ' derivada de ' || m.source_pref
    || ': gola metálica, sin pieza de gola de madera.'
    || case when m.variant='sf' then ' Sin respaldo; base a P-TC.' else '' end,
  'Metal-gola variant derived from ' || m.source_pref || '.',
  'Perfil de aluminio pendiente de código, unidad y precio; no se costea por ahora.',
  true,s.etiquetas_und,s.usa_carton,m.target_pref,m.target_pref,true
from pg_temp.db_smg_map m
join public.cot_tipos_mueble s on s.pref=m.source_pref
on conflict (pref) do update set
  nombre_es=excluded.nombre_es,nombre_en=excluded.nombre_en,
  categoria=excluded.categoria,margen_key=excluded.margen_key,
  margen_pct=excluded.margen_pct,familia_code=excluded.familia_code,
  descripcion_es=excluded.descripcion_es,descripcion_en=excluded.descripcion_en,
  notas=excluded.notas,activo=true,etiquetas_und=excluded.etiquetas_und,
  usa_carton=excluded.usa_carton,pref_imperial=excluded.pref_imperial,
  pref_metrico=excluded.pref_metrico,permite_agrupacion=true,updated_at=now();

-- Solo se regeneran plantillas de los doce destinos nuevos. Ningún tipo fuente
-- ni dato de cotización se elimina o modifica.
delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t, pg_temp.db_smg_map m
where p.tipo_mueble_id=t.id and t.pref=m.target_pref;

insert into public.cot_piezas_plantilla (
  tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
  resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,visualizacion,
  modo_agrupacion,clave_fusion,formula_largo_grupo
)
select
  d.id,p.nombre,p.rol_tablero,p.formula_cantidad,
  case when m.variant='sf' and lower(p.nombre)='base'
         and coalesce(p.formula_ancho,'') !~ '(^|[^A-Za-z0-9_])P([^A-Za-z0-9_]|$)'
         and coalesce(p.formula_largo,'') ~ '(^|[^A-Za-z0-9_])P([^A-Za-z0-9_]|$)'
       then 'P-TC' else p.formula_largo end,
  case when m.variant='sf' and lower(p.nombre)='base'
         and coalesce(p.formula_ancho,'') ~ '(^|[^A-Za-z0-9_])P([^A-Za-z0-9_]|$)'
       then 'P-TC' else p.formula_ancho end,
  p.resta_largo,p.resta_ancho,p.cantos,p.tarugos,p.soportes,p.orden,
  case when lower(p.nombre)='lateral'
       then 'Par lateral con mecanizado frontal superior para gola metálica.'
       else p.notas end,
  case when lower(p.nombre)='lateral' then
    jsonb_set(
      jsonb_set(coalesce(p.visualizacion,'{}'::jsonb),'{nota}',
        to_jsonb('Par lateral con mecanizado frontal superior para gola metálica.'::text)),
      '{recorte}','{"borde":"frontal_superior","profundidad":"27","alto":"73"}'::jsonb
    )
    else p.visualizacion end,
  p.modo_agrupacion,p.clave_fusion,p.formula_largo_grupo
from pg_temp.db_smg_map m
join public.cot_tipos_mueble s on s.pref=m.source_pref
join public.cot_tipos_mueble d on d.pref=m.target_pref
join public.cot_piezas_plantilla p on p.tipo_mueble_id=s.id
where lower(p.nombre) not in ('gola','gola_madera','gola_perfil')
  and not (m.variant='sf' and lower(p.nombre)='fondo');

delete from public.cot_reglas_config r
using public.cot_tipos_mueble t, pg_temp.db_smg_map m
where r.tipo_mueble_id=t.id and t.pref=m.target_pref;

insert into public.cot_reglas_config
  (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select d.id,r.variable,r.condicion,r.valor,r.prioridad,r.activo,
       'Heredado de ' || m.source_pref || ' para ' || m.target_pref || '.'
from pg_temp.db_smg_map m
join public.cot_tipos_mueble s on s.pref=m.source_pref
join public.cot_tipos_mueble d on d.pref=m.target_pref
join public.cot_reglas_config r on r.tipo_mueble_id=s.id;

delete from public.cot_herrajes_plantilla h
using public.cot_tipos_mueble t, pg_temp.db_smg_map m
where h.tipo_mueble_id=t.id and t.pref=m.target_pref;

insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select d.id,h.rol,h.herraje_codigo,h.selector_key,h.formula_cantidad,h.orden,
       'Heredado de ' || m.source_pref || '; perfil SMG pendiente de definición comercial.'
from pg_temp.db_smg_map m
join public.cot_tipos_mueble s on s.pref=m.source_pref
join public.cot_tipos_mueble d on d.pref=m.target_pref
join public.cot_herrajes_plantilla h on h.tipo_mueble_id=s.id;

do $$
declare
  v record;
  v_expected integer;
  v_actual integer;
begin
  if (select count(*) from public.cot_tipos_mueble t
      join pg_temp.db_smg_map m on m.target_pref=t.pref
      where t.activo) <> 12 then
    raise exception 'DB-SMG no quedó con doce tipologías activas';
  end if;

  for v in select * from pg_temp.db_smg_map loop
    select count(*) into v_expected
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref=v.source_pref
      and lower(p.nombre) not in ('gola','gola_madera','gola_perfil')
      and not (v.variant='sf' and lower(p.nombre)='fondo');

    select count(*) into v_actual
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref=v.target_pref;
    if v_actual <> v_expected then
      raise exception '% tiene % piezas; se esperaban %',v.target_pref,v_actual,v_expected;
    end if;
  end loop;

  if exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    join pg_temp.db_smg_map m on m.target_pref=t.pref
    where lower(p.nombre) in ('gola','gola_madera','gola_perfil')
  ) then raise exception 'Una tipología DB-SMG conserva gola de madera'; end if;

  if (select count(*) from public.cot_piezas_plantilla p
      join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
      join pg_temp.db_smg_map m on m.target_pref=t.pref
      where lower(p.nombre)='lateral' and p.formula_cantidad='2'
        and p.visualizacion#>>'{recorte,borde}'='frontal_superior'
        and p.visualizacion#>>'{recorte,profundidad}'='27'
        and p.visualizacion#>>'{recorte,alto}'='73') <> 12 then
    raise exception 'El mecanizado 27 x 73 no quedó en ambos laterales de las doce DB-SMG';
  end if;

  if exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref like 'DB-%-SMG-SF' and lower(p.nombre)='fondo'
  ) then raise exception 'Una variante DB-SMG-SF conserva fondo'; end if;

  if exists (
    select 1 from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
    where t.pref like 'DB-%-SMG-SF' and lower(p.nombre)='base'
      and not (p.formula_largo='P-TC' or p.formula_ancho='P-TC')
  ) then raise exception 'Una variante DB-SMG-SF no ajustó la base a P-TC'; end if;

  if exists (
    select 1 from public.cot_herrajes_plantilla h
    join public.cot_tipos_mueble t on t.id=h.tipo_mueble_id
    where t.pref like 'DB-%-SMG-FE' and h.herraje_codigo='RIELFE500'
      and h.formula_cantidad='n_cajones'
    group by t.pref having count(*) <> 1
  ) or (select count(distinct t.pref) from public.cot_herrajes_plantilla h
        join public.cot_tipos_mueble t on t.id=h.tipo_mueble_id
        where t.pref like 'DB-%-SMG-FE' and h.herraje_codigo='RIELFE500'
          and h.formula_cantidad='n_cajones') <> 4 then
    raise exception 'Las cuatro DB-SMG-FE no heredaron RIELFE500';
  end if;
end $$;

commit;
