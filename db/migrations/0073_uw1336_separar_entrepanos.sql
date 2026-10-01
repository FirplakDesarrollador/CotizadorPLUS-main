-- Los dos entrepaños interiores se montan debajo del shelf 0 fijo, dejando
-- una holgura visual de 40mm. I y N corresponden al índice y cantidad de estos
-- entrepaños, por lo que se redistribuyen si cambia su cantidad.
update public.cot_piezas_plantilla p
set visualizacion = jsonb_build_object(
  'version', 1, 'funcion', 'estante', 'plano', 'XY',
  'z', 'TC+198.15+H+40+I*((A-(TC+198.15+H+40)-TC-H)/N)',
  'confirmado', true,
  'nota', 'Entrepaños interiores separados 40mm del shelf superior fijo.'
)
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and p.nombre = 'entrepano';
