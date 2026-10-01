-- Sustituye el soporte de entrepaño anterior por la referencia metálica de 5mm.
-- Se conserva el selector normalizado `soporte`, usado por el motor.
update public.cot_herrajes
set activo = false,
    updated_at = now()
where selector_key = 'soporte'
  and codigo <> 'SOPORTE ENTREPAÑO METALICO 5MM';

insert into public.cot_herrajes
  (codigo, nombre, categoria, selector_key, precio, unidad, activo, notas)
values
  ('SOPORTE ENTREPAÑO METALICO 5MM', 'SOPORTE ENTREPAÑO METALICO 5MM', 'consumible', 'soporte', 45.7, 'und', true, 'Soporte entrepaño metálico 5mm')
on conflict (codigo) do update set
  nombre = excluded.nombre,
  categoria = excluded.categoria,
  selector_key = excluded.selector_key,
  precio = excluded.precio,
  unidad = excluded.unidad,
  activo = excluded.activo,
  notas = excluded.notas,
  updated_at = now();
