-- ============================================================================
-- Cotizador PLUS — Esquema base (prefijo cot_ en schema public)
-- Proyecto compartido: NO toca tablas existentes. Referencias a colors/clients/
-- product_references son columnas "soft" (sin FK físico) para no afectar producción.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Helpers: perfiles de usuario y rol
-- ----------------------------------------------------------------------------
create table if not exists public.cot_perfiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  rol        text not null default 'vendedor' check (rol in ('admin','vendedor')),
  nombre     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.cot_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cot_perfiles p where p.user_id = auth.uid() and p.rol = 'admin');
$$;

create or replace function public.cot_is_authenticated()
returns boolean language sql stable as $$
  select auth.uid() is not null;
$$;

-- ----------------------------------------------------------------------------
-- 1. Parámetros globales (desperdicios, TRM, márgenes, formatos lámina, etc.)
-- ----------------------------------------------------------------------------
create table if not exists public.cot_parametros (
  key         text primary key,
  value       jsonb not null,
  descripcion text,
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. Catálogo de TABLEROS (equivale a hoja 'Materiales' / Tabla13)
-- ----------------------------------------------------------------------------
create table if not exists public.cot_tableros (
  id            uuid primary key default gen_random_uuid(),
  proveedor     text,
  espesor_mm    numeric,
  sustrato      text,                      -- ST / RH / CARB / RHCARB / PVC ...
  color_code    text,                      -- soft ref a public.colors.code_4dig
  color_nombre  text,
  codigo        text unique not null,      -- código concatenado (ej. DURRH18COLOR)
  formato       text,                      -- '183X244' ...
  area_m2       numeric,
  precio        numeric,
  descuento     numeric default 0,
  precio_real   numeric,
  precio_m2     numeric,
  aumento_pct   numeric default 0,
  actualizado   boolean default true,
  notas         text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. Catálogo de CANTOS (Tabla2)
-- ----------------------------------------------------------------------------
create table if not exists public.cot_cantos (
  id          uuid primary key default gen_random_uuid(),
  referencia  text,
  codigo      text unique not null,        -- ej. CANT22x1
  calibre     text,                        -- '22x1' / '19x0,45' ...
  espesor_mm  numeric,
  ancho_mm    numeric,
  precio      numeric,                     -- costo por metro
  actualizado boolean default true,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. Catálogo de HERRAJES / insumos (patas, bisagras, rieles, manijas, ...)
-- ----------------------------------------------------------------------------
create table if not exists public.cot_herrajes (
  id           uuid primary key default gen_random_uuid(),
  codigo       text,
  nombre       text not null,
  categoria    text,                       -- pata/bisagra/riel/manija/gola/soporte/tubo/especial/canto/otro
  selector_key text,                       -- agrupa variantes intercambiables (ej. 'riel','manija','barra')
  precio       numeric not null default 0,
  unidad       text default 'und',
  notas        text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. TIPOS DE MUEBLE (BFD, SBFD, W, B, DB, SVFD, V, F, PN, TK ...)
-- ----------------------------------------------------------------------------
create table if not exists public.cot_tipos_mueble (
  id                uuid primary key default gen_random_uuid(),
  pref              text unique not null,
  nombre_es         text,
  nombre_en         text,
  categoria         text,                  -- inferior/superior/vanity/filler/panel/zocalo/complemento
  margen_key        text default 'muebles',-- cuál margen aplica (muebles/fillers/pn_tk) - ver cot_parametros
  margen_pct        numeric,               -- override opcional
  familia_code      text,                  -- soft ref a public.families.family_code (ej. COC01)
  descripcion_es    text,
  descripcion_en    text,
  notas             text,
  activo            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. PLANTILLA DE PIEZAS (despiece data-driven por tipo de mueble)
--    Fórmulas como texto evaluadas por el motor (variables: L, A, P, y conteos
--    derivados: n_puertas, n_entrepanos, n_cajones, n_refuerzos, ...)
-- ----------------------------------------------------------------------------
create table if not exists public.cot_piezas_plantilla (
  id               uuid primary key default gen_random_uuid(),
  tipo_mueble_id   uuid not null references public.cot_tipos_mueble(id) on delete cascade,
  nombre           text not null,          -- lateral, base, tapa, refuerzo_trasero, entrepano, puerta, frente_cajon, fondo ...
  rol_tablero      text,                   -- caja_balance15/color18/polar18/polar15/color15/fondo/fondo_shaker
  formula_cantidad text not null default '1',
  formula_largo    text,                   -- expresión en L,A,P (resultado en pulgadas)
  formula_ancho    text,
  resta_largo      numeric default 0,      -- ajustes finos opcionales
  resta_ancho      numeric default 0,
  cantos           jsonb default '{}'::jsonb, -- {"calibre":"19x0.45","largos":2,"anchos":2}
  orden            int default 0,
  notas            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_cot_piezas_tipo on public.cot_piezas_plantilla(tipo_mueble_id);

-- ----------------------------------------------------------------------------
-- 7. REGLAS PARAMÉTRICAS (derivan configuración desde dimensiones)
--    Ej.: n_puertas = 1 si L<=21, 2 si L>=24 ; n_entrepanos por altura ...
-- ----------------------------------------------------------------------------
create table if not exists public.cot_reglas_config (
  id              uuid primary key default gen_random_uuid(),
  tipo_mueble_id  uuid references public.cot_tipos_mueble(id) on delete cascade, -- null = global
  variable        text not null,           -- n_puertas, n_entrepanos, n_cajones, n_refuerzos_traseros ...
  condicion       text not null default 'true', -- expresión booleana en L,A,P
  valor           text not null,           -- expresión numérica o constante
  prioridad       int not null default 100,
  activo          boolean not null default true,
  notas           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_cot_reglas_tipo on public.cot_reglas_config(tipo_mueble_id);

-- ----------------------------------------------------------------------------
-- 8. RECARGOS POR CLIENTE (CEMA +10% sin herrajes, Infinitum +25% ...)
-- ----------------------------------------------------------------------------
create table if not exists public.cot_recargos_cliente (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid,                     -- soft ref a public.clients.id
  cliente_nombre  text not null,
  recargo_pct     numeric not null default 0,
  incluye_herrajes boolean not null default true,
  notas           text,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 9. COTIZACIONES (cabecera + líneas)
-- ----------------------------------------------------------------------------
create table if not exists public.cot_cotizaciones (
  id             uuid primary key default gen_random_uuid(),
  codigo         text,
  nombre         text,
  cliente_id     uuid,                      -- soft ref a public.clients.id
  cliente_nombre text,
  moneda         text not null default 'USD' check (moneda in ('COP','USD')),
  trm            numeric not null default 4200,
  trm_modo       text not null default 'manual' check (trm_modo in ('manual','auto')),
  estado         text not null default 'borrador' check (estado in ('borrador','enviada','aprobada','rechazada')),
  total_cop      numeric default 0,
  total_usd      numeric default 0,
  notas          text,
  creado_por     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_cot_cotiz_creado_por on public.cot_cotizaciones(creado_por);

create table if not exists public.cot_cotizacion_lineas (
  id                    uuid primary key default gen_random_uuid(),
  cotizacion_id         uuid not null references public.cot_cotizaciones(id) on delete cascade,
  orden                 int default 0,
  tipo_mueble_id        uuid references public.cot_tipos_mueble(id),
  pref                  text,
  sku                   text,
  product_reference_id  uuid,               -- soft ref opcional a public.product_references.id
  largo                 numeric,
  alto                  numeric,
  prof                  numeric,
  unidad_dim            text not null default 'in' check (unidad_dim in ('in','cm','mm')),
  config                jsonb default '{}'::jsonb, -- puertas, entrepanos, cajones, overrides, sustrato, colores, con_herrajes, sin_manijas, shaker
  cantidad              numeric not null default 1,
  costo_sin_herrajes_cop numeric default 0,
  costo_herrajes_cop    numeric default 0,
  costo_total_cop       numeric default 0,
  precio_unit_cop       numeric default 0,
  precio_unit_usd       numeric default 0,
  precio_total_cop      numeric default 0,
  precio_total_usd      numeric default 0,
  descripcion_es        text,
  descripcion_en        text,
  codigo_sap            text,
  breakdown             jsonb,              -- desglose completo de costo para trazabilidad
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_cot_lineas_cotiz on public.cot_cotizacion_lineas(cotizacion_id);

-- ----------------------------------------------------------------------------
-- 10. updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.cot_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array[
    'cot_perfiles','cot_tableros','cot_cantos','cot_herrajes','cot_tipos_mueble',
    'cot_piezas_plantilla','cot_reglas_config','cot_recargos_cliente',
    'cot_cotizaciones','cot_cotizacion_lineas'
  ] loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$s', t);
    execute format('create trigger trg_touch_%1$s before update on public.%1$s for each row execute function public.cot_touch_updated_at()', t);
  end loop;
end $$;
