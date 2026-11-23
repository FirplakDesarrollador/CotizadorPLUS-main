-- Versiones abiertas de BFD y SBFD, incluidas sus variantes SM.
-- Conservan la configuracion de origen y omiten solo las piezas de frente.

do $$
declare v_source text;
begin
  foreach v_source in array array['BFD', 'BFD-SM', 'SBFD', 'SBFD-SM'] loop
    if not exists (select 1 from public.cot_tipos_mueble where pref = v_source) then
      raise exception 'No existe la tipologia fuente %', v_source;
    end if;
  end loop;
end $$;

with mapping(source_pref, target_pref, nombre_es, nombre_en, descripcion_es) as (
  values
    ('BFD', 'OBFD', 'Mueble inferior (sin puertas)', 'Open base cabinet',
     'Version de BFD sin puertas; conserva carcaza, fondo y configuracion de la tipologia original.'),
    ('BFD-SM', 'OBFD-SM', 'Mueble inferior con gola de madera (sin puertas)', 'Open base cabinet with wood gola',
     'Version de BFD-SM sin puertas; conserva carcaza, fondo, gola de madera y configuracion original.'),
    ('SBFD', 'OSBFD', 'Mueble inferior lavaplatos (sin puertas)', 'Open sink base cabinet',
     'Version de SBFD sin puertas; conserva carcaza, fondo y configuracion de la tipologia original.'),
    ('SBFD-SM', 'OSBFD-SM', 'Mueble inferior lavaplatos con gola de madera sin entrepaño (sin puertas)',
     'Open sink base cabinet with wood gola and without shelf',
     'Version de SBFD-SM sin puertas; conserva carcaza, fondo, gola de madera y configuracion original.')
)
insert into public.cot_tipos_mueble (
  pref, nombre_es, nombre_en, categoria, margen_key, margen_pct, familia_code,
  descripcion_es, descripcion_en, notas, activo, etiquetas_und, usa_carton,
  pref_imperial, pref_metrico, permite_agrupacion
)
select m.target_pref, m.nombre_es, m.nombre_en, s.categoria, s.margen_key,
  s.margen_pct, s.familia_code, m.descripcion_es,
  'Open version of ' || s.pref || '; only door/front panels are omitted.',
  s.notas, s.activo, s.etiquetas_und, s.usa_carton, m.target_pref,
  case when s.pref_metrico is null then m.target_pref else 'O' || s.pref_metrico end,
  s.permite_agrupacion
from mapping m
join public.cot_tipos_mueble s on s.pref = m.source_pref
on conflict (pref) do update set
  nombre_es=excluded.nombre_es, nombre_en=excluded.nombre_en,
  categoria=excluded.categoria, margen_key=excluded.margen_key,
  margen_pct=excluded.margen_pct, familia_code=excluded.familia_code,
  descripcion_es=excluded.descripcion_es, descripcion_en=excluded.descripcion_en,
  notas=excluded.notas, activo=excluded.activo,
  etiquetas_und=excluded.etiquetas_und, usa_carton=excluded.usa_carton,
  pref_imperial=excluded.pref_imperial, pref_metrico=excluded.pref_metrico,
  permite_agrupacion=excluded.permite_agrupacion, updated_at=now();

delete from public.cot_piezas_plantilla where tipo_mueble_id in (
  select id from public.cot_tipos_mueble where pref in ('OBFD','OBFD-SM','OSBFD','OSBFD-SM')
);

with mapping(source_pref, target_pref) as (
  values ('BFD','OBFD'), ('BFD-SM','OBFD-SM'), ('SBFD','OSBFD'), ('SBFD-SM','OSBFD-SM')
)
insert into public.cot_piezas_plantilla (
  tipo_mueble_id,nombre,rol_tablero,formula_cantidad,formula_largo,formula_ancho,
  resta_largo,resta_ancho,cantos,tarugos,soportes,orden,notas,modo_agrupacion,
  clave_fusion,formula_largo_grupo,visualizacion
)
select target.id,p.nombre,p.rol_tablero,p.formula_cantidad,p.formula_largo,
  p.formula_ancho,p.resta_largo,p.resta_ancho,p.cantos,p.tarugos,p.soportes,
  p.orden,p.notas,p.modo_agrupacion,p.clave_fusion,p.formula_largo_grupo,p.visualizacion
