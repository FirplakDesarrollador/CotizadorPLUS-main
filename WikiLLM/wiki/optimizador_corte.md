# Optimizador de corte

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
- **Piezas por día** → días de corte y qué módulos van en cada uno, ver abajo.
- El despiece sale de `modulosDeCotizacionAction` (HDR): motor vigente, grupos incluidos. Unidades =
  cantidad de la línea × repeticiones del área; separación Muebles/Paneles/Fillers, ver abajo (2026-11-12).
- La textura por material se elige en pantalla pero aún no se guarda.
- Pruebas: `tests/optimizador-corte.test.ts`, lane `lane:cutting` en `quality/manifest.json`.
- Hallazgo con "Prueba Uno": 199 piezas; en frentes 18 mm y fondo 6 mm el volumen (< 2 láminas) no
  permite bajar del 15 % de desperdicio. Hay que decidir si el sobrante ≥ 1000 × 500 cuenta como desperdicio.

## Muebles, Paneles y Fillers; unidades con repeticiones de área (2026-11-12)

**Error corregido:** `proyectoDesdeCotizacionAction` tomaba solo la cantidad de la línea e ignoraba la
cantidad del área (`cot_cocinas.cantidad`, p. ej. "APTO A COCINA 1" × 6). En Condominio V (Ramstack CR)
mostraba 476 unidades y 1.467 piezas cuando el proyecto real tiene 2.868 unidades y 8.856 piezas.
Ahora cada módulo lleva `cantidad = cantidad de la línea × repeticiones del área` (`unidadesFisicas`),
igual que HDR y consumos; la lista de corte, el plan por días y los esquemas usan esas unidades.

**Clasificación en Supabase (migración `0260_tipos_grupo_optimizador.sql`, aplicada):** columna
`cot_tipos_mueble.grupo_optimizador` (`mueble` | `panel` | `filler`, NOT NULL, check). Se llenó desde
`margen_key`: `muebles` → mueble (inferior, superior, vanity, closet, kit y piezas BT/DF/E); `pn_tk` → panel
(PN, PN-SF, zócalo TK y complementos D/R); `fillers` → filler (F, F-SF). Un trigger asigna el grupo a los
tipos nuevos según su `margen_key`; se puede cambiar a mano por tipo. El código
(`src/lib/corte/clasificacion.ts`, `grupoDeTipo`) usa la columna y, si falta, cae al `margen_key`.

**Lo que trae la acción:** todas las líneas con `tipo_mueble_id` de la cotización (cocinas y líneas sueltas,
grupos físicos incluidos). Los artículos de "+ Agregar herrajes/otros" no son módulos y no entran. Cada
módulo lleva `grupo`, `pref`, `medidas` cotizadas, `cantidadLinea`, `repeticionesArea`,
`mueblesPorModulo` (un grupo con laterales compartidos aporta todos sus muebles al conteo) y `firma` del
despiece. Las líneas que el motor no logra calcular quedan en `errores` con su grupo y unidades, a la vista.

**Pantalla:** tres tarjetas (Muebles, Paneles, Fillers) con unidades, líneas, piezas y líneas sin calcular;
"Unidades" total. "Módulos del proyecto" filtra por grupo y junta solo líneas con el mismo código **y el
mismo despiece** (otra medida = otra fila), con columna de medidas y la repetición del área. El Excel
exportado suma las unidades por grupo en la hoja general.

**Verificación:** Condominio V → 444 muebles (64 líneas), 2.058 paneles (121, 54 despieces distintos) y
366 fillers (30), 0 errores; coincide con el conteo directo en la base. Las 12 cotizaciones del sistema
cuadran contra la base (2 líneas en otras cotizaciones no se calculan y quedan visibles como error).
Pruebas: `tests/optimizador-grupos.test.ts` (lane `lane:cutting` y lanes de HDR/optimizador).
Los guardados anteriores conservan sus cifras (snapshot); se corrigen al volver a cargar la cotización.

### Zócalos aparte y piezas por grupo (2026-11-12)

Migración `0261_tipos_grupo_optimizador_zocalo.sql` (aplicada): el check admite `zocalo` y TK (categoria
`zocalo`) pasa a ese grupo; PN, PN-SF, D y R siguen en panel. El trigger da `zocalo` a los tipos nuevos con
categoria `zocalo`; `grupoDeTipo` hace lo mismo como respaldo. La pantalla muestra cuatro tarjetas con las
**piezas** de cada grupo (Muebles, Paneles, Fillers, Zócalos (TK)), con unidades y líneas como detalle, y una
tarjeta final **Total piezas** con la sumatoria. El Excel suma unidades y piezas por grupo y el total.
Condominio V: muebles 6.432, paneles 1.902, fillers 366, zócalos 156 → **8.856** piezas.

