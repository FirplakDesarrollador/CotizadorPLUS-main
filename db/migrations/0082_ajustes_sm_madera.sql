-- Ajustes posteriores a 0081 para las tipologías con sufijo comercial -SM.
-- No afecta SMO ni las familias existentes: solo BFD-SM, W-SM y W-SM-PUSH.

-- Las puertas SM inferiores descuentan 30 mm del alto exterior.
update public.cot_piezas_plantilla p
set formula_ancho = 'A-30/25.4',
    notas = 'Puerta SM inferior: alto del mueble menos 30 mm.',
    updated_at = now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'BFD-SM'
  and p.nombre = 'frente';

-- Toda tipología con sufijo -SM queda sin manijas. Las bisagras y demás
-- herrajes funcionales se conservan; W-SM-PUSH conserva además el Push.
delete from public.cot_herrajes_plantilla h
using public.cot_tipos_mueble t
where h.tipo_mueble_id = t.id
  and t.pref in ('BFD-SM','W-SM','W-SM-PUSH')
  and lower(h.rol) = 'manija';

-- Los superiores SM no llevan refuerzo GOLA adicional: se mantienen solo las
-- piezas de las hojas fuente. BFD-SM conserva su GOLA de madera explícita.
delete from public.cot_piezas_plantilla p
using public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref in ('W-SM','W-SM-PUSH')
  and p.nombre = 'gola_madera';

update public.cot_tipos_mueble
set notas = case pref
  when 'BFD-SM' then 'Gola de madera inferior; sin manijas. Puerta A - 30 mm.'
  when 'W-SM' then 'Sin manijas; conserva únicamente las piezas de la hoja WXXXX-SM.'
  when 'W-SM-PUSH' then 'Sin manijas; Push To Open y únicamente las piezas de WXXXX24-SM-PUSH.'
end,
updated_at = now()
where pref in ('BFD-SM','W-SM','W-SM-PUSH');
