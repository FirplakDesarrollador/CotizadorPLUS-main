-- Acerca la Gola de madera a la cara interna del frente sin alterar su medida.
update public.cot_piezas_plantilla p
set visualizacion=jsonb_set(
      p.visualizacion || '{"nota":"Pegada a la cara interna del frente y bajo el refuerzo adicional."}'::jsonb,
      '{y}', '"0"'::jsonb, true
    ),
    updated_at=now()
from public.cot_tipos_mueble t
where p.tipo_mueble_id=t.id
  and t.pref='BBLFD-D-L/R-SM'
  and p.nombre='gola_madera';
