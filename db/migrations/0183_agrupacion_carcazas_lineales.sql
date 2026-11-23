-- Habilita agrupación física para carcazas lineales que aún estaban
-- bloqueadas. Esquineros, paneles, zócalos y piezas sueltas quedan fuera.
-- La lista es intencionalmente explícita: no se infiere fabricabilidad solo
-- desde la categoría comercial.

do $$
declare
  v_pref text;
  v_prefs constant text[] := array[
    'AL', 'BMW-1', 'BMW-1-FE', 'BOMH-1', 'BOMH-1-FE', 'BOV',
    'CC', 'CLV', 'OW-MO', 'OVPC', 'PC', 'PCFD', 'POD',
    'S', 'SA', 'SBAS', 'SDB', 'SLOC', 'SMO',
    'UDB', 'USVFD', 'UV', 'UVFD', 'VPC', 'WCC', 'WPC'
  ];
begin
  foreach v_pref in array v_prefs loop
    if not exists (select 1 from public.cot_tipos_mueble where pref = v_pref) then
      raise exception 'No existe la carcaza lineal %', v_pref;
    end if;
    if (select count(*)
        from public.cot_piezas_plantilla p
        join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
        where t.pref = v_pref
          and p.nombre = 'lateral'
          and p.formula_cantidad = '2') <> 1 then
      raise exception 'La carcaza % no tiene un único par de laterales compartibles', v_pref;
    end if;
  end loop;
end $$;

update public.cot_tipos_mueble
set permite_agrupacion = true,
    updated_at = now()
where pref = any (array[
  'AL', 'BMW-1', 'BMW-1-FE', 'BOMH-1', 'BOMH-1-FE', 'BOV',
  'CC', 'CLV', 'OW-MO', 'OVPC', 'PC', 'PCFD', 'POD',
  'S', 'SA', 'SBAS', 'SDB', 'SLOC', 'SMO',
  'UDB', 'USVFD', 'UV', 'UVFD', 'VPC', 'WCC', 'WPC'
]::text[]);

update public.cot_piezas_plantilla p
set modo_agrupacion = 'lateral_compartido',
    clave_fusion = null,
    formula_largo_grupo = null,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.permite_agrupacion = true
  and t.pref = any (array[
    'AL', 'BMW-1', 'BMW-1-FE', 'BOMH-1', 'BOMH-1-FE', 'BOV',
    'CC', 'CLV', 'OW-MO', 'OVPC', 'PC', 'PCFD', 'POD',
    'S', 'SA', 'SBAS', 'SDB', 'SLOC', 'SMO',
    'UDB', 'USVFD', 'UV', 'UVFD', 'VPC', 'WCC', 'WPC'
  ]::text[])
  and p.nombre = 'lateral'
  and p.formula_cantidad = '2';

-- Base y tapa se fusionan solo si todos los integrantes tienen una pieza
-- homologable. Si falta o cambia de sección, permanecen locales y el motor
-- compensa el espesor liberado por el lateral compartido.
update public.cot_piezas_plantilla p
set modo_agrupacion = 'continua_opcional',
    clave_fusion = p.nombre,
    formula_largo_grupo = 'LG-(2*TC)',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = any (array[
    'AL', 'BMW-1', 'BMW-1-FE', 'BOMH-1', 'BOMH-1-FE', 'BOV',
    'CC', 'CLV', 'OW-MO', 'OVPC', 'PC', 'PCFD', 'POD',
    'S', 'SA', 'SBAS', 'SDB', 'SLOC', 'SMO',
    'UDB', 'USVFD', 'UV', 'UVFD', 'VPC', 'WCC', 'WPC'
  ]::text[])
  and p.nombre in ('base', 'tapa')
  and p.formula_cantidad = '1'
  and (select count(*) from public.cot_piezas_plantilla sibling
       where sibling.tipo_mueble_id = p.tipo_mueble_id
         and sibling.nombre = p.nombre) = 1;

do $$
begin
  if not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'BOV'
      and t.permite_agrupacion = true
      and p.nombre = 'lateral'
      and p.modo_agrupacion = 'lateral_compartido'
  ) or not exists (
    select 1
    from public.cot_piezas_plantilla p
    join public.cot_tipos_mueble t on t.id = p.tipo_mueble_id
    where t.pref = 'BOV'
      and p.nombre = 'base'
      and p.modo_agrupacion = 'continua_opcional'
      and p.formula_largo_grupo = 'LG-(2*TC)'
  ) then
    raise exception 'No se configuró correctamente la agrupación de BOV';
  end if;
end $$;