## Plan de corte por día (2026-10-14)
`src/lib/corte/plan-diario.ts` (`planDiarioDeCorte`) responde *cuántos días de corte* y *qué
módulos y cuántas unidades* van en cada día. Reemplaza al antiguo `repartoDiario`, que solo
partía el total de piezas en bandas y no decía qué cortar: ahora el número de días sale del
reparto real de módulos, no de una división.

**Dos reglas decididas con producción:**
1. **Agrupado por material.** Se atiende primero el tablero con más volumen y dentro de cada
   material se respeta el orden de la cotización. Así se cambia de tablero lo menos posible en la
   seccionadora, al precio de que una cocina puede quedar repartida en varios días.
2. **Las unidades se pueden partir.** Un módulo de 10 unidades sale 6 un día y 4 el siguiente, de
   modo que cada jornada se llena hasta el ritmo. Los tramos partidos se marcan con *(parte)*.

El material que ordena el plan es el **principal** de cada módulo: el tablero que más piezas le
aporta (`materialPrincipal`), con empate resuelto alfabéticamente para que el plan sea estable.
Un módulo usa varios tableros, así que la columna no es la lista completa de materiales del día.

**Nunca se pasa del ritmo**, con una excepción que se avisa en pantalla: si *una sola unidad* ya
trae más piezas que el ritmo (una torre frente a un ritmo mal puesto), ocupa su día sola y el plan
lo dice en lugar de trocear la unidad en silencio.

**El total del plan puede no cuadrar con la lista de corte.** El plan suma el despiece por módulo;
la lista de corte redondea una sola vez por medida, y los módulos agrupados aportan piezas
compartidas en fracciones (lateral × 1,5). Cuando difieren, la pantalla explica por qué.

**Hoy no se ve nada**: `piezasPorDia` sigue en **0** en `cot_parametros.optimizador` por decisión
del usuario. El plan aparece en cuanto se escriba un ritmo en la pestaña.

Pruebas: `tests/plan-diario-corte.test.ts`, 14 casos, en el lane `lane:cutting`. Cubren los
invariantes (ninguna jornada pasa del ritmo, el plan corta todo el proyecto, días consecutivos sin
huecos, nunca menos días que la cota teórica) además del orden por material, el reparto de
unidades, las fracciones, la unidad que excede el ritmo y las cantidades inválidas.

## Esquemas de corte: el acomodo real (2026-10-14)
`src/lib/corte/guillotina.ts` (`optimizarMaterial`, `esquemasDesdeLista`) es la **fase 2** del plan:
acomoda las piezas en la lámina y responde lo que pide planta —esquema por material, desperdicio,
m² y número de tableros—. El botón «Optimizar corte», antes deshabilitado, ya corre.

### Cómo acomoda
La máquina es una seccionadora: cada corte va de lado a lado, así que el acomodo es **por franjas**
horizontales. Dentro de una franja las piezas van una al lado de la otra (2.º nivel) y, si una pieza
es más baja que su franja, hace falta un recorte de **3.er nivel**: por eso con `nivelesCorte < 3`
todas las piezas de una franja tienen que medir lo mismo de alto.

No hay un algoritmo único: se prueban **20 combinaciones** y gana la mejor según el criterio de
planta (primero menos tableros; a igualdad, la que deje la última lámina más vacía, para concentrar
el sobrante). Las combinaciones cruzan tres decisiones:

| Decisión | Opciones | Por qué importa |
| --- | --- | --- |
| Orden de entrada | 5 (por alto, por ancho, por área, con y sin voltear de partida) | El orden manda sobre el resultado en un acomodo por franjas |
| Reparto | `global` (rellena láminas ya abiertas) / `secuencial` (llena una y abre otra) | `global` gasta menos tablero; `secuencial` repite patrones y permite cortar la pila |
| Alto de franja nueva | `baja` (gasta poco alto) / `alta` (acuesta la pieza) | Un refuerzo de 870 × 100 cabe de a 2 por franja baja, o 16 de canto en una alta |

La política de franja nueva fue la que más bajó el desperdicio: en una caja de cocina típica pasó de
**6 tableros a 5**, y los fondos y frentes bajaron al mínimo teórico.

### Qué informa
Por material: tableros, m² de lámina, m² netos, **D %** sobre la lámina entera (como lo reporta
planta) y el **mínimo teórico** al lado, para saber a qué distancia quedó. Las láminas con el mismo
acomodo se agrupan en un patrón —«2 de 2440 x 1830»— porque son las que se cortan juntas en la pila.
Cada medida distinta recibe un número y un color, y los sobrantes se dibujan marcando si llegan al
mínimo de planta (1000 × 500) o son desperdicio.

