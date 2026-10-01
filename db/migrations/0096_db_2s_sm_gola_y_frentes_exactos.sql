-- Corrección exclusiva DB26-2S-SM.
-- Las Golas de madera usan la misma convención de nombre de las tipologías SM.
-- La hoja distribuye el descuento de las dos Golas en 13,4 mm por frente
-- pequeño y deja el saldo en el frente grande: 173,9 / 173,9 / 351 mm.

update public.cot_piezas_plantilla p
set nombre = 'gola_madera',
    notas = 'Gola de madera DB-2S-SM (superior e inferior).',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and p.nombre = 'gola_perfil';

update public.cot_reglas_config r
set valor = 'alto_frente_pequeno_base-gola*(13.4/25.4)',
    notas = 'DB-2S-SM: cada frente pequeño descuenta exactamente 13,4 mm por las Golas.',
    updated_at = now()
from public.cot_tipos_mueble t
where t.id = r.tipo_mueble_id
  and t.pref = 'DB-2S-SM'
  and r.variable = 'alto_frente_pequeno';
