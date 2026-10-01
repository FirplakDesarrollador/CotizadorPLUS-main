-- Cada base o tapa estructural lleva cuatro tarugos por lateral: 8 por pieza.
-- Las bases de gaveta se excluyen porque son componentes internos de la gaveta.
update public.cot_piezas_plantilla
set tarugos = '8'
where nombre in ('base', 'tapa', 'base_tapa', 'base_tapa_division');
