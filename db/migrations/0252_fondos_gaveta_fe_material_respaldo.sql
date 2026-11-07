-- 2026-11-07: el piso de las gavetas DB-FE usa el mismo tablero que el backing.
-- Conserva dimensiones, cantidades, cantos y roles de las paredes del cajón.
begin;
update public.cot_piezas_plantilla p
set rol_tablero='fondo'
from public.cot_tipos_mueble t
where t.id=p.tipo_mueble_id
  and t.pref ~ '^DB(-.*)?-FE(-SF)?$'
  and p.nombre ~ '^(base_gaveta|fondo_gaveta)(_|$)'
  and p.rol_tablero is distinct from 'fondo';
commit;
