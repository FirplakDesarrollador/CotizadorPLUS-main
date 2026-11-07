-- Regla confirmada el 2026-11-06: hasta 23 pulgadas, P-38,1 mm;
-- por encima de 23 pulgadas (incluido 24), P-50,8 mm.
-- B/B-FE conservan 300 mm; B-SF usa 350 mm. No cambia cantidad ni largo.
begin;
update public.cot_piezas_plantilla p
set formula_ancho = case
      when t.pref = 'B-SF' then '350/25.4'
      when t.pref in ('B','B-FE','B-FE-SF') then '300/25.4'
      else 'P <= 23.000000001 ? P-1.5 : P-2'
    end,
    resta_ancho = 0
from public.cot_tipos_mueble t
where t.id = p.tipo_mueble_id
  and p.nombre ~ '^entrepano(_|$)';
commit;
