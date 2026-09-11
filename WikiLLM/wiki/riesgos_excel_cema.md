# Riesgos e incoherencias del Excel CEMA

Auditoría estructural de `Simulación muebles CEMA (2).xlsx` (7.027 filas de
producto, 11 hojas — 5 ocultas, una llamada `prueba`). Hecha **leyendo
fórmulas, no valores**: casi todos los hallazgos son invisibles si uno solo
mira los números calculados. Complementa
[auditoria_precio_sbfd30.md](auditoria_precio_sbfd30.md), que concilia un SKU
concreto; esta página cataloga los defectos del libro como fuente de datos.

Informe presentable publicado como Artifact: *Auditoría del simulador CEMA*.

## Riesgo alto — obligan a decidir el modelo de datos

### 1. El margen lo decide la fila, no el tipo de mueble

Cada fila referencia a mano su celda de margen en la columna `T` de `Precio`:
`$T$1`=0,57 (5.733 filas) · `$T$12`=0,50 (1.030) · `$T$2`=0,52 (250) ·
`$T$24`=0,10 (4) · sin margen (10). El **tipo** de la columna `Q` no lo
determina: «Adicional» agrupa 1.368 filas repartidas entre las cuatro celdas, y
el prefijo `PN` mezcla 980 filas al 50% con exactamente una al 57%.

El motor asigna el margen por `margen_key` del tipo (`cotizar.ts:93-94`) y
`margenOverride` solo aplica cuando `margen_key === 'muebles'`, así que hoy no
puede representar «esta fila lleva otro margen».

### 2. Diez filas mezclan USD y COP en la misma suma

Filas 6966-6974 y 6978 (`OSLO*`, `AQUA3124`, `KOA3322`, `MSON*`,
`TINES6027 1/2` — lavamanos, lavaplatos, lavarropas, bañeras). Rompen la
cadena en tres puntos simultáneos:

```
I = 'Costos Muebles'!L6978   → 222     ← apunta a "Precio MS/FV", no a Costo
K = I6978                    → 222     ← única excepción: no divide por $V$1
L = 'Costos Muebles'!J6978   → 2.526   (COP)
X = (I+L)/$V$1               → 0,75    ← suma USD con COP
Y = 1-(X/W)                  → 0,997   margen reportado 99,7 %
```

Son las **únicas 10 filas de 7.027** donde `K` no divide por la TRM. En
`Costos Muebles` su costo real es `SUM(M:AA) = 0`: no tienen despiece. Son
reventa y hay que modelarlas como tal (precio de lista en USD, sin BOM), no
como mueble costeado.

### 3. El recargo del 10% está quemado 14.054 veces

El literal `10%` vive dentro de cada fórmula de `W` y `Z` en las 7.027 filas
(7.027 × 2). No es parámetro. Y **compone en vez de sumar**:
`1−(1−0,57)(1−0,10) = 0,613`, que es exactamente la columna `AB`. Aplica solo
al mueble; el herraje nunca pasa por él. Ver §6-§7 de la otra página.

### 4. El Excel solo sabe costear cuatro materiales a la vez

Las columnas de madera de `Costos Muebles` referencian siete celdas fijas de
`costos unitarios` (`C19` frentes, `C20` caja, `C21` refuerzos, `C22` caja
duplicado, `C23` fondo, `C24` fondo shaker = 0, `C63` lámina 18 polar = 0),
cada una con **un** precio global y ~1.499 referencias. El catálogo de 72
tableros de `Materiales` no participa del costeo.

Cotizar con otro tablero exige sobrescribir la tarifa global, lo que recalcula
**retroactivamente** las 7.027 filas, incluidas cotizaciones ya enviadas. El
preset por rol del Cotizador ya resuelve esto; la conclusión es no migrar la
lógica del libro, solo sus precios.

## Riesgo medio — corregir el dato

### 5. Dos bloques de precio de canto, desalineados 8-9%

