-- ============================================================================
-- Cotizador PLUS — agrupación física de módulos
-- Conserva las cotizaciones históricas como bloques unitarios y añade metadatos
-- explícitos para que el motor no dependa de nombres ni restas mágicas.
-- ============================================================================

alter table public.cot_cotizaciones
  add column if not exists sistema_medida text not null default 'imperial'
    check (sistema_medida in ('imperial', 'metrico'));

alter table public.cot_tipos_mueble
  add column if not exists pref_imperial text,
  add column if not exists pref_metrico text,
  add column if not exists permite_agrupacion boolean not null default false;

update public.cot_tipos_mueble
set pref_imperial = coalesce(pref_imperial, pref),
    pref_metrico = coalesce(pref_metrico, case when pref = 'BFD' then 'IP' else pref end),
    permite_agrupacion = pref not in (
      'TW','WBL','DVE','BBLFD','OVPC','PC','PCFD','VPC','BOMH','D','F','PN','R','TK'
    );

alter table public.cot_piezas_plantilla
  add column if not exists modo_agrupacion text not null default 'local'
    check (modo_agrupacion in ('local', 'continua', 'lateral_compartido')),
  add column if not exists clave_fusion text,
  add column if not exists formula_largo_grupo text;

-- Las piezas declaradas aquí son las únicas que pueden atravesar el grupo.
-- Los entrepaños, frentes, gavetas y herrajes continúan siendo locales.
update public.cot_piezas_plantilla p
set modo_agrupacion = case
      when lower(p.nombre) = 'lateral' then 'lateral_compartido'
      when lower(p.nombre) in ('base','tapa','base_tapa','refuerzo_delantero','refuerzo_horizontal','refuerzo_trasero','fondo') then 'continua'
      else 'local'
    end,
    clave_fusion = case
      when lower(p.nombre) in ('refuerzo_delantero','refuerzo_horizontal') then 'refuerzo_frontal'
      when lower(p.nombre) in ('base','tapa','base_tapa','refuerzo_trasero','fondo') then lower(p.nombre)
      else null
    end,
    formula_largo_grupo = case
      when lower(p.nombre) = 'fondo' then 'LG-TC'
      when lower(p.nombre) in ('base','tapa','base_tapa','refuerzo_delantero','refuerzo_horizontal','refuerzo_trasero') then 'LG-(2*TC)'
      else null
    end
where exists (
  select 1 from public.cot_tipos_mueble t
  where t.id = p.tipo_mueble_id and t.permite_agrupacion
);

create table if not exists public.cot_grupos_modulos (
  id             uuid primary key default gen_random_uuid(),
  cotizacion_id  uuid not null references public.cot_cotizaciones(id) on delete cascade,
  cocina_id      uuid not null references public.cot_cocinas(id) on delete cascade,
  orden          int not null default 0,
  etiqueta       text not null,
  codigo_grupo   text,
  total_cop      numeric not null default 0,
  total_usd      numeric not null default 0,
  breakdown      jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (cocina_id, orden),
  unique (cocina_id, etiqueta)
);

create index if not exists idx_cot_grupos_cotizacion on public.cot_grupos_modulos(cotizacion_id);
create index if not exists idx_cot_grupos_cocina on public.cot_grupos_modulos(cocina_id);

alter table public.cot_cotizacion_lineas
  add column if not exists grupo_id uuid references public.cot_grupos_modulos(id) on delete set null,
  add column if not exists posicion_grupo int not null default 1,
  add column if not exists codigo_modulo text;

create index if not exists idx_cot_lineas_grupo on public.cot_cotizacion_lineas(grupo_id, posicion_grupo);

-- Una línea histórica se transforma en un bloque unitario sin tocar costos,
-- precios ni breakdown. La aplicación normaliza luego A, B, ... por cocina.
do $$
declare
  r record;
  g uuid;
  n int;
  k int;
  label text;
begin
  for r in
    select l.id, l.cotizacion_id, l.cocina_id, l.orden, l.pref,
           l.precio_total_cop, l.precio_total_usd, l.breakdown
    from public.cot_cotizacion_lineas l
    where l.cocina_id is not null and l.grupo_id is null
    order by l.cocina_id, l.orden, l.created_at
  loop
    select count(*) into n
    from public.cot_grupos_modulos x where x.cocina_id = r.cocina_id;
    k := n + 1;
    label := '';
    while k > 0 loop
      label := chr(65 + ((k - 1) % 26)) || label;
      k := (k - 1) / 26;
    end loop;
    insert into public.cot_grupos_modulos(
      cotizacion_id, cocina_id, orden, etiqueta, codigo_grupo,
      total_cop, total_usd, breakdown
    ) values (
      r.cotizacion_id, r.cocina_id, n, label, r.pref,
      coalesce(r.precio_total_cop, 0), coalesce(r.precio_total_usd, 0), r.breakdown
    ) returning id into g;

    update public.cot_cotizacion_lineas
    set grupo_id = g, posicion_grupo = 1,
        codigo_modulo = coalesce(codigo_modulo, pref)
    where id = r.id;
  end loop;
end $$;

drop trigger if exists trg_touch_cot_grupos_modulos on public.cot_grupos_modulos;
create trigger trg_touch_cot_grupos_modulos before update on public.cot_grupos_modulos
  for each row execute function public.cot_touch_updated_at();

alter table public.cot_grupos_modulos enable row level security;

drop policy if exists cot_grupos_sel on public.cot_grupos_modulos;
drop policy if exists cot_grupos_ins on public.cot_grupos_modulos;
drop policy if exists cot_grupos_upd on public.cot_grupos_modulos;
drop policy if exists cot_grupos_del on public.cot_grupos_modulos;

create policy cot_grupos_sel on public.cot_grupos_modulos for select
  using (public.cot_is_authenticated());
create policy cot_grupos_ins on public.cot_grupos_modulos for insert
  with check (exists (
    select 1 from public.cot_cotizaciones c
    where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())
  ));
create policy cot_grupos_upd on public.cot_grupos_modulos for update
  using (exists (
    select 1 from public.cot_cotizaciones c
    where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())
  ))
  with check (exists (
    select 1 from public.cot_cotizaciones c
    where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())
  ));
create policy cot_grupos_del on public.cot_grupos_modulos for delete
  using (exists (
    select 1 from public.cot_cotizaciones c
    where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())
  ));