Lo que **no cabe** en la lámina ni girando no se pierde en silencio: sale listado aparte, en rojo.

### Lo que el acomodo respeta
Disco de 4,4 mm entre piezas, refilado por los cuatro lados, y la **veta**: una pieza solo se gira si
la máquina gira lámina *y* la textura del material rota veta. La textura se elige por material en la
tabla de resumen (todavía no se guarda).

`girada` se mide contra la medida del despiece, no contra la orientación con la que la heurística
empezó a probar. Lo contrario fue un defecto real que atrapó una prueba: una pieza puesta de canto
salía marcada como «no girada» y se cortaría al revés.

### Lo que todavía no hace
- **Inventario de sobrantes**: se marcan los aprovechables pero no se guardan ni se reutilizan.
- **El acomodo no es óptimo**: ver «La meta del 15 %» más abajo para qué lo limita y qué no.
- **Sin validar con planta**: la fase 3 del plan pide contrastar con 3–5 proyectos ya cortados en
  Lepton. Hasta entonces los números son del algoritmo, no de la máquina.

Pruebas: `tests/guillotina.test.ts`, 17 casos en `lane:cutting`, con los criterios de aceptación del
plan: ninguna pieza se superpone ni se sale de la lámina, el disco y el refilado se respetan, la veta
manda sobre el giro, la misma entrada da el mismo plan, y 900 piezas se acomodan en menos de 3 s
(corre en el navegador).

## Corte día por día y resumen consolidado (2026-10-14)
`src/lib/corte/plan-corte.ts` (`planDeCorte`) cierra la fase 2: cruza el reparto diario con el
acomodo y responde, por jornada, qué se corta, en cuántos tableros, con cuánto desperdicio y
cuántos cortes. No agrega lógica de acomodo; **compone** lo que ya existe:

```
plan-diario  →  qué módulos y cuántas unidades van en cada día
lista        →  las piezas de esos módulos, por material
guillotina   →  el acomodo de cada material en su lámina
secuencia    →  los cortes de ese acomodo
```

Un módulo partido entre dos días se corta a medias: cada jornada recibe solo las unidades que el
reparto le asignó.

### Conteo de cortes (`secuencia.ts`)
Era la parte que faltaba de la fase 2. Como el acomodo es por franjas, la secuencia de la
seccionadora es siempre la misma y los cortes se cuentan sin simular la máquina:

| Nivel | Qué corta | Cuántos |
| --- | --- | --- |
| Refilado | Escuadra la lámina | 2 si hay refilado |
| 1.er nivel | Libera cada franja, de lado a lado | uno por franja |
| 2.º nivel | Separa las piezas dentro de la franja | n − 1, más uno si queda sobrante al borde |
| 3.er nivel | Recorta la pieza más baja que su franja | una por pieza más baja |

Se cuentan **por pasada**: las láminas de un mismo patrón que entran en una pila (4 en 15 mm, 3 en
18 mm) cuestan un solo juego de cortes. **Es un modelo, no una medición**: los niveles de la
Holz-Her siguen pendientes de confirmar con planta (plan, §4.1), así que el número sirve para
comparar acomodos entre sí, no para prometer tiempo de máquina.

### Lo que cuesta repartir en jornadas
Las piezas de días distintos no pueden compartir lámina, así que **cortar por día gasta más tablero
que cortar todo junto**. El resumen muestra las dos cifras y la diferencia, en vez de dar solo una.
En un proyecto de prueba de 15 módulos a 40 piezas/día: 16 tableros y 31,6 % repartido en 3 días,
contra 15 tableros y 26,8 % de una sola vez.

### Lo que muestra la pantalla
Cada día es un bloque con tres capas, porque **una jornada toca varios tableros a la vez**: todo
módulo lleva caja, frente y fondo, así que ni agrupando por material se baja de tres o cuatro
referencias por día.

1. **Cabecera**: cuántos módulos y unidades, piezas, cuántos materiales, tableros, m², D % y cortes.
2. **Tabla de muebles del día**: código, cocina, tablero principal, unidades y piezas, con el total
   de la jornada. Los que vienen marcados *(parte)* se cortan también en otro día. Antes esta lista
   iba en una línea de la cabecera y con diez módulos se cortaba sin poder leerse.
3. **Tabla de materiales del día**: una fila por tablero —lámina, tableros, cuántos esquemas, m²,
   netos, desperdicio y cortes— y el total de la jornada.
