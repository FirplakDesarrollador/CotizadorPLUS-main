-- CEFI: almacenamiento independiente, sin modificar cotizaciones existentes.
begin;
create table public.cot_pipeline (
 id uuid primary key default gen_random_uuid(), codigo text, nombre_proyecto text, cliente text,
 pais text not null default 'Colombia' check(length(btrim(pais)) between 1 and 100), ciudad text, zona text,
 moneda text not null default 'USD' check(moneda in ('COP','USD')), productos text, asunto_correo text,
 tipo_tablero text, formato_color text, espesor_caja text, espesor_puerta text, tipo_puerta text,
 tipo_gabinete text, tipo_rieles text, tipo_zocalo text, margen_adicional text, tarifa numeric,
 instalado boolean not null default false, incoterm text, especificaciones text, fecha_limite_envio date,
 link_documentos text, notas text, tipo_cotizacion text check(tipo_cotizacion in ('FIRPLAK','CEMA')),
 adjunto_url text, asesor text, estimador text,
 estado text not null default 'borrador' check(estado in ('borrador','enviada','en_pausa','reproceso','aprobada','rechazada','descartada')),
 estado_planos text, fase_cotizacion boolean not null default false, link_planner text, link_tarea_planos text,
 monto_fob_usd numeric not null default 0, monto_fob_cop numeric not null default 0,
 nuevo_valor_usd numeric not null default 0, nuevo_valor_cop numeric not null default 0,
 trm numeric, fecha_ingreso date default current_date,
 cotizacion_id uuid references public.cot_cotizaciones(id) on delete set null,
 creado_por uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 tipo_origen text, origen_excel jsonb, clave_importacion text unique,
 constraint cot_pipeline_datos_nuevos check (origen_excel is not null or (length(btrim(cliente)) > 0 and cliente is not null and fecha_ingreso is not null))
);
comment on table public.cot_pipeline is 'Oportunidades independientes: Form CEFI (26 campos) y hoja Cotizaciones de Pipeline CEFI.xlsx. No crea cotizaciones automáticamente.';
comment on column public.cot_pipeline.origen_excel is 'Fila original completa, encabezados, fórmulas y enlaces. Conserva datos históricos incompletos sin inventarlos.';
comment on column public.cot_pipeline.clave_importacion is 'Identidad inmutable de importación: SHA256 de código, oportunidad, fecha y cliente originales. Nunca se actualiza al editar.';
comment on column public.cot_pipeline.tipo_origen is 'Tipo crudo Excel/TEOWIN/Plus; independiente de FIRPLAK/CEMA.';
comment on column public.cot_pipeline.fecha_ingreso is 'Nulo solo en históricos de Excel sin fecha, por autorización del usuario. No representa la fecha de importación.';
comment on column public.cot_pipeline.trm is 'TRM individual opcional; las tasas auxiliares mensuales del Excel no se asignan a oportunidades.';
create trigger cot_pipeline_updated_at before update on public.cot_pipeline for each row execute function public.cot_touch_updated_at();
create index cot_pipeline_estado_idx on public.cot_pipeline(estado);
create index cot_pipeline_pais_idx on public.cot_pipeline(pais);
create index cot_pipeline_fecha_idx on public.cot_pipeline(fecha_ingreso);
create index cot_pipeline_cotizacion_idx on public.cot_pipeline(cotizacion_id);
create index cot_pipeline_created_idx on public.cot_pipeline(created_at);
create index cot_pipeline_creador_idx on public.cot_pipeline(creado_por);
alter table public.cot_pipeline enable row level security;
create policy cot_pipeline_sel on public.cot_pipeline for select using(public.cot_is_authenticated());
create policy cot_pipeline_ins on public.cot_pipeline for insert with check(creado_por=auth.uid());
create policy cot_pipeline_upd on public.cot_pipeline for update using(creado_por=auth.uid() or public.cot_is_admin()) with check(creado_por=auth.uid() or public.cot_is_admin());
create policy cot_pipeline_del on public.cot_pipeline for delete using(creado_por=auth.uid() or public.cot_is_admin());
revoke all on public.cot_pipeline from public,anon;
grant select,insert,update,delete on public.cot_pipeline to authenticated,service_role;
commit;
