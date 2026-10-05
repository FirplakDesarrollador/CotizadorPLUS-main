-- Identifica la empresa que prepara la cotizacion comercial.
alter table public.cot_cotizaciones
  add column if not exists cotizador_por text not null default 'Firplak'
  check (cotizador_por in ('Firplak', 'CEMA'));

comment on column public.cot_cotizaciones.cotizador_por is
  'Empresa que prepara la cotizacion: Firplak o CEMA.';
