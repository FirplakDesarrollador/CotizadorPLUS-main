-- Los frentes de cajón heredados deben crear una ranura de gaveta para que su
-- base y trasero se ubiquen junto al frente, en la parte superior del mueble.
update public.cot_piezas_plantilla
set visualizacion = jsonb_set(
  coalesce(visualizacion, '{}'::jsonb),
  '{funcion}',
  '"frente_gaveta"'::jsonb,
  true
)
where nombre = 'frente_cajon'
  and rol_tablero = 'frente';