Las fórmulas usan `costos unitarios!B11-B12` (`CANT22x1`=980,
`CANT19X0,45`=400). Existe un segundo bloque **muerto** en `B25-B27`
(«Costo Canto color 22 - 1mm»=900, «Polar 19-0,5»=368, «Color 19-0,5»=368) que
ninguna fórmula lee. Quien actualice el bloque equivocado no ve ningún efecto.

### 6. «Costo Caja» duplicado y ambas celdas en uso

`costos unitarios!C20` y `C22` son el mismo concepto con el mismo valor
(35.608,70733673744) y cada una alimenta ~1.499 fórmulas. Coinciden por
casualidad; si alguien actualiza una sola, la caja se costea a dos precios
distintos según la columna, sin aviso.

### 7. `Precio real` es un valor tecleado, no calculado

En **59 de 72** referencias de `Materiales`, `precio_real ≠ precio × (1−descuento)`.
Las 9 referencias `LAMCARB*` (LAMINATES) comparten literalmente el mismo
`precio_real` = 145.069,48 — un relleno copiado. La columna que alimenta el
costeo no es auditable. `cot_tableros` arrastra la misma estructura
(`precio`, `descuento`, `precio_real` independientes).

### 8. Treinta y cinco filas sin desperdicio

El desperdicio vive replicado por fila en `madera!AZ`, no en un parámetro:
0,15 en 6.992 filas y **0 en 35** (filas 6988-7022: familia `ATK`/`CATK`/
`EQTK`/`TPTK`/`PTK`/`CPTK`, `LGP`/`CGP`, `FHCB`, `GFSM`, `TRG10`…). Sus costos
salen ~15% por debajo del resto. Falta confirmar si es intencional (productos
que no se cortan de lámina) o un olvido al copiar filas.

## Riesgo bajo — limpieza

### 9. Veintidós accesorios con costo y precio cero

`RCOR2000/3000`, `RAMZ2000/3000`, `PMPA2600/3000`, `PTOA3000`,
`PTOA3000-30MM`, `KIT-GU2+RO2`, `KIT-SOPx2`, `FREN-SC40KG`, `SCOR`, `HDL128`,
`SPO140`, `CL`, `RFE`, `AS`, `DS`, `HG-HT`, `TOC1118`, `TOCS`, `SP-TOSOPRTB`.
Migrados tal cual aparecen en el selector y suman cero al total.

### 10. Cuatro SKU duplicados

7.023 códigos distintos en 7.027 filas: `SVFD34`, `W2530`, `PN12 7/842` y
`TK596` aparecen dos veces, sin regla de cuál gana al importar por clave única.

## Fragilidad estructural (transversal)

- Fórmulas por **posición absoluta** entre hojas (`'canto y otros '!BS700`):
  insertar una fila desalinea el libro en silencio.
- La hoja `canto y otros ` tiene un **espacio al final del nombre**, que hay
  que reproducir literalmente en cualquier script.
- `Precio` declara 1.048.576 filas de alto (la hoja completa).
- 28.098 fórmulas dependen de `Precio!$V$1` (la TRM): un único punto de
  cambio, pero sin ninguna trazabilidad de con qué TRM se emitió cada
  cotización.
- Cinco hojas ocultas, una de ellas llamada `prueba `.

## Cómo reproducir

Los scripts de auditoría cargan el libro dos veces con `openpyxl`
(`data_only=False` para fórmulas y `data_only=True` para valores) y comparan.
Patrones útiles: contar `re.search(r'\$T\$(\d+)', formula)` por fila para el
mapa de márgenes; buscar las fórmulas de `K` que **no** contienen `$V$1` para
las excepciones de unidad; y extraer
`re.findall(r"'costos unitarios'!\$?([A-Z]+)\$?(\d+)", formula)` sobre las
columnas de madera para saber qué tarifas se consumen de verdad.
