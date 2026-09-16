-- Códigos de módulo de la familia W / PN guardados sin el alto.
--
-- `codigoComercial()` (src/lib/module-groups.ts) incluye el alto en el código de
-- los superiores de pared y los paneles: W2936 = 29 de largo, 36 de alto. La regla
-- vive en `PREFS_ALTO_EN_CODIGO` = W, WBL, WER, WLD, WPC, PN.
--
-- Antes de unificar el código en una sola función, el formulario de cotizaciones
-- armaba `pref + largo` sin el alto, así que quedaron líneas con el código corto
-- (`PN14` en vez de `PN1422`). `cotizaciones.ts` reescribe `codigo_modulo` en cada
-- recálculo, así que estas líneas se corregirían solas al volver a guardar la
-- cotización; se normalizan aquí de una vez, igual que hizo
-- `0041_codigo_modulo_medida_antes_del_sufijo.sql`.
--
-- La condición es estricta a propósito: solo toca filas cuyo código es
-- exactamente `pref || largo`. Un código con sufijo (`-SM`, `-1S`, `-2OP-PUSH`)
-- no coincide y queda intacto.
--
-- Solo se normalizan las líneas donde la unidad guardada ya es la del sistema del
-- proyecto (imperial→in, métrico→cm), que es lo que `anchoCodigo()` escribiría sin
-- convertir. Las demás combinaciones exigirían replicar la conversión de unidades
-- en SQL y se dejan al recálculo, que usa el motor real.
update public.cot_cotizacion_lineas l
set codigo_modulo = l.pref
                 || trim(trailing '.' from to_char(l.largo, 'FM9999999990.999999'))
                 || trim(trailing '.' from to_char(l.alto,  'FM9999999990.999999'))
from public.cot_cotizaciones c
where c.id = l.cotizacion_id
  and l.pref in ('W', 'WBL', 'WER', 'WLD', 'WPC', 'PN')
  and l.codigo_modulo = l.pref || trim(trailing '.' from to_char(l.largo, 'FM9999999990.999999'))
  and (
        (coalesce(c.sistema_medida, 'imperial') = 'imperial' and l.unidad_dim = 'in')
     or (c.sistema_medida = 'metrico' and l.unidad_dim = 'cm')
      );
