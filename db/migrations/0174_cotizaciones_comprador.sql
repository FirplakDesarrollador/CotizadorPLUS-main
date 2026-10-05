-- Separa la empresa constructora (cliente_nombre historico) de la persona que
-- compra o recibe la cotizacion.
alter table public.cot_cotizaciones
  add column if not exists comprador_nombre text;

comment on column public.cot_cotizaciones.cliente_nombre is
  'Nombre de la constructora asociada al proyecto.';

comment on column public.cot_cotizaciones.comprador_nombre is
  'Nombre de la persona compradora o contacto de la cotizacion.';
