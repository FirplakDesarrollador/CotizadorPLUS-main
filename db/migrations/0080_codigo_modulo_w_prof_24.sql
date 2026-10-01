-- Normaliza el código comercial de los superiores W con profundidad de 24 in.
--
-- `codigoComercial()` concatena la profundidad a W cuando equivale a 24 in:
-- W3020 con profundidad 24 pasa a W302024. Se admiten códigos sin sistema de
-- frente y con el sufijo -SM. La condición conserva la unidad compatible con
-- el sistema del proyecto, como la migración 0046, para no replicar aquí una
-- conversión de unidades que corresponde al motor.
--
-- Es idempotente: solo coincide con el formato anterior sin la profundidad.
update public.cot_cotizacion_lineas l
set codigo_modulo = l.pref
                 || trim(trailing '.' from to_char(l.largo, 'FM9999999990.999999'))
                 || trim(trailing '.' from to_char(l.alto,  'FM9999999990.999999'))
                 || trim(trailing '.' from to_char(l.prof,  'FM9999999990.999999'))
                 || case when l.codigo_modulo like '%-SM' then '-SM' else '' end
from public.cot_cotizaciones c
where c.id = l.cotizacion_id
  and l.pref = 'W'
  and (
        (coalesce(c.sistema_medida, 'imperial') = 'imperial'
          and l.unidad_dim = 'in'
          and abs(l.prof - 24) < 0.001)
     or (c.sistema_medida = 'metrico'
          and l.unidad_dim = 'cm'
          and abs(l.prof - 60.96) < 0.001)
      )
  and l.codigo_modulo in (
        l.pref
          || trim(trailing '.' from to_char(l.largo, 'FM9999999990.999999'))
          || trim(trailing '.' from to_char(l.alto, 'FM9999999990.999999')),
        l.pref
          || trim(trailing '.' from to_char(l.largo, 'FM9999999990.999999'))
          || trim(trailing '.' from to_char(l.alto, 'FM9999999990.999999'))
          || '-SM'
      );
