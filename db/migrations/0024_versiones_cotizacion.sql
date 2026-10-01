-- ============================================================================
-- Cotizador PLUS — versiones inmutables de una cotización completa
-- Cada versión conserva cabecera, cocinas, grupos y módulos en un snapshot JSONB.
-- La restauración ocurre dentro de una sola transacción y crea un respaldo previo.
-- ============================================================================

create table if not exists public.cot_cotizacion_versiones (
  id             uuid primary key default gen_random_uuid(),
  cotizacion_id  uuid not null references public.cot_cotizaciones(id) on delete cascade,
  numero         integer not null check (numero > 0),
  nombre         text check (nombre is null or char_length(nombre) <= 120),
  snapshot       jsonb not null,
  creada_por     uuid not null references auth.users(id),
  created_at     timestamptz not null default now(),
  unique (cotizacion_id, numero)
);

create index if not exists idx_cot_versiones_cotizacion
  on public.cot_cotizacion_versiones(cotizacion_id, numero desc);

alter table public.cot_cotizacion_versiones enable row level security;

drop policy if exists cot_versiones_sel on public.cot_cotizacion_versiones;
drop policy if exists cot_versiones_ins on public.cot_cotizacion_versiones;

create policy cot_versiones_sel on public.cot_cotizacion_versiones for select
  using (public.cot_is_authenticated());

create policy cot_versiones_ins on public.cot_cotizacion_versiones for insert
  with check (
    creada_por = auth.uid()
    and exists (
      select 1 from public.cot_cotizaciones c
      where c.id = cotizacion_id
        and (c.creado_por = auth.uid() or public.cot_is_admin())
    )
  );

grant select, insert on public.cot_cotizacion_versiones to authenticated;

