alter table public.cot_cotizaciones
  add column if not exists plantilla_firplak jsonb not null default '{}'::jsonb;

comment on column public.cot_cotizaciones.plantilla_firplak is
  'Campos editables de la propuesta comercial FIRPLAK asociados a la cotización.';
