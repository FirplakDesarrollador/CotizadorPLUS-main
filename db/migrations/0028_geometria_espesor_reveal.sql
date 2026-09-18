-- ============================================================================
-- Cotizador PLUS — geometría parametrizada por espesor + reveal de frentes
--
-- Correcciones deducidas de 1.937 hojas de ruta reales de producción
-- (ver WikiLLM/wiki/validacion_hojas_de_ruta.md). Requiere el motor con las
-- variables geométricas RV/TC/TF/TB inyectadas (src/lib/engine.ts, geoVars()).
--
--   RV = reveal entre frentes           = 3.2 mm  (0.12598 in)
--   TC = espesor del tablero de "caja"   (in)
--   TF = espesor del tablero de "frente" (in)
--   TB = espesor del tablero de "fondo"  (in)
--
-- Aplicar DESPUÉS de desplegar el código: una fórmula que referencie TC contra
-- un motor viejo lanza ReferenceError.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. La constante interior es 2 × espesor del lateral, no un número fijo
--
-- Las hojas de ruta dan L-30 con laterales de 15 mm, L-36 con 18 mm, L-50 con
-- 25 mm y L-60 con 30 mm: es exactamente 2*TC. La plantilla tenía L-1.18
-- (= L-29.97 mm) codificado en 57 filas, así que todo mueble con carcasa de
-- 18 mm salía con las piezas interiores 6 mm largas. La carcasa de 18 mm pasó
-- del 2 % de las hojas en 2024 al 33 % en 2026.
--
-- Para 15 mm el cambio es de 0.03 mm (L-1.18 -> L-1.1811): sin efecto práctico
-- sobre las cotizaciones existentes.
-- ----------------------------------------------------------------------------
update public.cot_piezas_plantilla set formula_largo = 'L-2*TC'
 where formula_largo in ('L-1.18', 'L-1.181');
update public.cot_piezas_plantilla set formula_ancho = 'L-2*TC'
 where formula_ancho in ('L-1.18', 'L-1.181');

-- L-0.59 (= un solo espesor) aparece en piezas que topan contra un único lateral.
update public.cot_piezas_plantilla set formula_largo = 'L-TC' where formula_largo = 'L-0.59';
update public.cot_piezas_plantilla set formula_ancho = 'L-TC' where formula_ancho = 'L-0.59';

-- Mismo criterio en la fórmula agrupada: el largo del grupo descuenta espesores reales.
update public.cot_piezas_plantilla set formula_largo_grupo = 'LG-2*TC'
 where formula_largo_grupo in ('LG-1.18', 'LG-1.181');

-- ----------------------------------------------------------------------------
-- 2. El ancho de la base sigue el espesor del fondo
--
-- Observado: base = P - 18 mm - espesor_fondo. Con fondo de 6 mm da P-24 mm y
-- con fondo de 9 mm (variante -F9) da P-27 mm. La plantilla tenía P-0.9
-- (= P-22.86 mm) fijo, que no reaccionaba al fondo.
--
-- Esto resuelve además la duda que quedó abierta el 2026-08-11 en la validación
-- de DB ("ancho de base P-0.9 -> P-0.945?"): 0.94488 in = 24 mm es justamente
-- 0.70866 + TB con fondo de 6 mm.
-- ----------------------------------------------------------------------------
update public.cot_piezas_plantilla set formula_ancho = 'P-0.70866-TB'
 where formula_ancho = 'P-0.9' and nombre in ('base', 'base_tapa');

-- ----------------------------------------------------------------------------
-- 3. Reveal en puertas
--
-- Ancho (regla universal, confirmada en W, UW, B, BFD, SBFD, PC): las puertas
-- reparten L menos un reveal por puerta. Con 2 puertas L-6.4 mm, con 1 puerta
-- L-3.2 mm. La plantilla repartía L completo, así que cada puerta salía
-- 3.2 mm más ancha que la de producción.
-- ----------------------------------------------------------------------------
update public.cot_piezas_plantilla set formula_largo = '(L-n_puertas*RV)/n_puertas'
 where formula_largo = 'L/n_puertas';

-- Alto: la regla SÍ depende de la familia, así que solo se corrigen las medidas
-- verificadas. W/BFD/SBFD/SVFD usan puerta sobrepuesta = A-3.2 mm.
--
-- NOTA: en BFD y SBFD convive una segunda población con A-30 mm (= A-2*TC), que
-- es la puerta EMBUTIDA entre base y tapa. No es legado — aparece todos los años
-- —, pero la sobrepuesta es mayoritaria y creciente (2026: 14 vs 3 en BFD). Si se
-- decide ofrecer la embutida, debe modelarse como variante de frente, no
-- cambiando este default. B, UW y PC tienen reglas propias (A-158.8, A-199.2 y
-- torres multi-puerta) y NO se tocan aquí.
update public.cot_piezas_plantilla p set formula_ancho = 'A-RV'
 where p.formula_ancho = 'A'
   and p.rol_tablero = 'frente'
   and exists (
     select 1 from public.cot_tipos_mueble t
      where t.id = p.tipo_mueble_id and t.pref in ('W', 'BFD', 'SBFD', 'SVFD')
   );

-- ----------------------------------------------------------------------------
-- 4. Variante de frente: gola (SM/SMG)
--
-- Variable transversal, 0 = manija (default), 1 = gola. Se sobreescribe por
-- línea desde el formulario. Ver WikiLLM/wiki/variantes_frente_gola_sm.md.
--
-- La gola consume 53.6 mm (2.11024 in) del alto disponible para la pila de
-- frentes, repartidos en proporción a la altura de cada frente. Constante en
-- las 25 hojas SM con pares verificados.
-- ----------------------------------------------------------------------------
insert into public.cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, notas)
select null, 'gola', 'true', '0', 5,
       'Sistema de frente: 0 = manija, 1 = gola. Override por línea.'
 where not exists (
   select 1 from public.cot_reglas_config where variable = 'gola' and tipo_mueble_id is null
 );