4. **Esquemas**: una sección por material con su leyenda de medidas y sus láminas. Cada lámina se
   rotula con su día y su material, de modo que una tarjeta suelta se entiende sola al imprimir.

Al final, un resumen con el consolidado, el desglose de cortes por nivel, una tabla por día y otra
por material sumando todos los días, más la comparación contra cortar el proyecto completo.

Con `piezasPorDia` en 0 no hay jornadas: la pantalla muestra el proyecto cortado de una sola vez y
pide el ritmo.

Pruebas: `tests/secuencia-corte.test.ts` (11 casos) y `tests/plan-corte.test.ts` (10), en
`lane:cutting`. Las del plan cubren la composición —que no se pierdan ni se dupliquen piezas al
partir el proyecto, que el consolidado sea la suma de los días y no otro cálculo, que a mayor ritmo
nunca haga falta más tablero— y no el acomodo, que tiene las suyas.

## La meta del 15 % (2026-10-14)
Objetivo de planta: desperdicio **≤ 15 %**, y mejor por debajo. El optimizador ahora **busca**
en vez de aplicar unas pocas heurísticas, y la pantalla dice material por material si la meta se
cumple, si se puede cumplir, y qué la rompe.

### El desperdicio es un escalón, no una curva
Esto es lo que más confunde al mirar los números. Las láminas se compran **enteras**, así que

```
desperdicio = 1 − área de piezas ÷ (nº de láminas × área de lámina)
```

Para un material dado, el área de piezas es fija: lo único que el optimizador puede mover es el
**número de láminas**. Con 17,0 m² de piezas y láminas de 4,465 m²: 4 láminas → 4,8 %; 5 láminas →
23,8 %. **No hay nada en medio.** Pedir «menos de 15 %» en ese material es pedir que quepa en 4
láminas, es decir un 95 % de aprovechamiento, que con guillotina de 3 niveles no se alcanza.

Por eso el plan marca `metaInalcanzable` cuando ni el mínimo teórico baja de la meta: ahí **no es
el acomodo, es el volumen**, y la salida es agrupar más muebles de ese material en la misma corrida.

### Lo que de verdad rompe la meta: cortar por día
Medido sobre un proyecto de 12 tipos de módulo (~42 unidades, 3 tableros):

| Corrida | Días | Tableros | Desperdicio |
| --- | --- | --- | --- |
| Todo junto | — | 45 | **13,6 %** ✓ |
| 300 piezas/día | 2 | 47 | 17,2 % |
| 100 piezas/día | 5 | 50 | 22,2 % |

Con volumen, el optimizador **sí cumple la meta**. Lo que la rompe es partir la producción en
jornadas: cada día corta sus piezas en sus propias láminas y el resto de cada material se paga
entero. Menos días y más grandes = menos desperdicio. El resumen de la pantalla da las dos cifras
y el veredicto.

### Cómo busca
Dos fases, ambas sobre acomodo por franjas, que es lo que la máquina sabe cortar con 3 niveles:

1. **20 combinaciones deterministas**: 5 órdenes × reparto global/secuencial × franja nueva
   baja/alta.
2. Si no se llegó al mínimo teórico, **arranques aleatorios**: orientación de partida (toda alta,
   toda baja o pieza por pieza), clave de orden al azar con ruido para romper el orden estricto, y
   modo y política de franja al azar. Hasta agotar `cfg.iteraciones` (2000), `cfg.tiempoMaxMs`
   (150 ms por material) o 300 arranques seguidos sin mejorar.

El azar está **sembrado** con una semilla derivada del propio problema: la misma entrada da siempre
el mismo plan, que es criterio de aceptación del plan de obra.

El informe reporta **cuántas combinaciones se evaluaron**: en el consolidado, por día y por
material. No es un adorno —respalda que el plan elegido fue el mejor de los vistos— pero hay que
leerlo bien: un material que llega al mínimo teórico para la búsqueda de inmediato, así que **20
combinaciones ahí valen más que 960 en otro**. Un número bajo significa «ya estaba óptimo», no
«se buscó poco». Se para en seco al tocar el mínimo
teórico, porque ya no existe nada mejor. Ambos presupuestos se editan en los parámetros de planta.

**Lo que la búsqueda no logra**: en un material mixto de volumen pequeño (caja de 50 piezas) 20 000
iteraciones no encuentran nada mejor que 5 láminas, contra un mínimo teórico de 4. Ese mínimo es una
cota de área que ignora la geometría, y 4 láminas exigirían 95 % de aprovechamiento. Para bajar de
ahí haría falta **más niveles de corte** en la máquina —hoy 3, pendiente de confirmar con planta—,
no más iteraciones.

