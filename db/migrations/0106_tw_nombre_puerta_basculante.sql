-- Nombre comercial confirmado para TW. No modifica piezas, reglas, herrajes
-- ni formulas de la tipologia.

update public.cot_tipos_mueble
set nombre_es = 'Mueble superior puerta basculante',
    updated_at = now()
where pref = 'TW';
