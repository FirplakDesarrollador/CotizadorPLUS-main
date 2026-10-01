-- ============================================================================
-- Cotizador PLUS — variante transversal "removible" (sufijo comercial R)
--
-- Se aplica SOLO a las familias con pares base/R verificados en las hojas de
-- ruta. Fuera de esa lista la opción queda bloqueada en la UI
-- (src/lib/muebles.ts -> PREFS_CON_REMOVIBLE): la regla estructural no se
-- extrapola a familias sin datos.
--
-- Evidencia (USVFD 36 hojas vs USVFDR 16 hojas, misma medida):
--   * aparece un refuerzo delantero adicional de 140 mm (5.51181 in);
--   * aparece un refuerzo trasero adicional de 120.75 mm (4.75394 in);
--   * la base se hace más profunda: P-TC en vez de P-18mm-espesor_fondo.
--
-- Aplicar después de 0029_tipologias_nuevas.sql.
-- ============================================================================

-- Variable transversal: 0 = fijo (default), 1 = removible. Override por línea.
insert into public.cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, notas)
select null, 'removible', 'true', '0', 5,
       'Variante de panel removible. Override por línea; solo familias verificadas.'
 where not exists (
   select 1 from public.cot_reglas_config where variable = 'removible' and tipo_mueble_id is null
 );

do $$
declare
  v_pref text;
  v_id   uuid;
begin
  foreach v_pref in array array['USVFD', 'USBFD', 'UB', 'UDB', 'UBFD'] loop
    select id into v_id from public.cot_tipos_mueble where pref = v_pref;
    continue when v_id is null;

    -- Refuerzos adicionales que solo existen en la variante removible.
    insert into public.cot_piezas_plantilla
      (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
    select v_id, 'refuerzo_delantero_removible', 'refuerzo', 'removible', 'L-2*TC', '5.51181',
           '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 200
     where not exists (
       select 1 from public.cot_piezas_plantilla
        where tipo_mueble_id = v_id and nombre = 'refuerzo_delantero_removible'
     );

    insert into public.cot_piezas_plantilla
      (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho, cantos, orden)
    select v_id, 'refuerzo_trasero_removible', 'refuerzo', 'removible', 'L-2*TC', '4.75394',
           '{"calibre":"19x0,45","largos":2,"anchos":0}'::jsonb, 210
     where not exists (
       select 1 from public.cot_piezas_plantilla
        where tipo_mueble_id = v_id and nombre = 'refuerzo_trasero_removible'
     );

    -- La base gana profundidad cuando el panel es removible.
    update public.cot_piezas_plantilla
       set formula_ancho = 'removible ? P-TC : (' || formula_ancho || ')'
     where tipo_mueble_id = v_id
       and nombre = 'base'
       and formula_ancho not like '%removible%';
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Verificación
-- ----------------------------------------------------------------------------
-- select t.pref, p.nombre, p.formula_cantidad, p.formula_largo, p.formula_ancho
--   from cot_piezas_plantilla p join cot_tipos_mueble t on t.id = p.tipo_mueble_id
--  where p.formula_cantidad like '%removible%' or p.formula_ancho like '%removible%'
--  order by t.pref, p.orden;
