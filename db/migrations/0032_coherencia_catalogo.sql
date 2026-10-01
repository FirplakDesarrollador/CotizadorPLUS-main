-- ============================================================================
-- Cotizador PLUS — extiende a todo el catálogo las correcciones que solo
-- se habían validado/aplicado en DB (0027/0028/0031).
--
-- 0028 corrigió por valor exacto de fórmula (WHERE formula_x = '...'), así que
-- sanó automáticamente cualquier tipo cuyas piezas ya tuvieran ese valor
-- viejo — pero algunas correcciones se restringieron a listas de tipos
-- explícitas (el reveal de alto de puerta) o nunca se escribieron para el
-- ancho de riel / trasero de gaveta en ningún tipo. Esta migración aplica lo
-- que ya está confirmado con evidencia independiente; lo que no, se deja
-- documentado como pendiente en WikiLLM/wiki/validacion_hojas_de_ruta.md.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ancho de riel/refuerzo: 82,55mm (3.25 in) -> 80mm (3.14961 in)
--
-- Confirmado universal, no solo de DB: es el mismo valor que ya usa
-- `gola_perfil` (0028) y las 29 tipologías generadas desde hojas de ruta
-- reales (0029) para su `refuerzo_delantero`/`refuerzo_trasero`. La regla del
-- usuario (protocolo Firplak §3.3) también lo describe como estándar
-- general de fabricación, no específico de un tipo. Afecta ~23 tipos que
-- nunca se tocaron porque 0028 no incluía este ancho entre sus reemplazos.
-- ----------------------------------------------------------------------------
update public.cot_piezas_plantilla
   set formula_ancho = '3.14961'
 where formula_ancho = '3.25';

-- ----------------------------------------------------------------------------
-- 2. Largo de trasero_gaveta: mismo defecto que tenía DB antes de 0031
--
-- `L-3.427` es la misma fórmula sin corregir que tenía DB (0031 la cambió a
-- `L-4.607`, confirmado contra DB24-2). Los tipos generados desde hojas
-- reales en 0029 (POD, UV, BMW, UDB) ya usan `L-4.6063` de forma
-- independiente — confirma que el offset es geométrico/universal, no un
-- artefacto de la tipología DB. No se toca BBL (`L-30.427`, geometría de
-- esquinero ciego distinta) ni KD (`L-2.4311`, kit de cajones aparte).
--
-- El ANCHO (2.6875 in = 68mm) de estos mismos tipos NO se toca aquí: a
-- diferencia del largo, si esa altura debe ser 68mm (cajón corto, como en
-- POD/UV/BMW) o 183mm (cajón estándar, como el trasero_gaveta_grande de DB)
-- depende de cada familia y no hay hoja de ruta puntual para confirmarlo por
-- tipo. Queda como pendiente documentado.
-- ----------------------------------------------------------------------------
update public.cot_piezas_plantilla
   set formula_largo = 'L-4.607'
 where nombre = 'trasero_gaveta'
   and formula_largo = 'L-3.427';

-- ----------------------------------------------------------------------------
-- 3. Reveal de alto de puerta en UBFD/VFD/WBL
--
-- Mismo patrón exacto que W/BFD/SBFD/SVFD (0028 §3): puerta sobrepuesta
-- simple, ya con el reveal aplicado en el ancho (`(L-n_puertas*RV)/n_puertas`)
-- pero no en el alto (`A` sin descuento). UBFD es la versión "línea U" de
-- BFD (ya corregido); VFD es el equivalente vanity de BFD/SBFD (puerta simple,
-- sin cajón); WBL es el equivalente esquinero de W (ya corregido), con la
-- misma fórmula de puerta. No se tocan B, UB ni V: los tres tienen 1 cajón +
-- puertas (como B) y la wiki documenta que B necesita una fórmula de alto
-- propia (~A-158.8mm, aún sin derivar de hojas reales) en vez de A-RV.
-- ----------------------------------------------------------------------------
update public.cot_piezas_plantilla p
   set formula_ancho = 'A-RV'
 where p.formula_ancho = 'A'
   and p.rol_tablero = 'frente'
   and exists (
     select 1 from public.cot_tipos_mueble t
      where t.id = p.tipo_mueble_id and t.pref in ('UBFD', 'VFD', 'WBL')
   );
