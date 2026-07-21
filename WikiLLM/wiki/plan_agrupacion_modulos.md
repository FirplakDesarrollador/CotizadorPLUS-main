# Plan funcional y técnico: agrupación de módulos

**Estado:** implementado y probado; `db/migrations/0020_agrupacion_modulos.sql` fue aplicada al proyecto Supabase I+D el 2026-07-15. Otros entornos deben migrarse antes de desplegar el código.  
**Alcance:** proyectos/cotizaciones, con grupos limitados a una cocina.  
**Fuentes:** decisiones del usuario, código actual, Supabase consultado el 2026-07-14 y libros Excel del proyecto.

## Validación ejecutada (2026-07-15)

- `npm run test:groups`: 8 pruebas automatizadas para letras A…AA, etiquetas, conversión dimensional, códigos, residuo monetario, geometría B12.DB10.BFD20 y bloqueos de compatibilidad/tablero.
- E2E real en I+D: creación de B12, DB10 y BFD20; agrupación A1/A2/A3; separación y reagrupación; código `B12.DB10.BFD20`; cuatro laterales, dos uniones y 42 pulgadas totales persistidas.
- Se comprobó el bloqueo de una altura incompatible y la autocorrección de `A0` a la etiqueta previa válida.
- Se validaron Excel, impresión y subtotal del grupo, además de un proyecto métrico con BFD representado como `IP50` y unidad bloqueada en centímetros.
- Las cotizaciones y el usuario de prueba fueron eliminados al terminar.

Las pruebas detectaron y corrigieron ruido binario en conversiones (`30.479999…`) y cantidades prorrateadas (`0.999999…`). También se implementó cierre a centavos: cada línea se redondea y el último integrante absorbe el residuo, de modo que la suma de líneas coincide exactamente con el subtotal.

## 1. Objetivo

Organizar los módulos de una cocina en bloques identificados automáticamente (`A`, `B`, `C`...) y permitir que varios módulos consecutivos se fabriquen y coticen como una estructura compartida (`A1`, `A2`, `A3`). El conjunto elimina laterales duplicados, fabrica piezas estructurales continuas cuando sean compatibles y conserva piezas locales, frentes y herrajes por módulo.

La agrupación debe reflejarse en despiece, costo, precio, UI, impresión y Excel, manteniendo precio individual y subtotal de grupo.

## 2. Identificación, orden y código

### 2.1 Grupos

- Cada línea nueva se crea como bloque independiente: `A`, `B`, `C`.
- Un bloque de varios módulos usa posiciones consecutivas de izquierda a derecha: `A1`, `A2`, `A3`.
- Editar `B` como `A2` transforma el antiguo `A` en `A1`, mueve físicamente `B` a la segunda posición y renumera los bloques posteriores.
- **Drag & Drop de Bloques:** Los muebles individuales (ej. A) y los muebles combinados (ej. E1, E2) se pueden arrastrar y soltar verticalmente en la tabla. Al soltar o desplazar un bloque (o al usar los botones ▲/▼), los grupos de la cocina se reordenan automáticamente en base de datos (`reordenarGruposCocina`) y sus etiquetas se renombran en secuencia (A, B, C, D...).
- Duplicados, huecos o posiciones imposibles se corrigen automáticamente. La base persistida siempre queda normalizada.

- Al borrar `A2` de `A1,A2,A3`, `A3` pasa a `A2`. Si queda un integrante, vuelve a `A`.
- Después de `Z` se continúa con `AA`, `AB`, `AC`, como en Excel.
- Los grupos no atraviesan cocinas ni proyectos.
- Copiar a otra cocina crea una línea independiente con la siguiente letra disponible.
- Una línea agrupada exige `cantidad = 1`; cantidades mayores deben separarse en líneas.

### 2.2 Código individual y agrupado

- Cada módulo muestra prefijo y ancho: `B12`, `DB10`, `BFD20`.
- El grupo concatena los códigos en orden físico: `B12.DB10.BFD20`.
- Las repeticiones no se abrevian: `B12.B12.BFD20`.
- El código se regenera al cambiar tipo, ancho, sistema de medida, orden o integrantes.
- Material, color, espesor, canto, modo de frentes y herrajes no forman parte del código.
- Cada proyecto usa un único sistema: imperial o métrico. No se permiten códigos mixtos.
- Imperial expresa el ancho en pulgadas; métrico lo expresa en centímetros.
- La conversión no redondea; elimina ceros finales y usa punto decimal canónico.
- Los prefijos son data-driven. La equivalencia métrica confirmada es `BFD -> IP`.