from mapping m
join public.cot_tipos_mueble source on source.pref=m.source_pref
join public.cot_tipos_mueble target on target.pref=m.target_pref
join public.cot_piezas_plantilla p on p.tipo_mueble_id=source.id
where p.rol_tablero is distinct from 'frente';

delete from public.cot_reglas_config where tipo_mueble_id in (
  select id from public.cot_tipos_mueble where pref in ('OBFD','OBFD-SM','OSBFD','OSBFD-SM')
);
with mapping(source_pref, target_pref) as (
  values ('BFD','OBFD'), ('BFD-SM','OBFD-SM'), ('SBFD','OSBFD'), ('SBFD-SM','OSBFD-SM')
)
insert into public.cot_reglas_config (tipo_mueble_id,variable,condicion,valor,prioridad,activo,notas)
select target.id,r.variable,r.condicion,r.valor,r.prioridad,r.activo,r.notas
from mapping m
join public.cot_tipos_mueble source on source.pref=m.source_pref
join public.cot_tipos_mueble target on target.pref=m.target_pref
join public.cot_reglas_config r on r.tipo_mueble_id=source.id;

delete from public.cot_herrajes_plantilla where tipo_mueble_id in (
  select id from public.cot_tipos_mueble where pref in ('OBFD','OBFD-SM','OSBFD','OSBFD-SM')
);
with mapping(source_pref, target_pref) as (
  values ('BFD','OBFD'), ('BFD-SM','OBFD-SM'), ('SBFD','OSBFD'), ('SBFD-SM','OSBFD-SM')
)
insert into public.cot_herrajes_plantilla
  (tipo_mueble_id,rol,herraje_codigo,selector_key,formula_cantidad,orden,notas)
select target.id,h.rol,h.herraje_codigo,h.selector_key,h.formula_cantidad,h.orden,h.notas
from mapping m
join public.cot_tipos_mueble source on source.pref=m.source_pref
join public.cot_tipos_mueble target on target.pref=m.target_pref
join public.cot_herrajes_plantilla h on h.tipo_mueble_id=source.id;

do $$
declare v record;
begin
  for v in select * from (values
    ('BFD','OBFD'), ('BFD-SM','OBFD-SM'), ('SBFD','OSBFD'), ('SBFD-SM','OSBFD-SM')
  ) as x(source_pref,target_pref) loop
    if exists (select 1 from public.cot_piezas_plantilla p join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id
               where t.pref=v.target_pref and p.rol_tablero='frente') then
      raise exception '% conserva piezas de frente', v.target_pref;
    end if;
    if (select count(*) from public.cot_piezas_plantilla p join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id where t.pref=v.target_pref)
       <> (select count(*) from public.cot_piezas_plantilla p join public.cot_tipos_mueble t on t.id=p.tipo_mueble_id where t.pref=v.source_pref and p.rol_tablero is distinct from 'frente') then
      raise exception '% no conserva las piezas no-frontales de %', v.target_pref,v.source_pref;
    end if;
    if (select count(*) from public.cot_reglas_config r join public.cot_tipos_mueble t on t.id=r.tipo_mueble_id where t.pref=v.target_pref)
       <> (select count(*) from public.cot_reglas_config r join public.cot_tipos_mueble t on t.id=r.tipo_mueble_id where t.pref=v.source_pref) then
      raise exception '% no conserva las reglas de %', v.target_pref,v.source_pref;
    end if;
    if (select count(*) from public.cot_herrajes_plantilla h join public.cot_tipos_mueble t on t.id=h.tipo_mueble_id where t.pref=v.target_pref)
       <> (select count(*) from public.cot_herrajes_plantilla h join public.cot_tipos_mueble t on t.id=h.tipo_mueble_id where t.pref=v.source_pref) then
      raise exception '% no conserva los herrajes de %', v.target_pref,v.source_pref;
    end if;
  end loop;
end $$;
