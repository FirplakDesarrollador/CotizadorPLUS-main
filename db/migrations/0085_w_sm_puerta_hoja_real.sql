-- W-SM usa el corte confirmado en la hoja W2936-SM.
-- No agrega una pieza Gola: las SM superiores conservan solo sus piezas fuente.
-- El ajuste se limita a la tipología independiente W-SM.

update public.cot_piezas_plantilla p
set formula_largo = 'A-1',
    formula_ancho = 'P',
    notas = 'Lateral W-SM: A menos 1 pulgada, según hoja W2936-SM.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'W-SM'
  and p.nombre = 'lateral';

update public.cot_piezas_plantilla p
set formula_largo = '(L-n_puertas*RV)/n_puertas',
    formula_ancho = 'A+0.62402',
    notas = 'Puerta W-SM: alto A más 15,85 mm, según hoja W2936-SM.',
    visualizacion = '{"version":1,"funcion":"frente","plano":"XZ","z":"A-H","confirmado":true,"nota":"Puerta W-SM alineada arriba; el excedente del agarre baja por debajo de los laterales."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'W-SM'
  and p.nombre = 'frente';

update public.cot_piezas_plantilla p
set formula_largo = 'L-0.62992',
    formula_ancho = 'A-1.62992',
    notas = 'Fondo W-SM: holgura de 16 mm respecto al lateral A menos 1 pulgada.',
    visualizacion = '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":false,"confirmado":true,"nota":"Fondo W-SM alineado con el lateral reducido."}'::jsonb,
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'W-SM'
  and p.nombre = 'fondo';