-- ----------------------------------------------------------------------------
-- 5. Reparto de frentes de gaveta en DB
--
-- La regla de 0027 ("pequeña 6 in fija, grandes reparten el resto") solo es
-- correcta para DB-1S. DB-2S usa una rejilla de 4 unidades: las dos pequeñas
-- toman 1 unidad y la grande toma 2.
--
--   DB-1S: 152.4 / 300.1 / 300.1   (pequeña fija 6 in)
--   DB-2S: 187.3 / 187.3 / 377.8   (unidad = (A-4*RV)/4)
--
-- Con la fórmula anterior un DB-2S daba 152.4 / 152.4 / 447.6: -34.9 mm en las
-- pequeñas y +69.8 mm en la grande.
--
-- `alto_frente_pequeno_base` fija el alto de la gaveta pequeña según tipología y
-- `alto_frente_pequeno` le aplica el descuento proporcional de la gola.
-- ----------------------------------------------------------------------------
delete from public.cot_reglas_config
 where variable in ('alto_frente_pequeno_base', 'alto_frente_pequeno')
   and tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB');

insert into public.cot_reglas_config (tipo_mueble_id, variable, condicion, valor, prioridad, notas)
select id, 'alto_frente_pequeno_base', 'n_cajones_pequenos>=2', '(A-4*RV)/4', 10,
       'DB-2S: rejilla de 4 unidades; la pequeña toma 1 unidad'
  from public.cot_tipos_mueble where pref = 'DB'
union all
select id, 'alto_frente_pequeno_base', 'n_cajones_pequenos==1', '6', 20,
       'DB-1S: la gaveta pequeña mide 6 in fijas'
  from public.cot_tipos_mueble where pref = 'DB'
union all
select id, 'alto_frente_pequeno_base', 'true', '0', 99,
       'Tipologías parejas (DB-2/3/4): no hay gaveta pequeña'
  from public.cot_tipos_mueble where pref = 'DB'
union all
-- Descuento de gola proporcional a la altura del frente.
select id, 'alto_frente_pequeno', 'true',
       'alto_frente_pequeno_base*(A-n_cajones*RV-gola*2.11024)/(A-n_cajones*RV)', 10,
       'Alto de la gaveta pequeña, ya descontada la gola'
  from public.cot_tipos_mueble where pref = 'DB';

-- Frentes de gaveta: el ancho de la pieza (horizontal) también lleva reveal.
-- Observado L-3.2 mm en todas las hojas DB; la plantilla usaba L completo.
update public.cot_piezas_plantilla
   set formula_largo = 'L-RV'
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
   and nombre in ('frente', 'frente_gaveta_pequena', 'frente_gaveta_grande')
   and formula_largo = 'L';

-- Tipologías parejas (DB-2/3/4): reparto con reveal y gola.
-- Antes A/n_cajones daba 254.0 mm en un DB-3 contra 250.8 mm reales.
update public.cot_piezas_plantilla
   set formula_ancho = '(A-n_cajones*RV-gola*2.11024)/n_cajones'
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
   and nombre = 'frente'
   and formula_ancho = 'A/n_cajones';

update public.cot_piezas_plantilla
   set formula_ancho = 'alto_frente_pequeno'
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
   and nombre = 'frente_gaveta_pequena';

update public.cot_piezas_plantilla
   set formula_ancho = '(n_cajones-n_cajones_pequenos)>0'
                    || ' ? (A-n_cajones*RV-gola*2.11024-n_cajones_pequenos*alto_frente_pequeno)'
                    || '/(n_cajones-n_cajones_pequenos) : 0'
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
   and nombre = 'frente_gaveta_grande';

-- ----------------------------------------------------------------------------
-- 6. Piezas de gola en DB
--
-- Con gola, las hojas agregan 2 piezas GOLA de (L-2*TC) x 80 mm en el mismo
-- material de la caja y bajan los refuerzos delanteros de 3 a 2.
-- 80 mm = 3.14961 in.
-- ----------------------------------------------------------------------------
insert into public.cot_piezas_plantilla
  (tipo_mueble_id, nombre, rol_tablero, formula_cantidad, formula_largo, formula_ancho,
   cantos, orden, tarugos, soportes, notas)
select id, 'gola_perfil', 'caja', 'gola*2', 'L-2*TC', '3.14961',
       '{"calibre":"19x0,45","largos":2,"anchos":0,"despEdges":0}'::jsonb, 45, 0, 0,
       'Perfil de gola en melamina; solo cuando gola=1'
  from public.cot_tipos_mueble where pref = 'DB'
   and not exists (
     select 1 from public.cot_piezas_plantilla p
      where p.tipo_mueble_id = cot_tipos_mueble.id and p.nombre = 'gola_perfil'
   );

-- Con gola se retira un refuerzo delantero (3 -> 2 en las hojas SM).
update public.cot_piezas_plantilla
   set formula_cantidad = '(' || formula_cantidad || ')-gola'
 where tipo_mueble_id = (select id from public.cot_tipos_mueble where pref = 'DB')
   and nombre = 'refuerzo_delantero'
   and formula_cantidad not like '%gola%';

-- ----------------------------------------------------------------------------
-- Verificación
-- ----------------------------------------------------------------------------
-- select nombre, formula_largo, formula_ancho
--   from cot_piezas_plantilla
--  where formula_largo like '%TC%' or formula_ancho like '%TB%' or formula_largo like '%RV%'
--  order by nombre;
