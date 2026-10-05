-- Normaliza FIRPLAK en mayusculas sin reescribir la migracion 0175.
alter table public.cot_cotizaciones
  drop constraint if exists cot_cotizaciones_cotizador_por_check;

update public.cot_cotizaciones
set cotizador_por = 'FIRPLAK'
where cotizador_por = 'Firplak';

alter table public.cot_cotizaciones
  alter column cotizador_por set default 'FIRPLAK',
  add constraint cot_cotizaciones_cotizador_por_check
  check (cotizador_por in ('FIRPLAK', 'CEMA'));

comment on column public.cot_cotizaciones.cotizador_por is
  'Empresa que prepara la cotizacion: FIRPLAK o CEMA.';