Se revisaron los seis Excel del proyecto. `Simulación muebles CEMA (1).xlsx`, incluida `Plantilla códigos`, contiene códigos imperiales (`B12`, `OB12` y variantes), pero no `IP` ni una tabla imperial↔métrica. La equivalencia completa deberá cargarse antes de habilitar proyectos métricos.

## 3. Presentación

- La tabla incorpora columnas **Grupo** y **Código**.
- Los integrantes comparten fondo pastel tenue, barra lateral y color del identificador.
- Los bloques independientes también reciben un color sutil.
- El color es determinista y accesible, pero nunca sustituye la etiqueta textual.
- Cada grupo muestra subtotal en UI, impresión y Excel, además de precios individuales.

## 4. Modelo físico

Para `n` módulos se pasa de `2n` laterales a `n + 1` paneles verticales: dos exteriores y `n - 1` divisiones. Se elimina exactamente un lateral por unión.

Ejemplo `A1 + A2 + A3`:

- `A1`: lateral exterior izquierdo y primera división.
- `A2`: segunda división.
- `A3`: lateral exterior derecho.

El ancho exterior del grupo es la suma de anchos nominales. Los frentes conservan su ancho y orden individual.

### 4.1 Clasificación de piezas

La plantilla declarará el comportamiento; el motor no lo inferirá solo por nombre o rol:

- `lateral_compartido`: laterales exteriores y divisiones; cantidad `n + 1`.
- `continua_grupo`: base, tapa, refuerzos estructurales y fondo homologables.
- `local`: entrepaños, gavetas, traseros de gaveta y piezas exclusivas.
- `frente`: puertas y frentes; siempre individuales.

Los entrepaños permanecen separados porque una pieza continua colisionaría con divisiones de altura completa. Una pieza continua solo se fusiona si es homologable en todos los miembros; nunca atraviesa únicamente parte del grupo.

### 4.2 Dimensiones según espesor

Supabase usa hoy constantes heredadas de caja de 15 mm:

- `L - 1.18 in` en bases, tapas, entrepaños y refuerzos: 30 mm.
- `L - 0.59 in` en fondos ranurados: 15 mm.
- Gavetas con ajustes propios (`L - 2.95 in`, `L - 3.427 in`) permanecen locales.

El cálculo de grupo introduce:

- `LG`: ancho exterior total del grupo.
- `TC`: espesor real del tablero de caja.

Fórmulas confirmadas:

- Base, tapa y refuerzo continuo: `LG - 2*TC`, más ajustes adicionales explícitos de la plantilla.
- Fondo ranurado continuo: `LG - TC`, conservando media penetración por lado.
- Laterales/divisiones: conservan alto, profundidad, canto y material originales.
- Frentes y piezas locales: conservan su fórmula con el ancho individual.

No se reemplazarán constantes mediante búsqueda textual. Cada pieza agrupable tendrá una fórmula de grupo explícita para no confundir descuentos estructurales con ajustes especiales.

### 4.3 Cantos y fijaciones

- El canto de una pieza continua se evalúa una vez sobre su longitud final y sus aristas declaradas.
- Las fijaciones por contacto se derivan del valor individual dividido entre dos extremos y multiplicado por `n + 1` contactos.
- Base/tapa: `4*(n+1)` tarugos por pieza continua, derivado de 8 individuales.
- Refuerzo: `2*(n+1)` tarugos por pieza continua, derivado de 4 individuales.
- Entrepaños locales conservan sus soportes por módulo.
- Piezas con cero fijaciones conservan cero.

### 4.4 Formato máximo

- Cada pieza continua debe caber en el lado largo de `cot_tableros.formato`.
- Los formatos activos principales son `183X244` y `124X246` cm.
- Puede usarse cualquiera de las dos orientaciones.
- Si no cabe, se bloquea la operación indicando pieza, medida, material y formato.

## 5. Compatibilidad y bloqueos

Todos los miembros deben cumplir:

- Misma altura y profundidad físicas, normalizadas a milímetros con tolerancia de `0.5 mm`.
- Mismo código, material y espesor en roles `caja`, `refuerzo` y `fondo`.
- Mismo calibre de canto de caja.
- Mismo espesor de frentes; material y color de frente sí pueden variar.
- Misma política de margen.
- `cantidad = 1` y mismo sistema de nomenclatura del proyecto.
- Piezas continuas homologables en geometría, cantidad, posición, sección, material y canto.
- Longitud final compatible con el tablero.

