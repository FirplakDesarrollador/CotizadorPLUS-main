# Codificación comercial de módulos

## Fuente única de verdad

`codigoComercial()` en `src/lib/module-groups.ts` arma el código final de un
módulo. Antes de 2026-09-15 la regla estaba replicada en cuatro superficies que
producían cadenas distintas para el mismo módulo:

| Superficie | Resultado histórico para `W` 29×36 con `SM` |
| --- | --- |
| `recalcularGrupo()` (`cotizaciones.ts`) | `W2936-SM` ✔ |
| `AddLineForm` (`prefLabel`) | `W29-SM` ✘ — omitía el alto |
| `HdrBuscador` | `W2936-SM` ✔ |
| Simulador (`moduleTitle`) | `W29` ✘ — sin alto, sin tipología, sin sufijo |

El valor persistido en `cot_cotizacion_lineas.codigo_modulo` siempre salió de
`recalcularGrupo()`, así que el dato guardado era correcto; lo que divergía era
lo que el usuario veía antes de guardar. Las cuatro superficies ahora llaman a
`codigoComercial()`.

## Orden de los segmentos

```text
pref + largo [+ alto] [+ profundidad-superior] [+ -tipologiaDB] [+ -nOP-PUSH] [+ -SM] [+ -18MM]
```

1. **`pref` + largo** — vía `codigoModulo()`. En prefijos con guion la medida se
   inserta antes del guion: `B-FE` + 12" → `B12-FE` (ver migración
   `0041_codigo_modulo_medida_antes_del_sufijo.sql`).
2. **Alto** — solo en los tipos de `PREFS_ALTO_EN_CODIGO` (ver abajo).
3. **Profundidad de muebles superiores** — se concatena en todos los muebles
   reconocidos por `esMuebleSuperior()`, inmediatamente después del alto y antes
   de cualquier sufijo. Por ejemplo, `W` de 29 × 36 × 12 produce `W293612` y
   `W-SM` produce `W293612-SM`. `WCC` se excluye porque pertenece a clóset.

La migración `0215_profundidad_nombres_superiores_existentes.sql` aplica la
misma convención a las líneas históricas de cotizaciones. Solo transforma el
segmento base cuando coincide exactamente con el formato anterior, por lo que
es idempotente y no duplica la profundidad en códigos nuevos. Después recompone
`cot_grupos_modulos.codigo_grupo`. Los snapshots de versiones manuales no se
reescriben porque son inmutables por contrato.

La recomposición se ejecuta en una sentencia posterior mediante
`0216_recomponer_codigos_grupo_profundidad.sql`. Esta separación es necesaria
porque un CTE mutador de PostgreSQL conserva la instantánea anterior para otras
subconsultas de la misma sentencia; `0216` agrega además una aserción que impide
dejar grupos desincronizados.
4. **Tipología DB** — `DB18` + `DB-1S` → `DB18-1S`. El motor solo conoce el
   prefijo base `DB`; la tipología vive en el formulario.
5. **PCFD con gavetas ocultas** — `PCFD12-2OP-PUSH`.
6. **Sistema de frente** — `-SM` cuando `sistemaFrente === 'gola'`, vía
   `sufijoSistemaFrente()`. La familia `DB` tradicional lo bloquea incluso si
   recibe un estado Gola heredado: `DB30-1S` permanece `DB30-1S`. Las familias
   independientes `DB-*-SM` y `DB-*-SM-FE` ya llevan su sufijo propio. Ver
   [variantes_frente_gola_sm.md](variantes_frente_gola_sm.md).

Las torres `PC`, `PCFD`, `PCFD-MO`, `VPC` y `OVPC` siempre incorporan largo,
alto y profundidad. Cuando tienen el zócalo asignado, cierran el código con un
segmento separado por espacio: ` TK<medida>`. Así, una `PCFD-MO` de
30 × 96 × 24 pulgadas con zócalo de 4 pulgadas se identifica como
`PCFD309624-MO TK4`. `codigoComercial()` recibe TK normalizado en pulgadas y lo
presenta en el sistema del proyecto. La migración
En métrico, el valor se limita a seis decimales, la misma precisión de los
formularios, para que una entrada `10` no se muestre como `10.00000032` tras la
conversión de ida y vuelta. `0224_codigos_torres_dimensiones_tk.sql` normaliza
las líneas históricas que ya tenían `overrides.zocalo`; la migración
`0225_normalizar_tk_metrico_codigos_torres.sql` corrige los sufijos métricos
existentes y recompone sus códigos de grupo.