create or replace function public.cot_guardar_version(
  p_cotizacion_id uuid,
  p_nombre text default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_numero integer;
  v_snapshot jsonb;
  v_id uuid;
  v_propietario uuid;
  v_nombre text;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  -- El bloqueo serializa la numeración de versiones de la misma cotización.
  select creado_por into v_propietario
  from public.cot_cotizaciones
  where id = p_cotizacion_id
  for update;

  if not found then
    raise exception 'Cotización no encontrada';
  end if;

  if v_propietario is distinct from auth.uid() and not public.cot_is_admin() then
    raise exception 'No tienes permiso para versionar esta cotización';
  end if;

  v_nombre := nullif(btrim(p_nombre), '');
  if char_length(v_nombre) > 120 then
    raise exception 'El nombre de la versión no puede superar 120 caracteres';
  end if;

  select coalesce(max(numero), 0) + 1 into v_numero
  from public.cot_cotizacion_versiones
  where cotizacion_id = p_cotizacion_id;

  select jsonb_build_object(
    'schema_version', 1,
    'cabecera', to_jsonb(c),
    'cocinas', coalesce((
      select jsonb_agg(to_jsonb(co) order by co.orden, co.created_at)
      from public.cot_cocinas co
      where co.cotizacion_id = c.id
    ), '[]'::jsonb),
    'grupos', coalesce((
      select jsonb_agg(to_jsonb(g) order by g.cocina_id, g.orden, g.created_at)
      from public.cot_grupos_modulos g
      where g.cotizacion_id = c.id
    ), '[]'::jsonb),
    'lineas', coalesce((
      select jsonb_agg(to_jsonb(l) order by l.cocina_id, l.orden, l.created_at)
      from public.cot_cotizacion_lineas l
      where l.cotizacion_id = c.id
    ), '[]'::jsonb)
  ) into v_snapshot
  from public.cot_cotizaciones c
  where c.id = p_cotizacion_id;

  insert into public.cot_cotizacion_versiones(
    cotizacion_id, numero, nombre, snapshot, creada_por
  ) values (
    p_cotizacion_id, v_numero, v_nombre, v_snapshot, auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.cot_restaurar_version(
  p_cotizacion_id uuid,
  p_version_id uuid
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_version public.cot_cotizacion_versiones%rowtype;
  v_propietario uuid;
  v_cabecera jsonb;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select creado_por into v_propietario
  from public.cot_cotizaciones
  where id = p_cotizacion_id
  for update;

  if not found then
    raise exception 'Cotización no encontrada';
  end if;

  if v_propietario is distinct from auth.uid() and not public.cot_is_admin() then
    raise exception 'No tienes permiso para restaurar esta cotización';
  end if;

  select * into v_version
  from public.cot_cotizacion_versiones
  where id = p_version_id and cotizacion_id = p_cotizacion_id;

  if not found then
    raise exception 'Versión no encontrada';
  end if;

  if coalesce((v_version.snapshot->>'schema_version')::integer, 0) <> 1 then
    raise exception 'La versión usa un formato de snapshot no compatible';
  end if;

  -- Punto de retorno automático antes de reemplazar el estado actual.
  perform public.cot_guardar_version(
    p_cotizacion_id,
    'Respaldo automático antes de restaurar v' || v_version.numero
  );

  v_cabecera := v_version.snapshot->'cabecera';

  update public.cot_cotizaciones
  set codigo = v_cabecera->>'codigo',
      nombre = v_cabecera->>'nombre',
      cliente_id = (v_cabecera->>'cliente_id')::uuid,
      cliente_nombre = v_cabecera->>'cliente_nombre',
      moneda = coalesce(v_cabecera->>'moneda', 'USD'),
      trm = coalesce((v_cabecera->>'trm')::numeric, 4200),
      trm_modo = coalesce(v_cabecera->>'trm_modo', 'manual'),
      estado = coalesce(v_cabecera->>'estado', 'borrador'),
      total_cop = coalesce((v_cabecera->>'total_cop')::numeric, 0),
      total_usd = coalesce((v_cabecera->>'total_usd')::numeric, 0),
      notas = v_cabecera->>'notas',
      sistema_medida = coalesce(v_cabecera->>'sistema_medida', 'imperial')
  where id = p_cotizacion_id;

  delete from public.cot_cotizacion_lineas where cotizacion_id = p_cotizacion_id;
  delete from public.cot_grupos_modulos where cotizacion_id = p_cotizacion_id;
  delete from public.cot_cocinas where cotizacion_id = p_cotizacion_id;

  insert into public.cot_cocinas(
    id, cotizacion_id, nombre, orden, total_cop, total_usd,
    created_at, updated_at, cantidad
  )
  select id, p_cotizacion_id, nombre, orden, total_cop, total_usd,
         created_at, updated_at, cantidad
  from jsonb_to_recordset(v_version.snapshot->'cocinas') as x(
    id uuid, cotizacion_id uuid, nombre text, orden integer,
    total_cop numeric, total_usd numeric, created_at timestamptz,
    updated_at timestamptz, cantidad numeric
  );

  insert into public.cot_grupos_modulos(
    id, cotizacion_id, cocina_id, orden, etiqueta, codigo_grupo,
    total_cop, total_usd, breakdown, created_at, updated_at
  )
  select id, p_cotizacion_id, cocina_id, orden, etiqueta, codigo_grupo,
         total_cop, total_usd, breakdown, created_at, updated_at
  from jsonb_to_recordset(v_version.snapshot->'grupos') as x(
    id uuid, cotizacion_id uuid, cocina_id uuid, orden integer,
    etiqueta text, codigo_grupo text, total_cop numeric, total_usd numeric,
    breakdown jsonb, created_at timestamptz, updated_at timestamptz
  );

  insert into public.cot_cotizacion_lineas(
    id, cotizacion_id, orden, tipo_mueble_id, pref, sku,
    product_reference_id, largo, alto, prof, unidad_dim, config, cantidad,
    costo_sin_herrajes_cop, costo_herrajes_cop, costo_total_cop,
    precio_unit_cop, precio_unit_usd, precio_total_cop, precio_total_usd,
    descripcion_es, descripcion_en, codigo_sap, breakdown,
    created_at, updated_at, cocina_id, grupo_id, posicion_grupo, codigo_modulo
  )
  select id, p_cotizacion_id, orden, tipo_mueble_id, pref, sku,
         product_reference_id, largo, alto, prof, unidad_dim, config, cantidad,
         costo_sin_herrajes_cop, costo_herrajes_cop, costo_total_cop,
         precio_unit_cop, precio_unit_usd, precio_total_cop, precio_total_usd,
         descripcion_es, descripcion_en, codigo_sap, breakdown,
         created_at, updated_at, cocina_id, grupo_id, posicion_grupo, codigo_modulo
  from jsonb_to_recordset(v_version.snapshot->'lineas') as x(
    id uuid, cotizacion_id uuid, orden integer, tipo_mueble_id uuid,
    pref text, sku text, product_reference_id uuid, largo numeric, alto numeric,
    prof numeric, unidad_dim text, config jsonb, cantidad numeric,
    costo_sin_herrajes_cop numeric, costo_herrajes_cop numeric,
    costo_total_cop numeric, precio_unit_cop numeric, precio_unit_usd numeric,
    precio_total_cop numeric, precio_total_usd numeric, descripcion_es text,
    descripcion_en text, codigo_sap text, breakdown jsonb,
    created_at timestamptz, updated_at timestamptz, cocina_id uuid,
    grupo_id uuid, posicion_grupo integer, codigo_modulo text
  );

  return p_cotizacion_id;
end;
$$;

revoke all on function public.cot_guardar_version(uuid, text) from public;
revoke all on function public.cot_restaurar_version(uuid, uuid) from public;
grant execute on function public.cot_guardar_version(uuid, text) to authenticated;
grant execute on function public.cot_restaurar_version(uuid, uuid) to authenticated;
