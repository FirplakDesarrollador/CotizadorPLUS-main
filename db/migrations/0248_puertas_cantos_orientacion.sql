-- Migration 0248: Corrección de reglas n_puertas, cantos de base/tapa/refuerzos/golas y orientación de fórmulas en frentes
-- Fecha: 2026-11-06
-- Descripción:
--   PUNTO 1: Cierra la brecha 21"–24" en reglas n_puertas (L<=21 → L<24)
--             La medida umbral es exactamente 24" = 609.6mm = 60.96cm
--   PUNTO 2: Corrige la orientación de fórmulas en piezas 'frente' donde formula_largo
--             tenía la expresión de alto (A-based) y formula_ancho la de ancho (L-based).
--             El motor orientarPieza() espera formula_largo=ancho, formula_ancho=alto.
--             Se intercambia y se pone intercambiar=false donde corresponde.
--   PUNTO 3: Piezas base, tapa, base_tapa, refuerzo* y gola* deben tener cantos.anchos=0.
--             Si además cantos.largos=0, se copia el valor de anchos a largos antes de zerear anchos.

begin;

-- =============================================================================
-- PUNTO 1: Reglas n_puertas — cierre de brecha 21"–24"
-- =============================================================================
-- Antes: condicion = 'L <= 21'  → 1 puerta  (brecha: 21"–23.99" iba al default true→1)
-- Ahora: condicion = 'L < 24'   → 1 puerta  (cubre todo hasta <24" = <609.6mm)
UPDATE cot_reglas_config
SET condicion = 'L < 24'
WHERE variable = 'n_puertas'
  AND condicion = 'L <= 21'
  AND activo = true;

-- =============================================================================
-- PUNTO 2: Orientación de fórmulas en piezas rol_tablero='frente'
-- =============================================================================
-- Para las tipologías identificadas con formula_largo=alto y formula_ancho=ancho,
-- intercambiamos ambas columnas. Las piezas 'entrepano*' y piezas de tipo refuerzo/gola_frame
-- quedan excluidas (ya tienen orientación correcta).
-- También se actualiza visualizacion.intercambiar a false donde era true (ya no es necesario
-- compensar en 3D porque los datos ahora son correctos).

UPDATE cot_piezas_plantilla
SET
  formula_largo = formula_ancho,
  formula_ancho = formula_largo,
  visualizacion = CASE
    WHEN visualizacion->>'intercambiar' = 'true'
    THEN jsonb_set(visualizacion, '{intercambiar}', 'false'::jsonb)
    ELSE visualizacion
  END
WHERE rol_tablero = 'frente'
  AND nombre NOT LIKE 'entrepano%'
  AND nombre NOT LIKE '%gola_frame%'
  AND nombre NOT LIKE 'refuerzo%'
  -- Solo se invierte cuando el eje original está realmente al revés.
  -- Incluye el frente de gaveta BOMH de alto constante; repetir no lo deshace.
  AND ((formula_largo ~ '\mA\M' AND formula_ancho !~ '\mA\M')
       OR (formula_largo !~ '\mL\M' AND formula_ancho ~ '\mL\M'))
  AND tipo_mueble_id IN (
    SELECT id FROM cot_tipos_mueble WHERE pref IN (
      'BLS', 'BLS-RS-SM',
      'BOV', 'BOV-SF',
      'CC',
      'POD',
      'UV', 'UDB',
      'UVFD', 'USVFD',
      'WLD',
      'WER',
      'WPC',
      'BOMH-1', 'BOMH-1-FE',
      'KF',
      'SLOC',
      'SB-SM', 'SBAS'
    )
  );

-- =============================================================================
-- PUNTO 3: Cantos — base, tapa, base_tapa, refuerzo*, gola* deben tener anchos=0
-- =============================================================================
-- Caso especial: si largos=0 y anchos>0 → copiar anchos a largos primero, luego anchos=0
UPDATE cot_piezas_plantilla
SET cantos = jsonb_set(
  jsonb_set(cantos, '{largos}', cantos->'anchos'),
  '{anchos}', '0'::jsonb
)
WHERE cantos IS NOT NULL
  AND (cantos->>'anchos')::int > 0
  AND (cantos->>'largos')::int = 0
  AND (((nombre ~ '^base(_|$)' AND nombre !~ '^base_gaveta(_|$)') OR nombre ~ '^tapa(_|$)')
       OR nombre LIKE '%refuerzo%'
       OR nombre LIKE '%gola%');

-- Caso general: anchos>0 y largos>0 → solo zerear anchos (no tocar largos)
UPDATE cot_piezas_plantilla
SET cantos = jsonb_set(cantos, '{anchos}', '0'::jsonb)
WHERE cantos IS NOT NULL
  AND (cantos->>'anchos')::int > 0
  AND (cantos->>'largos')::int > 0
  AND (((nombre ~ '^base(_|$)' AND nombre !~ '^base_gaveta(_|$)') OR nombre ~ '^tapa(_|$)')
       OR nombre LIKE '%refuerzo%'
       OR nombre LIKE '%gola%');

-- Caso nulo: anchos IS NULL → poner explícitamente en 0
UPDATE cot_piezas_plantilla
SET cantos = jsonb_set(cantos, '{anchos}', '0'::jsonb)
WHERE cantos IS NOT NULL
  AND cantos->>'anchos' IS NULL
  AND (((nombre ~ '^base(_|$)' AND nombre !~ '^base_gaveta(_|$)') OR nombre ~ '^tapa(_|$)')
       OR nombre LIKE '%refuerzo%'
       OR nombre LIKE '%gola%');


commit;
