-- UW1336 parte de un ancho exterior L=13in (330.2mm). Las piezas de la hoja
-- descuentan 30mm entre laterales y la puerta descuenta el reveal de 3.2mm.
update public.cot_piezas_plantilla p
set formula_largo = case p.nombre
  when 'base' then 'L-1.181102'
  when 'tapa' then 'L-1.181102'
  when 'refuerzo_trasero' then 'L-1.181102'
  when 'entrepano_superior' then 'L-1.181102'
  when 'entrepano' then 'L-1.220472'
  when 'frente' then 'L-0.125984'
  when 'fondo' then 'A-0.62992'
end,
formula_ancho = case p.nombre
  when 'fondo' then 'L-0.62992'
  else p.formula_ancho
end
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and p.nombre in ('base','tapa','refuerzo_trasero','entrepano_superior','entrepano','frente','fondo');