Cambiar un atributo incompatible en un integrante se bloquea antes de persistir y la alerta explica la causa. `sin_frentes` puede convivir con módulos con frentes; `solo_frentes` no es una carcasa agrupable.

### 5.1 Exclusiones iniciales

- Esquineros/ciegos: `TW`, `WBL`, `DVE`, `BBLFD` si se activa.
- Torres/hornos: `OVPC`, `PC`, `PCFD`, `VPC`.
- Especiales: `BOMH`.
- Paneles/complementos: `D`, `F`, `PN`, `R`, `TK`.

La habilitación se guarda en catálogo para poder añadir reglas posteriores sin condicionales hardcodeados.

## 6. Precio individual y subtotal

El grupo se calcula físicamente como conjunto, pero conserva precio por línea:

1. Calcular piezas locales, frentes y herrajes por módulo.
2. Construir laterales/divisiones y piezas continuas.
3. Calcular materiales, cantos, consumibles y fijaciones compartidos.
4. Distribuir costos:
   - Piezas continuas: proporcionalmente al ancho nominal.
   - Laterales exteriores: al módulo de su extremo.
   - División interna: 50 % a cada vecino.
   - Costos locales: 100 % al módulo propietario.
5. Aplicar la misma política de margen.
6. Convertir con la TRM congelada y actualizar línea, grupo, cocina y proyecto.

Invariantes:

- Suma de costos asignados = costo físico del grupo.
- Suma de precios individuales = subtotal del grupo.
- Residuos de centavos se asignan determinísticamente al último miembro.

## 7. Cambios de datos propuestos

### 7.1 `cot_cotizaciones`

- `sistema_medida`: `imperial | metrico`, obligatorio en proyectos nuevos.
- Proyectos existentes se migran como `imperial` sin recalcular precios.
- Entradas en milímetros dentro de un proyecto métrico se normalizan a centímetros para código.

### 7.2 `cot_tipos_mueble`

- `pref_imperial`, inicialmente igual a `pref`.
- `pref_metrico`, nullable hasta completar equivalencias; `BFD -> IP` confirmado.
- `permite_agrupacion`.
- Administración debe impedir usar en métrico un tipo sin `pref_metrico`.

### 7.3 `cot_piezas_plantilla`

- `modo_agrupacion`: `local | lateral_compartido | continua_grupo | frente`.
- `clave_fusion`: homologa piezas entre tipos diferentes.
- `formula_largo_grupo`: fórmula explícita con `LG` y `TC`.
- Metadatos de contacto cuando una fijación no se derive de dos extremos.

### 7.4 Grupos y líneas

Crear `cot_grupos_modulos`, incluso para bloques de un integrante:

- `id`, `cotizacion_id`, `cocina_id`, `orden`.
- `codigo_agrupado`, `breakdown_compartido`, totales COP/USD y auditoría.

Añadir a `cot_cotizacion_lineas`:

- `grupo_id`, `posicion_grupo`, `codigo_modulo`.
- Asignación de costos compartidos dentro del `breakdown`.

La letra visible se deriva del `orden`; editarla ejecuta un comando de reordenamiento/agrupación y termina normalizando órdenes y posiciones.

### 7.5 Persistencia transaccional

Agrupar, editar, eliminar o reordenar afecta varias filas. Una RPC transaccional debe:

1. Bloquear bloques y líneas de la cocina.
2. Detectar modificaciones concurrentes.
3. Aplicar posiciones, códigos, breakdowns y precios.
4. Normalizar órdenes.
5. Actualizar grupo, cocina y proyecto.
6. Confirmar todo o revertir todo.

## 8. Motor y servicios

- Mantener `calcularMueble()` para compatibilidad individual.
- Añadir un cálculo puro de grupo con módulos normalizados y catálogos.
- Separar piezas locales, continuas, paneles verticales y frentes.
- Crear validadores puros de compatibilidad, formato, nomenclatura y asignación de costos.
- Recalcular todos los bloques afectados tras cada operación.
- No duplicar reglas en React ni Server Actions.
- Antes de implementar UI/acciones, leer las guías pertinentes de la versión instalada en `node_modules/next/dist/docs/`, como exige `AGENTS.md`.

## 9. UI, impresión y Excel

### UI

