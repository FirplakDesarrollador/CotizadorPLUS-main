-- El borde posterior de cada entrepaño termina contra la cara delantera del
-- BACKING: fondo en Y=P-TC-TB, entrepaño en Y=P-TC-TB-D.
update public.cot_piezas_plantilla p
set visualizacion = jsonb_set(
  coalesce(p.visualizacion, '{}'::jsonb),
  '{y}', to_jsonb('P-TC-TB-D'::text), true
)
from public.cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref = 'UW'
  and p.nombre in ('entrepano', 'entrepano_superior');
