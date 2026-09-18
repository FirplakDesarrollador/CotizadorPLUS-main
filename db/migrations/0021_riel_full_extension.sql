-- ============================================================================
-- Cotizador PLUS — Riel full extension 500mm (Excel: Hoja1 Sección HERRAJES)
-- Agrega el 6º tipo de riel al catálogo cot_herrajes.
-- ============================================================================

insert into public.cot_herrajes (codigo, nombre, categoria, selector_key, precio, unidad, notas)
values
  ('RIELFE500', 'Riel full extension 500mm', 'riel', 'riel_fe', 27105.00, 'par', 'Excel Hoja1 B64')
on conflict (codigo) do update
  set precio     = excluded.precio,
      nombre     = excluded.nombre,
      categoria  = excluded.categoria,
      selector_key = excluded.selector_key,
      notas      = excluded.notas,
      updated_at = now();
