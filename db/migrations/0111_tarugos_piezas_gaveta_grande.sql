-- Traseros y contraplacas de gaveta grande: tres tarugos por extremo,
-- lado derecho e izquierdo (6 tarugos por pieza).
-- El alcance se define por los nombres exactos de pieza en todas las tipologias.

update public.cot_piezas_plantilla p
set tarugos = 6,
    notas = concat_ws(' | ',
      nullif(trim(both ' |' from replace(
        coalesce(p.notas, ''),
        'Cuatro tarugos: dos al lado derecho y dos al izquierdo.',
        ''
      )), ''),
      'Seis tarugos: tres al lado derecho y tres al izquierdo.'
    ),
    updated_at = now()
where p.nombre in ('trasero_gaveta_grande', 'contraparche_grande')
  and coalesce(p.tarugos, 0) <> 6;
