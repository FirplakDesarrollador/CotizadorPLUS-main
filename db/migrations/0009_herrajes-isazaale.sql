-- ============================================================================
-- Cotizador PLUS — Herrajes "con herrajes" (Costos Muebles J = SUM(AB:BY))
-- Modelo: cot_herrajes_plantilla = herrajes que lleva cada tipo de mueble, con
--   fórmula de cantidad (vars: L,A,P + derivadas n_puertas,n_cajones,n_patas...).
-- Costo herraje = cantidad * cot_herrajes.precio (del herraje seleccionado).
-- Verificado SBFD33: patas 4*1987 + bisagras 2*5800 + manijas 2*7450 + torn 16*23 = 34816.
-- ============================================================================

-- Catálogo de herrajes usados (costos de hoja 'costos unitarios')
insert into public.cot_herrajes (codigo, nombre, categoria, selector_key, precio, unidad, notas) values
  ('PATA10AJUST',  'Pata ajustable 10cm',                                   'pata',    'pata',    1987, 'und', 'costos unitarios B28'),
  ('BISAGRAPAR',   'Bisagra par (cierre lento)',                            'bisagra', 'bisagra', 5800, 'par', 'costos unitarios B33'),
  ('MANIJA415',    'MANIJA 415 ACERO 201 CEPILLADA CUADRADA CC:160MM',      'manija',  'manija',  7450, 'und', 'costos unitarios B70'),
  ('TORNILLO858',  'Tornillo 8 5/8',                                        'tornillo','tornillo',  23, 'und', 'costos unitarios B83')
on conflict (codigo) do update set precio=excluded.precio, nombre=excluded.nombre, categoria=excluded.categoria, selector_key=excluded.selector_key, updated_at=now();

-- Plantilla de herrajes por tipo de mueble
create table if not exists public.cot_herrajes_plantilla (
  id               uuid primary key default gen_random_uuid(),
  tipo_mueble_id   uuid not null references public.cot_tipos_mueble(id) on delete cascade,
  rol              text not null,                 -- pata/bisagra/manija/tornillo/riel/...
  herraje_codigo   text,                          -- soft ref a cot_herrajes.codigo (default seleccionado)
  selector_key     text,                          -- para elegir variante al cotizar
  formula_cantidad text not null default '1',
  orden            int default 0,
  notas            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_cot_herrajes_plant_tipo on public.cot_herrajes_plantilla(tipo_mueble_id);

alter table public.cot_herrajes_plantilla enable row level security;
drop trigger if exists trg_touch_cot_herrajes_plantilla on public.cot_herrajes_plantilla;
create trigger trg_touch_cot_herrajes_plantilla before update on public.cot_herrajes_plantilla
  for each row execute function public.cot_touch_updated_at();
drop policy if exists cot_hp_sel on public.cot_herrajes_plantilla;
drop policy if exists cot_hp_ins on public.cot_herrajes_plantilla;
drop policy if exists cot_hp_upd on public.cot_herrajes_plantilla;
drop policy if exists cot_hp_del on public.cot_herrajes_plantilla;
create policy cot_hp_sel on public.cot_herrajes_plantilla for select using (public.cot_is_authenticated());
create policy cot_hp_ins on public.cot_herrajes_plantilla for insert with check (public.cot_is_admin());
create policy cot_hp_upd on public.cot_herrajes_plantilla for update using (public.cot_is_admin()) with check (public.cot_is_admin());
create policy cot_hp_del on public.cot_herrajes_plantilla for delete using (public.cot_is_admin());

-- Reglas adicionales para SBFD: nº de patas y cajones
do $$
declare v_tipo uuid;
begin
  select id into v_tipo from public.cot_tipos_mueble where pref='SBFD';

  delete from public.cot_reglas_config where tipo_mueble_id = v_tipo and variable in ('n_patas','n_cajones');
  insert into public.cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, notas) values
    (v_tipo, 'n_patas',   'true', '4', 10, 'Mueble inferior: 4 patas'),
    (v_tipo, 'n_cajones', 'true', '0', 10, 'SBFD: sin cajones');

  delete from public.cot_herrajes_plantilla where tipo_mueble_id = v_tipo;
  insert into public.cot_herrajes_plantilla (tipo_mueble_id, rol, herraje_codigo, selector_key, formula_cantidad, orden, notas) values
    (v_tipo, 'pata',     'PATA10AJUST', 'pata',     'n_patas',               10, 'Patas ajustables'),
    (v_tipo, 'tornillo', 'TORNILLO858', 'tornillo', 'n_patas*4',             20, '4 tornillos por pata'),
    (v_tipo, 'bisagra',  'BISAGRAPAR',  'bisagra',  'n_puertas',             30, 'Par de bisagras por puerta'),
    (v_tipo, 'manija',   'MANIJA415',   'manija',   'n_puertas + n_cajones', 40, 'Una manija por puerta y cajón');
end $$;
