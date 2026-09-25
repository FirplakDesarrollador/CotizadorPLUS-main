-- ============================================================================
-- Cotizador PLUS — persistir los "materiales globales" elegidos al crear
-- el proyecto, para que no se pierdan al reabrir la cotización.
-- ============================================================================

alter table public.cot_cotizaciones
  add column if not exists config_default jsonb;
