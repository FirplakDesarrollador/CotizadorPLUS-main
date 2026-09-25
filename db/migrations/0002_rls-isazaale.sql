-- ============================================================================
-- Cotizador PLUS — RLS y políticas por rol
--  - Lectura: cualquier usuario autenticado.
--  - Escritura en catálogos/motor/parámetros: solo admin.
--  - Cotizaciones: autenticados ven todas; crean propias; editan/borran propias o admin.
--  - Perfiles: cada quien ve el suyo; admin gestiona todos.
-- service_role (backend) ignora RLS.
-- ============================================================================

-- Habilitar RLS
do $$
declare t text;
begin
  foreach t in array array[
    'cot_perfiles','cot_parametros','cot_tableros','cot_cantos','cot_herrajes',
    'cot_tipos_mueble','cot_piezas_plantilla','cot_reglas_config','cot_recargos_cliente',
    'cot_cotizaciones','cot_cotizacion_lineas'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Limpiar políticas previas (idempotente)
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies
           where schemaname='public' and tablename like 'cot\_%' escape '\'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ---- Catálogos / motor / parámetros: lectura autenticada, escritura admin ----
do $$
declare t text;
begin
  foreach t in array array[
    'cot_parametros','cot_tableros','cot_cantos','cot_herrajes','cot_tipos_mueble',
    'cot_piezas_plantilla','cot_reglas_config','cot_recargos_cliente'
  ] loop
    execute format($p$create policy %1$s_sel on public.%1$s for select using (public.cot_is_authenticated())$p$, t);
    execute format($p$create policy %1$s_ins on public.%1$s for insert with check (public.cot_is_admin())$p$, t);
    execute format($p$create policy %1$s_upd on public.%1$s for update using (public.cot_is_admin()) with check (public.cot_is_admin())$p$, t);
    execute format($p$create policy %1$s_del on public.%1$s for delete using (public.cot_is_admin())$p$, t);
  end loop;
end $$;

-- ---- Perfiles ----
create policy cot_perfiles_sel on public.cot_perfiles for select
  using (user_id = auth.uid() or public.cot_is_admin());
create policy cot_perfiles_ins on public.cot_perfiles for insert
  with check (public.cot_is_admin());
create policy cot_perfiles_upd on public.cot_perfiles for update
  using (public.cot_is_admin()) with check (public.cot_is_admin());
create policy cot_perfiles_del on public.cot_perfiles for delete
  using (public.cot_is_admin());

-- ---- Cotizaciones ----
create policy cot_cotiz_sel on public.cot_cotizaciones for select
  using (public.cot_is_authenticated());
create policy cot_cotiz_ins on public.cot_cotizaciones for insert
  with check (creado_por = auth.uid());
create policy cot_cotiz_upd on public.cot_cotizaciones for update
  using (creado_por = auth.uid() or public.cot_is_admin())
  with check (creado_por = auth.uid() or public.cot_is_admin());
create policy cot_cotiz_del on public.cot_cotizaciones for delete
  using (creado_por = auth.uid() or public.cot_is_admin());

-- ---- Líneas de cotización (heredan de la cabecera) ----
create policy cot_lineas_sel on public.cot_cotizacion_lineas for select
  using (public.cot_is_authenticated());
create policy cot_lineas_ins on public.cot_cotizacion_lineas for insert
  with check (exists (
    select 1 from public.cot_cotizaciones c
    where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())
  ));
create policy cot_lineas_upd on public.cot_cotizacion_lineas for update
  using (exists (
    select 1 from public.cot_cotizaciones c
    where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())
  ))
  with check (exists (
    select 1 from public.cot_cotizaciones c
    where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())
  ));
create policy cot_lineas_del on public.cot_cotizacion_lineas for delete
  using (exists (
    select 1 from public.cot_cotizaciones c
    where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())
  ));
