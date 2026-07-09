-- ============================================================================
-- Cotizador PLUS — Jerarquía Proyecto → Cocinas → Módulos
--   cot_cotizaciones (proyecto) 1—N cot_cocinas 1—N cot_cotizacion_lineas (módulos)
-- Las líneas conservan cotizacion_id (denormalizado, para RLS/totales) y suman cocina_id.
-- ============================================================================

create table if not exists public.cot_cocinas (
  id             uuid primary key default gen_random_uuid(),
  cotizacion_id  uuid not null references public.cot_cotizaciones(id) on delete cascade,
  nombre         text not null default 'Cocina',
  orden          int default 0,
  total_cop      numeric default 0,
  total_usd      numeric default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_cot_cocinas_cotiz on public.cot_cocinas(cotizacion_id);

alter table public.cot_cotizacion_lineas
  add column if not exists cocina_id uuid references public.cot_cocinas(id) on delete cascade;
create index if not exists idx_cot_lineas_cocina on public.cot_cotizacion_lineas(cocina_id);

-- updated_at trigger
drop trigger if exists trg_touch_cot_cocinas on public.cot_cocinas;
create trigger trg_touch_cot_cocinas before update on public.cot_cocinas
  for each row execute function public.cot_touch_updated_at();

-- RLS: lectura autenticada; escritura si es dueño del proyecto padre o admin
alter table public.cot_cocinas enable row level security;
drop policy if exists cot_cocinas_sel on public.cot_cocinas;
drop policy if exists cot_cocinas_ins on public.cot_cocinas;
drop policy if exists cot_cocinas_upd on public.cot_cocinas;
drop policy if exists cot_cocinas_del on public.cot_cocinas;
create policy cot_cocinas_sel on public.cot_cocinas for select using (public.cot_is_authenticated());
create policy cot_cocinas_ins on public.cot_cocinas for insert with check (exists (
  select 1 from public.cot_cotizaciones c where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())));
create policy cot_cocinas_upd on public.cot_cocinas for update using (exists (
  select 1 from public.cot_cotizaciones c where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())))
  with check (exists (
  select 1 from public.cot_cotizaciones c where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())));
create policy cot_cocinas_del on public.cot_cocinas for delete using (exists (
  select 1 from public.cot_cotizaciones c where c.id = cotizacion_id and (c.creado_por = auth.uid() or public.cot_is_admin())));
