-- Montaje visual de BLS36 reconstruido desde BLS36.iges (mm).
-- Solo modifica metadatos de visualizacion; no altera cortes, cantidades ni costos.
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='BLS';
  if v is null then raise exception 'No existe BLS'; end if;

  update public.cot_piezas_plantilla
  set visualizacion = case nombre
    when 'base' then
      '{"version":1,"funcion":"base","plano":"XY","intercambiar":false,"x":"0","y":"0","z":"0","confirmado":true,"nota":"Posicion confirmada con BLS36.iges."}'::jsonb
    when 'refuerzo_delantero_superior' then
      '{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":false,"x":"TC","y":"L-P","z":"A-TC","confirmado":true,"nota":"Refuerzo superior en el entrante frontal, confirmado con BLS36.iges."}'::jsonb
    when 'refuerzo_delantero_central' then
      '{"version":1,"funcion":"travesano_frontal","plano":"XY","intercambiar":true,"x":"2*L/3-AP","y":"TC","z":"A-TC","confirmado":true,"nota":"Refuerzo central perpendicular al superior, confirmado con BLS36.iges."}'::jsonb
    when 'refuerzo_trasero' then
      '{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":true,"x":"TC+EP*0.70710678","y":"L-(AP+EP)*0.70710678","z":"TC","giro":"45","confirmado":true,"nota":"Refuerzo diagonal apoyado en el fondo izquierdo y dirigido hacia la esquina posterior a 45 grados, confirmado con BLS36.iges."}'::jsonb
    when 'fondo_derecho' then
      '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":false,"x":"L-LP-TC","y":"L-EP","z":"TC","giro":0,"confirmado":true,"nota":"Respaldo posterior del ala derecha, confirmado con BLS36.iges."}'::jsonb
    when 'fondo_izquierdo' then
      '{"version":1,"funcion":"respaldo","plano":"XZ","intercambiar":false,"x":"EP","y":"TC","z":"TC","giro":90,"confirmado":true,"nota":"Respaldo lateral del ala izquierda, confirmado con BLS36.iges."}'::jsonb
    when 'entrepano' then
      '{"version":1,"funcion":"estante","plano":"XY","intercambiar":false,"x":"(L-W)/2","y":"(L-D)/2","z":"200","confirmado":true,"nota":"Cota vertical de 200 mm confirmada con BLS36.iges; contorno representado por su rectangulo de corte."}'::jsonb
    when 'frente' then
      '{"version":1,"funcion":"frente","plano":"XZ","intercambiar":true,"x":"I==0?L-282.6:2*L/3+TF","y":"I==0?L-P-TF:3.2","z":"0","giro":"I==0?0:90","confirmado":true,"nota":"Par de puertas cerrado y perpendicular en el rincón Lazy Susan, confirmado con BLS36.iges."}'::jsonb
    else visualizacion
  end
  where tipo_mueble_id=v;

  -- Las dos filas lateral comparten nombre pero se distinguen por el canto corto.
  update public.cot_piezas_plantilla
  set visualizacion='{"version":1,"funcion":"lateral","plano":"YZ","intercambiar":false,"x":"L-W","y":"L-D","z":"TC","confirmado":true,"nota":"Lateral derecho del ala posterior, confirmado con BLS36.iges."}'::jsonb
  where tipo_mueble_id=v and nombre='lateral'
    and coalesce((cantos->>'anchos')::int,0)=1;

  update public.cot_piezas_plantilla
  set visualizacion='{"version":1,"funcion":"lateral","plano":"XZ","intercambiar":true,"x":"0","y":"0","z":"TC","confirmado":true,"nota":"Lateral izquierdo perpendicular al derecho, confirmado con BLS36.iges."}'::jsonb
  where tipo_mueble_id=v and nombre='lateral'
    and coalesce((cantos->>'anchos')::int,0)=2;
end $$;
