begin;

alter table public.cot_cotizaciones drop constraint if exists cot_cotizaciones_estado_check;
alter table public.cot_cotizaciones add constraint cot_cotizaciones_estado_check
  check (estado in ('borrador','en_desarrollo','enviada','en_pausa','reproceso','aprobada','rechazada','descartada'));

alter table public.cot_pipeline drop constraint if exists cot_pipeline_estado_check;
alter table public.cot_pipeline add constraint cot_pipeline_estado_check
  check (estado in ('borrador','en_desarrollo','enviada','en_pausa','reproceso','aprobada','rechazada','descartada'));

comment on column public.cot_cotizaciones.estado is 'borrador, en_desarrollo, enviada, en_pausa, reproceso, aprobada, rechazada, descartada';
commit;
