-- Alto de puerta B/UB/V: 0028 aplico A->A-RV (reveal 3.2mm) en W/BFD/SBFD/SVFD y 0032
-- lo extendio a UBFD/VFD/WBL, pero dejo B/UB/V sin tocar por falta de evidencia (su
-- pieza 'frente' seguia en formula_ancho='A', sin descontar el reveal) -- ver
-- WikiLLM/wiki/validacion_hojas_de_ruta.md "Pendiente tras 0032".
--
-- El usuario confirma la regla general: "todos los muebles de puertas como los SBFD,
-- los BFD... la altura es la altura del mueble - 3.2mm" -- aplica tambien a B/UB/V,
-- que usan exactamente el mismo patron de pieza 'frente' (formula_cantidad='n_puertas',
-- formula_largo='(L-n_puertas*RV)/n_puertas') que BFD/SBFD/SVFD/UBFD/VFD/W/WBL, solo
-- que su formula_ancho seguia en 'A' en vez de 'A-RV'.
update cot_piezas_plantilla p
set formula_ancho = 'A-RV'
from cot_tipos_mueble t
where p.tipo_mueble_id = t.id
  and t.pref in ('B', 'UB', 'V')
  and p.nombre = 'frente'
  and p.formula_ancho = 'A';
