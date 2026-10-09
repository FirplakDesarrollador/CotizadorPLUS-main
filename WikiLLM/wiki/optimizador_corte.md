# Optimizador de corte (en diseño)

Funcionalidad planeada: generar el plan de corte de una cotización (láminas por material, acomodo
en guillotina, secuencia y número de cortes, sobrantes y etiquetas). Plan completo en
`docs/plan_optimizador_corte.md`.

Puntos clave:
- Reutiliza el despiece de `calcularMueble`, los tableros del preset y `cot_tableros.formato`.
- `cot_tableros.formato` hoy mezcla `183X244`, `183x244`, `122X244`, `124X246` y `280X207`: hay que
  normalizarlo antes de usarlo como medida de lámina.
- El optimizador irá en `src/lib/corte/`, como módulo puro probado con tests (igual que el motor).
- No garantiza el óptimo matemático; busca soluciones a 1–3 % y reporta el mínimo teórico.
- Depende de cerrar las diferencias de despiece de [comparacion_hojas_ruta_lote_0930.md](comparacion_hojas_ruta_lote_0930.md).

## Condiciones de planta confirmadas (2026-10-07)
Seccionadora Holz-Her, disco 4,4 mm, pila de 4 láminas en 15 mm y 3 en 18 mm, la lámina gira,
refilado 5 mm por lado (máx. 9) solo donde hay zona usada, sobrante útil ≥ 1000 × 500 mm, formatos
2440 × 1830 y 2460 × 1240 mm, textura *soft* rota veta (rustick/amazonas por confirmar). Criterio:
desperdicio ≤ 15 % por material, pocos sobrantes y, si queda uno, en la última lámina.
Consecuencia de diseño: la pila obliga a priorizar **patrones repetidos** (láminas idénticas en
múltiplos de 3 o 4) y a contar los cortes por pila. Detalle en `docs/plan_optimizador_corte.md` §4.1.

## Fase 1 implementada (2026-10-07): pestaña Optimizador
- Ruta `/optimizador` (solo admin), en el menú entre HDR y Manual (`src/components/AppHeader.tsx`).
- Parámetros de planta en `cot_parametros.optimizador` (migración `0180`, aplicada). Se leen y
  validan con `normalizarConfig` (`src/lib/corte/config.ts`): llaves faltantes toman el valor por
  defecto, el refilado no pasa del máximo, los formatos se normalizan a mayúsculas y largo = lado mayor.
- Lista de corte en `src/lib/corte/lista.ts` (`construirListaCorte`): agrupa por material + medida +
  enchape, multiplica por la cantidad de la línea y suma las fracciones de módulos agrupados antes de
  redondear. Por material calcula láminas mínimas (con disco y refilado), máximo de láminas para cumplir
  el desperdicio y el desperdicio mínimo alcanzable.
- **Piezas por día** → días de producción y reparto diario (`repartoDiario`).
- El despiece sale de `modulosDeCotizacionAction` (HDR): motor vigente, grupos incluidos.
- La textura por material se elige en pantalla pero aún no se guarda.
- Pruebas: `tests/optimizador-corte.test.ts`, lane `lane:cutting` en `quality/manifest.json`.
- Hallazgo con "Prueba Uno": 199 piezas; en frentes 18 mm y fondo 6 mm el volumen (< 2 láminas) no
  permite bajar del 15 % de desperdicio. Hay que decidir si el sobrante ≥ 1000 × 500 cuenta como desperdicio.
