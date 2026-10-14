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
- El despiece sale de `modulosDeCotizacionAction` (HDR): motor vigente, grupos incluidos.
- La textura por material se elige en pantalla pero aún no se guarda.
- Pruebas: `tests/optimizador-corte.test.ts`, lane `lane:cutting` en `quality/manifest.json`.
- Hallazgo con "Prueba Uno": 199 piezas; en frentes 18 mm y fondo 6 mm el volumen (< 2 láminas) no
  permite bajar del 15 % de desperdicio. Hay que decidir si el sobrante ≥ 1000 × 500 cuenta como desperdicio.

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