- Columnas editables **Grupo** y **Código**.
- Guardado al confirmar, con bloqueo temporal de operaciones concurrentes.
- Corrección automática visible para entradas normalizables.
- Un error incompatible revierte el valor visual y explica la causa.
- Subtotal y color compartido por grupo.
- El rótulo del subtotal, incluido el código agrupado, comienza bajo la columna **Módulo**; la columna **Grupo** queda libre y los totales conservan sus columnas monetarias.

### Impresión y Excel

- Incluir identificador, código individual, código agrupado y precio individual.
- Mostrar subtotal de grupo y cocina.
- Alinear el rótulo del subtotal de grupo bajo la columna **Módulo**, tanto en impresión como en Excel.
- Preservar el orden izquierda→derecha.
- Aplicar color tenue sin depender de él para comprender la estructura.
- Incluir breakdown compartido en una sección/hoja técnica de auditoría.

## 10. Migración

1. Crear columnas, restricciones, índices, RLS y tabla de grupos.
2. Backfill `pref_imperial = pref` y `BFD.pref_metrico = IP`.
3. Crear un bloque independiente por línea existente respetando cocina y orden.
4. Generar `A`, `B`, `C` y códigos sin recalcular precios históricos.
5. Recalcular un histórico solo cuando el usuario edite o agrupe.
6. Proteger el despliegue con feature flag y rollback de esquema.

## 11. Fases de implementación

1. **Catálogo y casos patrón:** completar prefijos métricos, clasificar piezas y definir fórmulas de grupo.
2. **Migración:** esquema, backfill, RLS y RPC transaccional.
3. **Motor puro:** unidades, compatibilidad, piezas compartidas, fijaciones, formato y distribución de costos.
4. **Orquestación:** agrupar, reordenar, desagrupar, editar, borrar y copiar.
5. **Interfaz:** columnas, edición directa, autocorrección, colores, alertas y subtotales.
6. **Salidas:** impresión, Excel y auditoría del grupo.
7. **Validación:** unitarias, Supabase, regresión, UI, exportaciones y staging con feature flag.

## 12. Casos mínimos de prueba

### Caso patrón `B12.DB10.BFD20`

- Identificadores `A1,A2,A3`; ancho total `42 in`.
- Cuatro paneles verticales en vez de seis.
- Base/refuerzos/fondo continuos solo con claves compatibles.
- Entrepaños y componentes de gaveta locales.
- Precio individual conciliado con subtotal.

Con caja de 15 mm:

- `TC = 15/25.4 in`.
- Pieza estructural: `42 - 2*TC`.
- Fondo: `42 - TC`.
- Base continua: `4*(3+1) = 16` tarugos frente a 24 independientes.

Repetir con caja de 18 mm y comprobar que no queden descuentos fijos de 30/15 mm.

### Identificadores y operaciones

- `A,B,C -> A1,A2,B` al editar `B` como `A2`.
- Mover `C` a `A2` reordena filas.
- Borrar renumera y un solo integrante colapsa a letra.
- Botón contrastado **Desagrupar**: permite separar un grupo formado (`A1`, `A2`...) en módulos independientes (`A`, `B`...), recalculando precios individuales y renormalizando las etiquetas secuenciales de la cocina.
- `Z -> AA`.
- Copiar a otra cocina crea bloque independiente.


### Bloqueos

- Altura/profundidad fuera de tolerancia.
- Material o espesor estructural diferente.
- Espesor de frente o margen diferente.
- Cantidad mayor a uno, tipo especial, pieza demasiado larga.
- Proyecto métrico con prefijo faltante.

### Conciliación y salidas

- Suma líneas = subtotal grupo = componente del subtotal cocina/proyecto.
- Código y orden idénticos en UI, impresión y Excel.
- Breakdown explica piezas compartidas y distribución.

## 13. Criterios de aceptación

- El usuario forma un grupo editando directamente el identificador y ve la normalización.
- El grupo conserva ancho total, orden y frentes individuales.
- Se elimina un lateral por unión y las piezas continuas usan el espesor real.
- Entrepaños y piezas incompatibles permanecen locales.
- Ningún cambio incompatible se persiste parcialmente.
- Cada línea conserva precio individual y el subtotal concilia exactamente.
- Código individual/agrupado respeta la nomenclatura del proyecto.
- UI, impresión y Excel muestran la misma estructura.
- Cotizaciones existentes reciben identificadores sin alterar precios.

## 14. Dependencia pendiente

Completar el catálogo imperial↔métrico. La arquitectura no usa nombres hardcodeados, pero un proyecto métrico no podrá utilizar un tipo cuyo `pref_metrico` esté vacío. La equivalencia inicial confirmada es `BFD -> IP`.
