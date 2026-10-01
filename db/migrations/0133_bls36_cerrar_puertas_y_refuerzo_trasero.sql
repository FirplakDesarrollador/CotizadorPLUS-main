-- Corrige el montaje BLS36 ya desplegado: la escena trabaja en milimetros.
-- No modifica cortes, cantidades ni costos.
do $$
declare v uuid;
begin
  select id into v from public.cot_tipos_mueble where pref='BLS';
  if v is null then raise exception 'No existe BLS'; end if;

  update public.cot_piezas_plantilla
  set visualizacion='{"version":1,"funcion":"frente","plano":"XZ","intercambiar":true,"x":"I==0?L-282.6:2*L/3+TF","y":"I==0?L-P-TF:3.2","z":"0","giro":"I==0?0:90","confirmado":true,"nota":"Par de puertas cerrado y perpendicular en el rincón Lazy Susan, confirmado con BLS36.iges."}'::jsonb
  where tipo_mueble_id=v and nombre='frente';

  update public.cot_piezas_plantilla
  set visualizacion='{"version":1,"funcion":"travesano_posterior","plano":"XZ","intercambiar":true,"x":"TC+EP*0.70710678","y":"L-(AP+EP)*0.70710678","z":"TC","giro":"45","confirmado":true,"nota":"Refuerzo diagonal apoyado en el fondo izquierdo y dirigido hacia la esquina posterior a 45 grados, confirmado con BLS36.iges."}'::jsonb
  where tipo_mueble_id=v and nombre='refuerzo_trasero';
end $$;