## Reparto de muebles completos por día (análisis 2026-10-14)
- Las "combinaciones" de la pantalla son solo acomodos de lámina por material y día (20 heurísticas +
  aleatorias). El reparto de módulos por día (`plan-diario.ts`) es codicioso, de una pasada.
- Prototipo (48 muebles, 614 piezas, 110 piezas/día, 6 días): codicioso 40 tableros (31,9 %); búsqueda
  de muebles completos entre días con recocido simulado 34 (19,8 %); todo junto 31 (12,1 %); mínimo
  cortando los 3 materiales todos los días 32 (14,8 %).
- El 15 % depende de la política de planta: sobrantes entre días, corte por lotes de frente/fondo o
  tolerancia de ritmo. Hay ~10²⁶ repartos posibles: búsqueda exacta solo en proyectos pequeños.
- Los módulos agrupados (`grupo_id`) hoy se pueden separar entre días: deben ir juntos.
- Prompt de implementación: `docs/prompt_antigravity_reparto_dias.md`.
- Medición de escala (prototipo, un hilo): proyecto pequeño 4.000 it → 34 tableros, 150.000 it → 33;
  proyecto grande (288 muebles, 34 días) 6.000 → 228, 30.000 → 221, 150.000 → 215 (cota ≈ 186). Más
  iteraciones siempre mejora; la velocidad sube de ~2.000 a ~10.500 it/s al calentarse la caché. El prompt
  pide presupuesto por tiempo (sin tope de iteraciones), multihilo con islas, vecindarios dirigidos por
  material, LNS, enumeración exacta en espacios pequeños y guardado del plan.

## Reparto optimizado de muebles entre dias (2026-10-14)
`src/lib/corte/reparto.ts` (`buscarReparto`). Hasta ahora el reparto era codicioso de una sola
pasada y el optimizador solo barria **el acomodo dado ese reparto**. El margen grande estaba aqui.

### Lo que gana, medido
Proyecto de referencia (15 referencias, preset 15/18/6 mm, 110 piezas/dia):

| Proyecto | Presupuesto | Tableros | Desperdicio | Movimientos |
| --- | ---: | ---: | ---: | ---: |
| Pequeno (48 muebles, 451 piezas, 5 dias) | codicioso | 44 | 27,3 % | 0 |
| | 1 s | 41 | 22,0 % | 512 |
| | 20 s | **40** | **20,1 %** | 5 888 |
| | cota | 38 | | |
| Grande (288 muebles, 2 706 piezas, 25 dias) | codicioso | 253 | 23,9 % | 0 |
| | 5 s | 250 | 23,3 % | 2 048 |
| | 20 s | **247** | **22,3 %** | 6 656 |
| | cota | 219 | | |

Mas presupuesto siempre mejoro, como en el prototipo. La cota es `evaluarDia` con todo el proyecto
en un dia: es inalcanzable mientras se corte a diario, pero mide la distancia.

### Como busca
Recocido simulado sobre una matriz `dias x lineas` de conteos (`Int32Array`), con:
- **Evaluacion incremental**: un movimiento cambia dos dias y solo esos se recalculan.
- **Cache por firma de dia**: en una instancia que no se resuelve sola, 39 972 aciertos contra 118
  evaluaciones reales. Sin ella la busqueda no avanzaria.
- **Acomodo rapido durante la busqueda** (`iteraciones: 0`, solo las heuristicas deterministas); el
  reparto elegido se vuelve a acomodar con la configuracion completa.
- **Recalentamiento** en vez de parada: si pasan `max(2000, 20 x lineas x dias)` movimientos sin
  mejorar, vuelve a la mejor conocida y sube la temperatura.
- **Parada por cota**: si toca la cota inferior se detiene y lo marca `optimo`, porque ya no existe
  nada mejor que encontrar.

El azar va **sembrado**: misma semilla y mismo presupuesto dan exactamente el mismo reparto.

### Un grupo fisico no se parte
`grupo_id` ahora llega al optimizador (`ModuloHDR` → `proyectoDesdeCotizacionAction`). Antes no, y
las lineas de un grupo se podian separar entre dias: como comparten piezas (el lateral x 1,5) y la
lista de corte redondea **por dia**, partir un grupo de 2 unidades producia 4 laterales donde el
despiece pide 3. Verificado y cubierto con prueba.

### Decisiones de planta vigentes
D1 meta sobre el total · D2 sin sobrantes entre dias · D3 sin lotes · D4 ritmo exacto
(`toleranciaRitmoPct`) · D5 sin dias extra (`diasExtraPermitidos`) · D6 las lineas sueltas si se
reparten por unidades. D4 y D5 son configurables y estan probadas; **D2 y D3 no estan
implementadas**: no hay llave de configuracion para ellas para no prometer lo que no hace.

