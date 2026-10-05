-- Datos comerciales editables usados por la plantilla de propuesta CEMA.
alter table public.cot_cotizaciones
  add column if not exists plantilla_cema jsonb not null default '{}'::jsonb;

comment on column public.cot_cotizaciones.plantilla_cema is
  'Campos comerciales editables de la propuesta PDF CEMA.';
