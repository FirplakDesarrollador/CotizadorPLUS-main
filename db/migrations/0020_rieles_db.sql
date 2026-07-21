-- ============================================================================
-- Cotizador PLUS — Rieles de cajón adicionales (Excel: Hoja1 Sección HERRAJES)
-- Agrega los 4 tipos de riel faltantes al catálogo cot_herrajes.
-- El RIELTANDEM (Riel Tandem china, $49.706,80) ya existía desde 0016_herrajes_tipos.sql.
-- El campo rielCodigo en CotizarInput permite seleccionar cuál usar por mueble DB.
-- ============================================================================

insert into public.cot_herrajes (codigo, nombre, categoria, selector_key, precio, unidad, notas)
values
  ('RIELMETALBOX', 'Riel metal BOX (par)',          'riel', 'riel_box',  28000.00, 'par', 'Excel Hoja1 B60 — riel metálico económico'),
  ('RIELSLIMCHI',  'Riel Slim China (par)',         'riel', 'riel_slim', 55671.62, 'par', 'Excel Hoja1 B62'),
  ('SLIMBOXALTO',  'Slim Box Alto Madecentro (par)','riel', 'slim_alto', 48250.00, 'par', 'Excel Hoja1 B63'),
  ('SLIMBOXBAJO',  'Slim Box Bajo Madecentro (par)','riel', 'slim_bajo', 28700.00, 'par', 'Excel Hoja1 B64')
on conflict (codigo) do update
  set precio     = excluded.precio,
      nombre     = excluded.nombre,
      categoria  = excluded.categoria,
      selector_key = excluded.selector_key,
      notas      = excluded.notas,
      updated_at = now();