### Lo que falta del prompt
- **Interfaz**: selector de modo (Rapido 5 s / Profundo 60 s / Maximo), progreso en vivo, boton
  *Detener y usar el mejor*, tabla comparativa inicial/optimizado/todo junto/cota. Hoy la busqueda
  corre sincrona con `cfg.repartoTiempoMs` y bloquea la pantalla mientras dura.
- **Workers y paralelismo** (§3.7): no hay. La busqueda es de un solo hilo.
- **Rendimiento**: ~1 300 movimientos/s en el proyecto pequeno y ~750 en el grande, contra los
  10 000/s que pide el prompt. Queda la cache por dia-material (§3.4.2) y el paralelismo.
- **Vecindarios dirigidos** (§3.6.4–6): LNS, cadena de expulsion y ataque al peor dia-material.
- **Enumeracion exacta** (`repartoExacto`) para espacios pequenos, y **persistencia** del plan
  (`cot_planes_corte`).

### Rendimiento de la busqueda (2026-10-14)
Medido: `evaluarDia` se llevaba el **98 %** del tiempo (5,07 ms de acomodo contra 0,097 ms de armar
la lista de corte). Dos cambios, y el resultado mejoro de verdad:

1. **Pocas heuristicas durante la busqueda** (`heuristicasMax: 4` en la configuracion rapida, contra
   las 20 del plan final). La busqueda acomoda miles de dias; el reparto elegido se vuelve a acomodar
   con todas.
2. **Filtro por cota antes de acomodar** (`cotaDia`): area con sierra contra area util, 50 veces mas
   barato que acomodar. Si ni optimistamente caben en las laminas que esos dos dias ya usan, el
   movimiento solo puede empeorar y se descarta sin llamar a la guillotina.

| Proyecto | Antes (20 s) | Despues (20 s) | Movimientos |
| --- | ---: | ---: | ---: |
| Pequeno | 40 tableros, 20,1 % | 40 tableros, 20,1 % (ya a los **5 s**) | 6 k → 26 k |
| Grande | 247 tableros, 22,3 % | **242 tableros, 20,7 %** | 7 k → 15 k |

La cota que se informa sale del proyecto cortado de una sola vez, acomodado con la configuracion
completa: antes se calculaba con el acomodo rapido y salia inflada.

## Repositorios de referencia y medición contra packingsolver (2026-10-14)
Informe completo: `docs/informe_repositorios_optimizador_corte.md`. Con las mismas piezas (todo junto),
packingsolver (MIT, WASM) usó 30 láminas contra 31 en el proyecto pequeño y 175 contra 179 en el grande;
en el frente 18 mm del pequeño demostró óptimo 5 láminas donde `guillotina.ts` usa 6 (franjas sin columnas
apiladas). Su objetivo con sobrante (`bin-packing-with-leftovers`) no devolvió solución en instancias
grandes; `bin-packing` sí. `reparto.ts` declara `exactoMax` pero no enumera, y no hay Web Workers.

## Mejoras del acomodo y del reparto (2026-10-14)
Implementado en `src/lib/corte/guillotina.ts`, `secuencia.ts`, `reparto.ts` y la pantalla:
- **Columnas apiladas** dentro de cada franja (franja → columna → pieza). Se permite apilar
  piezas más angostas que la columna con un recorte (corte "no exacto" de los solvers de 3
  etapas). **Pendiente de confirmar con planta** junto con los niveles de la Holz-Her.
- **Primer corte a lo largo y a lo ancho**: se prueban las dos orientaciones (lámina transpuesta).
- **Mochila por franja** (`empacarMochila`): cada franja se llena con la combinación de piezas de
  más área; variante "mejor alto" elige el alto de la franja (≤ 800 piezas por material).
- **Corrección secuencial de valores**: las medidas que quedan en la última lámina suben de peso.
- Criterio: menos láminas → última lámina más vacía → menos cortes. Patrones ordenados de más
  lleno a menos lleno. Nuevos datos: `sobrantesReutilizables`, `sobranteReutilizableM2`, `mayorSobrante`.
- `validarPatron`: sin solapes, sierra respetada y dentro del refilado. `secuencia.ts` cuenta
  cortes con columnas y orientación (usa `franja`/`columna` de cada colocación).
- **Defecto corregido**: la búsqueda del reparto por días no corría (`planDeCorte` recibía
  `busqueda = {}`). Ahora la pantalla la ejecuta en un **Web Worker** (`plan.worker.ts`) con
  `repartoTiempoMs` (campo editable en segundos), contador y botón Cancelar. El reparto revisa el
  reloj en cada movimiento y su modo rápido omite la mochila "mejor alto".

