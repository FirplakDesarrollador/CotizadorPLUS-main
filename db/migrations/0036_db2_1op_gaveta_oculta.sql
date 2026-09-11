-- Migración 0036: Soporte para tipología DB2-1OP (2 gavetas exteriores + 1 gaveta oculta interior)
-- Fuente: Simulación muebles CEMA filas 2275-2276 (CDB) y Hojas de Ruta reales HRJ DB22-2+INT / IC55-1PINT.

DO $$
DECLARE
  v_db_id uuid;
BEGIN
  SELECT id INTO v_db_id FROM cot_tipos_mueble WHERE pref = 'DB';
  IF v_db_id IS NULL THEN
    RAISE NOTICE 'Tipo DB no encontrado en cot_tipos_mueble';
    RETURN;
  END IF;

  -- 1. Regla default para n_cajones_ocultos
  DELETE FROM cot_reglas_config WHERE tipo_mueble_id = v_db_id AND variable = 'n_cajones_ocultos';
  INSERT INTO cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, activo, notas)
  VALUES (v_db_id, 'n_cajones_ocultos', 'true', '0', 5, true, 'DB: gavetas ocultas (default 0, sobreescrito por DB2-1OP)');

  -- 2. Desactivar frente genérico y trasero genérico cuando hay gavetas mixtas u ocultas
  UPDATE cot_piezas_plantilla
  SET formula_cantidad = 'n_cajones_pequenos>0 || n_cajones_ocultos>0 ? 0 : n_cajones'
  WHERE tipo_mueble_id = v_db_id AND nombre = 'frente';

  UPDATE cot_piezas_plantilla
  SET formula_cantidad = 'n_cajones_pequenos>0 || n_cajones_ocultos>0 ? 0 : n_cajones'
  WHERE tipo_mueble_id = v_db_id AND nombre = 'trasero_gaveta';

  -- 3. Traseros para gavetas pequeñas y ocultas (68mm de alto) y grandes (183mm de alto)
  UPDATE cot_piezas_plantilla
  SET formula_cantidad = 'n_cajones_ocultos>0 ? 2 : n_cajones_pequenos'
  WHERE tipo_mueble_id = v_db_id AND nombre = 'trasero_gaveta_pequena';

  UPDATE cot_piezas_plantilla
  SET formula_cantidad = 'n_cajones_ocultos>0 ? 1 : (n_cajones_pequenos>0 ? n_cajones-n_cajones_pequenos : 0)'
  WHERE tipo_mueble_id = v_db_id AND nombre = 'trasero_gaveta_grande';

  -- 4. Frentes de fachada exterior para tipologías con gavetas ocultas (DB2-1OP genera 2 frentes iguales en fachada)
  DELETE FROM cot_piezas_plantilla WHERE tipo_mueble_id = v_db_id AND nombre = 'frente_gaveta_exterior';
  INSERT INTO cot_piezas_plantilla (
    tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho,
    cantos, orden, visualizacion, notas
  ) VALUES (
    v_db_id, 'frente_gaveta_exterior', 'frente',
    'n_cajones_ocultos>0 ? (n_cajones-n_cajones_ocultos) : 0',
    'L-RV',
    '(A-(n_cajones-n_cajones_ocultos)*RV-gola*2.11024)/(n_cajones-n_cajones_ocultos)',
    '{"anchos":2,"largos":2}'::jsonb, 40,
    '{"funcion":"frente_gaveta","plano":"XZ"}'::jsonb,
    'Frentes de fachada exterior para tipologías con gavetas ocultas (DB2-1OP)'
  );

  -- 5. Frente interior embutido para la gaveta oculta (100 mm de alto)
  DELETE FROM cot_piezas_plantilla WHERE tipo_mueble_id = v_db_id AND nombre = 'frente_gaveta_interior';
  INSERT INTO cot_piezas_plantilla (
    tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho,
    cantos, orden, visualizacion, notas
  ) VALUES (
    v_db_id, 'frente_gaveta_interior', 'frente',
    'n_cajones_ocultos',
    'L-2*TC-RV',
    '100/25.4',
    '{"anchos":2,"largos":2}'::jsonb, 41,
    '{"funcion":"frente_interior","plano":"XZ"}'::jsonb,
    'Frente interior de gaveta oculta (100mm de alto embutido en luz interior)'
  );

  RAISE NOTICE 'Migración 0036 aplicada exitosamente en DB.';
END $$;
