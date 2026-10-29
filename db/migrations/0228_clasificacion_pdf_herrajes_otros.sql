-- Clasificación comercial del botón Agregar herrajes/otros, independiente
-- del catálogo y del margen contable del material. Cubre el histórico.
update public.cot_cotizacion_lineas
set config = jsonb_set(coalesce(config, '{}'::jsonb), '{clasificacionPdf}', '"herrajes_otros"'::jsonb, true)
where config->'material' is not null
  and config->>'clasificacionPdf' is distinct from 'herrajes_otros';

comment on column public.cot_cotizacion_lineas.config is
  'Configuracion de calculo. material identifica articulos de Agregar herrajes/otros; clasificacionPdf=herrajes_otros los excluye de muebles y los cuenta en herrajes/otros en toda propuesta, sin alterar su margen de catalogo.';