`PCFD` no admite una variante comercial `PCFD-SF`: el selector fuerza la
tipología base y la migración `0227_pcfd_sin_sf_y_tk_sin_predeterminado.sql`
normaliza las líneas históricas. Esa migración también elimina el TK
predeterminado de `PC`, `PCFD`, `PCFD-MO` y `OVPC`; el sufijo `TK<medida>` solo
aparece cuando el usuario asigna una medida. `VPC` conserva `TK0` inicial.

## Qué tipos llevan el alto en el código

`PREFS_ALTO_EN_CODIGO = ['W', 'UW', 'OW', 'WBL', 'WER', 'WLD', 'WPC', 'WSM', 'PN', 'F', 'TK', 'DFE']`

`DFE` (gavetero de clóset) incluye tanto el alto como la profundidad inmediatamente tras el largo: por ejemplo, `DFE561745` corresponde a 56 de largo, 17 de alto y 45 de profundidad en cm, y `DFE24818` en pulgadas. Esto asegura consistencia entre el Simulador, el selector de agregar módulo, la tabla de cotización y el histórico en base de datos. La migración `0226_dfe_alto_y_profundidad_codigo.sql` normalizó las líneas existentes en `cot_cotizacion_lineas` y sincronizó sus respectivos grupos en `cot_grupos_modulos`.

`F` incluye largo y alto en el código comercial: un filler de 6 × 30 pulgadas
se identifica como `F630`. Al seleccionar esta tipología, Simulador,
cotizaciones y HDR restablecen el sistema de frente a `manija`, evitando que
herede Gola de un módulo configurado anteriormente.

En sistema imperial, `anchoCodigo()` presenta cualquier parte decimal como
fracción de pulgada, redondeada al dieciseisavo más cercano y reducida. Por
ejemplo, `12.75` se muestra como `12 3/4` y `PN12.87536` como `PN12 7/836`.
Esta normalización es solo de presentación del código: las dimensiones usadas
por el motor conservan su valor numérico. Los códigos métricos mantienen sus
decimales. El mismo principio se aplica a cada dimensión incorporada al nombre,
incluido el alto: 12,875 × 36,75 pulgadas produce `PN12 7/836 3/4`.

`TK` también incluye largo y alto. Por ejemplo, un zócalo de 4,25 × 36,5
pulgadas se identifica como `TK4 1/436 1/2`.

Las familias superiores `UW` y `OW` también codifican alto y profundidad: por
ejemplo, `UW123613` corresponde a 12 de largo, 36 de alto y 13 de profundidad.

La familia `W` de superiores de pared y los paneles `PN` son los únicos cuyo
alto varía de forma independiente del tipo; en el resto el alto es un dato
implícito de la tipología y no se codifica. `incluyeAltoEnCodigo()` compara
contra la base del prefijo (lo anterior al primer guion), de modo que una
variante `W-XX` heredaría la regla.

**`WCC` queda fuera a propósito**: pese al prefijo `W`, es un módulo de clóset
(`categoria='closet'` en `cot_tipos_mueble`), no un superior de pared.

Los superiores que no llevan alto por regla general sí incorporan profundidad.
`TW` y `TW-SM-PUSH` incorporan largo, alto y profundidad; 30 × 24 × 12 pulgadas
produce `TW302412` o `TW302412-SM-PUSH`, respectivamente.

## Sistema de medida

`anchoCodigo()` convierte la medida al sistema del proyecto (`imperial` → in,
`metrico` → cm) sin redondear a anchos de catálogo.

Durante la edición, una medida vacía o una fracción incompleta puede ser
temporalmente `NaN`. `anchoCodigo()` devuelve una cadena vacía para cualquier
valor no finito y `BBLFD` omite el sufijo `-D...L/R` hasta que `Door` sea un
número positivo válido. Así, un estado parcial del formulario no interrumpe el
renderizado del Simulador.

- **Cotizaciones**: el sistema viene del proyecto (`obtenerSistema()`).
- **HDR**: fijo en `imperial`.
- **Simulador**: no tiene sistema de proyecto; se deriva de la unidad activa
  (`in` → imperial, `cm`/`mm` → métrico).

## Dónde se ve el código

- **Simulador**: badge bajo el precio estimado en el panel de resultado, y
  título de cada tarjeta en modo combinado. En modo combinado el badge muestra
  el código de grupo (`codigoGrupo()`, unido por `.`).
- **Cotizaciones**: `codigo_modulo` de cada línea; `CocinaCard` e `imprimir`
  hacen fallback a `pref` si está vacío.
- **HDR**: título del módulo en el buscador manual.

## Estado en Supabase

