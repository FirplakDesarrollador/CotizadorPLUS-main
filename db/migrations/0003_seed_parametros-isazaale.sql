-- ============================================================================
-- Cotizador PLUS — Seed de parámetros globales y recargos por cliente
-- Valores tomados del Excel "Simulación muebles CEMA".
-- ============================================================================

insert into public.cot_parametros (key, value, descripcion) values
  ('trm', '{"valor": 4200, "modo": "manual"}'::jsonb,
   'TRM por defecto para cotizar (COP por USD). modo: manual|auto'),
  ('desperdicio_madera', '0.15'::jsonb,
   'Desperdicio de tablero (15%). Se aplica como area*(1+x).'),
  ('desperdicio_canto', '{"22x1": 0.05, "19x0.45": 0.05, "polar19x0.45": 0.05}'::jsonb,
   'Desperdicio de canto por calibre (referencial; el Excel lo calcula por pieza).'),
  ('margenes', '{"muebles": 0.57, "fillers": 0.52, "pn_tk": 0.44}'::jsonb,
   'Margen de venta por categoría: precio = costo/(1-margen).'),
  ('margen_herraje', '0.57'::jsonb,
   'Margen aplicado al costo de herrajes (Precio!T23).'),
  ('recargo_extra', '0.10'::jsonb,
   'Recargo adicional sobre precio (ej. CEMA +10%): precio/(1-recargo).'),
  ('lamina', '{"cm2": 44652, "formato_grande_m2": 4.4652, "formato_pequeno_m2": 3.7332}'::jsonb,
   'Tamaño de lámina estándar (1.83x2.44=4.4652 m²; 1.53x2.44=3.7332 m²).'),
  ('factores_sm', '{"SBFD": 0.0624177, "DBxx-2s": 0.05862830, "w": 0.01755779}'::jsonb,
   'Factores de costo Sin Manija (gola) vs estándar — hoja "Factor costo SM vs STDTI".'),
  ('pulgada_cm', '2.54'::jsonb, 'Factor pulgadas->cm.')
on conflict (key) do update set value = excluded.value, descripcion = excluded.descripcion, updated_at = now();

-- Recargos por cliente (hoja 'dibujo cocina' - notas).
insert into public.cot_recargos_cliente (cliente_nombre, recargo_pct, incluye_herrajes, notas) values
  ('CEMA',      0.10, false, 'CEMA: +10% y sin herrajes.'),
  ('Infinitum', 0.25, false, 'Infinitum: +25% y sin herrajes.'),
  ('CEFI',      0.25, true,  'Otros clientes CEFI: +25%; con/sin herrajes según instale CEMA.')
on conflict do nothing;
