-- Normaliza la grafía del calibre de canto: la `x` separadora va en minúscula.
--
-- `cot_cantos` era internamente inconsistente: `19X0,45`, `19X1` y `19X2` con X
-- mayúscula, contra `22x0,45`, `22x1` y `22x1 High Gloss` con x minúscula. Las
-- plantillas de pieza (`cot_piezas_plantilla.cantos->>'calibre'`) usan siempre
-- minúscula: 334 piezas con `19x0,45` y 74 con `22x1`, sin una sola mayúscula.
--
-- Esa discrepancia producía dos defectos visibles, porque el calibre llega de tres
-- sitios distintos: la plantilla de la pieza, el valor derivado del espesor del
-- tablero, y el override que el formulario toma de `cot_cantos`.
--
--   1. El listado de materiales partía un mismo canto en dos filas — las piezas de
--      caja con override caían en `19X0,45` y las de refuerzo, sin override, en
--      `19x0,45`.
--   2. En la HDR, la columna "Espesor canto" salía vacía para las piezas con
--      override: `espesorCantoLabel()` partía el texto por `x` minúscula.
--
-- El motor ya normalizaba para BUSCAR el precio, así que el costo siempre fue
-- correcto; lo que fallaba era la presentación. Además de esta migración, el motor
-- pasa a agrupar por clave normalizada y el HDR a partir el texto sin distinguir
-- mayúsculas, de modo que el defecto no puede reaparecer si entra otra grafía.

-- 1. Catálogo de cantos. Solo toca la `x` separadora que va tras los dígitos
--    iniciales, para no alterar nombres comerciales como `22x1 High Gloss`.
--    Ninguna fila colisiona al pasar a minúscula (`19x0,45`, `19x1` y `19x2` no
--    existían aún) y `calibre` no está referenciada por ninguna clave foránea.
update public.cot_cantos
set calibre = regexp_replace(calibre, '^([0-9]+)X', '\1x')
where calibre ~ '^[0-9]+X';

-- 2. Overrides ya guardados en las líneas de cotización. 44 de 47 líneas llevan
--    `cantoCaja: "19X0,45"`. Se normalizan para que el listado no se parta aunque
--    la línea no se vuelva a recalcular.
update public.cot_cotizacion_lineas
set config = jsonb_set(config, '{cantoCaja}',
      to_jsonb(regexp_replace(config->>'cantoCaja', '^([0-9]+)X', '\1x')))
where config->>'cantoCaja' ~ '^[0-9]+X';

update public.cot_cotizacion_lineas
set config = jsonb_set(config, '{cantoFrentes}',
      to_jsonb(regexp_replace(config->>'cantoFrentes', '^([0-9]+)X', '\1x')))
where config->>'cantoFrentes' ~ '^[0-9]+X';

-- 3. Mismo override en los valores por defecto del proyecto, si los hay.
update public.cot_cotizaciones
set config_default = jsonb_set(config_default, '{cantoCaja}',
      to_jsonb(regexp_replace(config_default->>'cantoCaja', '^([0-9]+)X', '\1x')))
where config_default->>'cantoCaja' ~ '^[0-9]+X';

update public.cot_cotizaciones
set config_default = jsonb_set(config_default, '{cantoFrentes}',
      to_jsonb(regexp_replace(config_default->>'cantoFrentes', '^([0-9]+)X', '\1x')))
where config_default->>'cantoFrentes' ~ '^[0-9]+X';