La migración `0080_codigo_modulo_w_prof_24.sql` normaliza las líneas `W` de
profundidad 24 in (o 60,96 cm en sistema métrico) que conservaron el formato
anterior, incluyendo la variante con `-SM`. Solo actualiza el código construido
sin la profundidad, por lo que es idempotente y no toca códigos ya normalizados.

La regla está normalizada en la base real. `0046_codigo_modulo_alto_familia_w.sql`
corrigió las líneas guardadas con el código corto (`PN14` → `PN1422`): 16 líneas
de la familia W/PN, todas coherentes con la regla, 0 desactualizadas.

Los cuatro tipos que la regla añadió (`WBL`, `WER`, `WLD`, `WPC`) no tenían
ninguna línea guardada, así que ampliarla no reescribió códigos existentes.

La migración es idempotente y su condición es estricta: solo toca filas cuyo
código es exactamente `pref || largo`, de modo que un código con sufijo (`-SM`,
`-1S`, `-2OP-PUSH`) queda intacto. Solo normaliza las líneas cuya unidad ya es la
del sistema del proyecto (imperial→in, métrico→cm); las demás combinaciones
exigirían replicar la conversión de unidades en SQL y se dejan al recálculo, que
usa el motor real.

## Deuda conocida

`construirFilaLinea()` arma `descripcion_es` con `prefLabel`, que al agregar la
línea es el código completo y al recalcular es solo el prefijo base. La
descripción de una línea cambia de `W2936-SM 29x36x12 in` a `W 29x36x12 in`
tras el primer recálculo. El campo `codigo_modulo` no se ve afectado.
## Sufijo por espesor de caja y frente

`codigoComercial()` agrega `-18MM` al final del código cuando los tableros
seleccionados para los roles `caja` y `frente` tienen ambos `espesor_mm = 18`,
y agrega `-15MM` cuando ambos tienen `espesor_mm = 15`.
La condición usa el dato estructurado del catálogo, no el texto del código o de
la descripción del material. Si uno de los roles usa otro espesor, el sufijo no
se genera. Ejemplos sin SM: `WSM251514-18MM` y `WSM251514-15MM`.

Cuando el módulo es un mueble superior de las familias `W` o `TW` y el código
contiene el segmento `-SM`, el indicador se integra inmediatamente después de
`SM`: `W2636-SM18`, `W332124-SM18-PUSH`, `TW302412-SM18` o
`TW302412-SM18-PUSH`. Para 15mm se aplica la misma integración:
`W2636-SM15`, `W332124-SM15-PUSH` o `TW302412-SM15-PUSH`. En esos casos no se
agrega un sufijo separado al final.

Las familias con segmento `SMG` integran también el espesor común: `SMG15`
o `SMG18`, antes de FE/SF. Ejemplos: `BFD60-SMG15-SF` y
`DB32-2S-SMG15-FE-SF`. Con caja/frente de distinto espesor se conserva `SMG`.

### Actualización de cotizaciones históricas (2026-10-30)

`scripts/actualizar-codigos-cotizaciones.ts` audita todas las líneas y grupos
usando `codigoComercial`, el sistema de medida del proyecto y los espesores
estructurados del catálogo. Omite adicionales sin tipología. Con `--apply`
crea respaldo en el temporal del sistema y actualiza códigos de módulos,
códigos concatenados de grupos y etiquetas de origen del despiece, en una
transacción con comprobación de los códigos previos. No recalcula importes,
cantidades ni materiales; los snapshots históricos permanecen inmutables.

Ejecutar con `node --conditions=react-server --env-file=.env --import tsx
scripts/actualizar-codigos-cotizaciones.ts` (añadir `--apply` para aplicar).
Se auditaron 9 cotizaciones: 40 módulos y 25 grupos de MALECÓN 72 requerían
SMG15; las demás líneas ya cumplían la convención. Segunda pasada: cero cambios.

Verificación: 471 líneas comparadas con el respaldo; solo cambiaron los códigos
y 161 etiquetas de origen. Precios, cantidades, materiales y totales de MALECÓN
72 conservados. Dos generaciones independientes del PDF (diez páginas cada una)
con texto idéntico, códigos SMG15 presentes y revisión de todas las páginas
renderizadas. Regresiones de SMG15/SMG18, FE/SF, SM15 y espesores mixtos en
`tests/module-groups.test.ts`. No se modificó el formato de impresión.

La clasificación compartida de muebles superiores incluye explícitamente a
`TW` y todas sus variantes `TW-*`, además de las tipologías determinadas por la
familia `W`. Toda regla formulada para “muebles superiores” debe usar esta
clasificación central y contemplar también los TW.

El sufijo se propaga desde la misma fuente de verdad a Simulador, alta y
recálculo de cotizaciones, persistencia de `codigo_modulo` y buscador HDR.