Resultados (todo junto, `scripts/corte-benchmark.ts`): pequeño 31 → **30** láminas, grande 179 →
**175**, igual que packingsolver; frente 18 mm 6 → **5** (25,2 % → 10,2 %). Plan por días
(110 piezas/día, 5 s): grande 237 → **227** tableros. Pruebas: `optimizador-referencia`,
`secuencia`, `reparto` (fixture `tests/fixtures/corte-referencia.json`).

## Guardados y exportación Excel: 2026-11-06

La migración idempotente 0244 crea `public.optimizador_guardados` con snapshot
JSONB completo, configuración normalizada, texturas por material, proyecto y
nombre desnormalizados. La BD pone `created_at` y conserva el correo real del
autor mediante trigger de inserción. No hay policy ni permiso UPDATE.
RLS permite consultar/insertar a autenticados y eliminar al autor o a un admin;
INSERT exige que autor_id sea auth.uid(). La página sigue restringida a admin
por decisión explícita del usuario, aunque las acciones y exportación admiten
cualquier sesión autenticada.

Las acciones guardan, listan metadatos ligeros con proyecciones JSONB de KPIs,
obtienen el registro completo por id y eliminan comprobando la fila devuelta
por RLS. Nunca toman autor ni fecha del cliente. El guardado exige un snapshot
validado y una clave vigente de esquemas/configuración/texturas. Al cargar,
se restauran proyecto, catálogo de la corrida, lista, plan diario y PlanCorte
originales, y se consulta la configuración actual de planta. Se comparan campos
simples y anidados, listando antes → ahora sin recalcular el resultado histórico.
La fecha visible usa America/Bogota con segundos; se conserva el timestamp UTC
original completo en el archivo y en la BD.

`guardados.ts` contiene validación, comparación y generación pura del workbook
(archivo adicional autorizado). `imagenes.ts` produce SVG autocontenido y PNG
con canvas: escala máxima 2 px/mm, tope 2400 px por lado, 150 imágenes y 6 MB
en total de data URLs. El límite se verifica antes del POST y en servidor.
`POST /optimizador/export` solo acepta id + imágenes y vuelve a leer los datos
desde la BD con la sesión; valida las claves día-material-patrón y las cabeceras
PNG. No se implementa PDF ni se modifica el motor.

El .xlsx incluye, en orden: Resumen general (proyecto/código/autor/fecha/
parámetros/KPIs), Resumen por material, Lista de corte, Plan de corte por día,
una hoja Día N con imágenes, colocaciones y sobrantes y Resumen consolidado.
Si el ritmo no define días, se conserva la corrida sin inventar una jornada:
se añade Proyecto completo con sus imágenes. Las repeticiones de un patrón
se indican junto a su esquema. Los números mantienen su tipo y sus formatos;
el nombre es Optimizacion_proyecto_AAAA-MM-DD_HHmm.xlsx, con fecha de Bogotá.

### Estado de verificación

Las pruebas se escribieron antes de implementar y fallaron inicialmente por
ausencia de los módulos. Pasan los casos de integridad, comparación, SVG,
límites de PNG, workbook, identidad, guardado pendiente y POST sin sesión
a nivel del Route Handler. El fixture de dos días se abrió en Microsoft Excel
en modo normal y de solo lectura: siete hojas, dos imágenes, celdas numéricas
y sin cambios al abrir. La migración se aplicó y la segunda ejecución confirmó
que ya estaba registrada, sin reaplicación.

La verificación HTTP detectó la redirección del proxy a login antes del handler.
Con autorización explícita se añadió una excepción solo para POST exacto a
`/optimizador/export`: la ruta hace su propia autenticación y devuelve 403.
Las demás rutas y métodos siguen pasando por la protección original, verificada
por una prueba específica. Se autorizó registrar los archivos y pruebas en el
mapa de calidad, sin modificar la línea base. La página se conserva solo admin.

El usuario decidió conservar el límite de 1 MB de Server Actions. El envío
serializado admite 900 KB UTF-8, reservando espacio para el envoltorio de React.
Las corridas que exceden ese tamaño se comprimen con gzip y base64 antes del
envío usando CompressionStream nativo, sin nuevas dependencias. El servidor
autentica, verifica el tamaño del transporte, descomprime con tope de 15 MB,
valida el snapshot y guarda el JSON completo habitual. Los guardados pequeños
y clientes anteriores conservan el camino original. Solo se rechaza si aun
comprimido excede el transporte permitido o supera el máximo estructural.
No se cambió next.config.ts ni se recortan colocaciones, jornadas o materiales.

La prueba Playwright (plugin Browser no disponible) guardó dos optimizaciones
con el mismo autor sobre Milán Closet y Edificio Santa Barbara; comprobó correo,
fecha con segundos, restauración idéntica de la sección de proyecto y comparación
contra un cambio real de disco de 4,4 a 4,5 mm. Al comenzar otra carga se limpia
el aviso anterior para no mostrar diferencias antiguas mientras responde la BD.
Se descargó por el POST real un Excel con seis hojas y ocho imágenes. Se abrió
normalmente en Microsoft Excel: ocho imágenes visibles, número 200 como valor
numérico y timestamp original con microsegundos, sin cambios ni reparación al abrir.

Dos cuentas temporales adicionales comprobaron RLS: un vendedor puede consultar
los dos guardados y exportar (HTTP 200), no puede eliminar el de otro ni hacer
UPDATE; un admin diferente sí elimina. El autor eliminó el suyo desde la UI con
confirmación. El POST sin sesión devuelve 403. Se restauró el parámetro de planta
original y se eliminaron únicamente guardados/cuentas identificados como QA.

Cierre de calidad: 110 archivos de pruebas aprobados sin regresiones y learn
estricto con cero HIGH. Las tablas por patrón de colocaciones y sobrantes tienen
filtros propios de Excel (16 tablas en la descarga real). El enchape se exporta
en dos columnas numéricas, largos y anchos, para poder trabajar los valores fuera
de la app. No se modificaron pruebas previas, motor de corte ni baseline.

### Corrección del guardado de corridas grandes

El rechazo preventivo se aplicaba al JSON sin comprimir y bloqueaba corridas
como Prueba Optimizador. La corrección separa el tamaño del resultado del tamaño
del envío. La BD y el Excel siguen recibiendo toda la información original;
el descriptor `gzip-base64-v1` existe únicamente durante el transporte.

Las regresiones verifican una corrida mayor de 1 MB, igualdad completa al
reconstruirla, compatibilidad con snapshots pequeños y rechazo de gzip corrupto
o expansiones mayores de 15 MB. La prueba de navegador sobre Prueba Optimizador,
con más jornadas para ejercitar más de 1 MB, guardó 1.102.022 bytes completos
mediante una petición de 87.443 bytes. Se contrastó la fila con una descompresión
independiente mediante zlib y se recargó con una sección de proyecto idéntica.
No hubo errores de aplicación; se eliminó solo el guardado temporal de QA.

### Prueba completa de botones y exportación grande

El guardado original Prueba Optimizador contiene 3 días, 323 láminas y 129
patrones. Se detectaron dos límites consecutivos: 120 imágenes y, al ampliarlo,
el presupuesto PNG de 6 MB. El usuario autorizó subir a 150 imágenes conservando
6 MB. Se actualizaron las pruebas de frontera al contrato 150/151, sin retirar
la validación de tamaño.

La rasterización ahora intenta 2400, 1800, 1400, 1000 y 800 px por lado máximo
hasta que caben **todos** los esquemas. Mantiene proporción, PNG y coordenadas
exactas en las tablas, sin omitir patrones. Libera el canvas tras cada imagen;
si ni la última resolución cabe, aborta antes del POST sin resultado parcial.

La prueba real pasó con el registro original y dos copias temporales:

- Guardar: nombre vacío/espacios bloqueado, cambios pendientes bloqueados,
  autor y fecha con segundos correctos, lista ordenada por fecha.
- Cargar: restaura idénticamente la sección de proyecto y muestra el cambio
  de disco al consultar los parámetros actuales de planta.
- Exportar: funciona incluso con cambios locales sin guardar porque usa el
  registro de BD. Descarga 8 hojas, 129 PNG y 258 tablas filtrables; mantiene
  el timestamp original. El envío de imágenes mide 5.181.956 bytes y el .xlsx
  3.473.882 bytes. Microsoft Excel lo abrió normalmente, con las 129 imágenes
  visibles y sin reparaciones ni cambios al abrir.
- Eliminar: cancelar conserva la copia; confirmar la elimina. Un vendedor
  consulta/exporta pero no borra el guardado de otro; otro admin sí lo elimina.
- HTTP: sin sesión 403, id inexistente 404, imágenes ausentes 400 y exceso
  de 6 MB 413. La consola de la aplicación no registró errores.

Se comparó el registro original completo antes/después sin diferencias. El
disco regresó a 4,4 mm y no quedaron copias ni cuentas de QA. Las pruebas de
presupuesto verifican reducción sin pérdida de claves, rechazo de 151 imágenes
y aborto si ni la resolución mínima cabe.
