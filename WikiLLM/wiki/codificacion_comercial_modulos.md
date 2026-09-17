# Codificación comercial de módulos

## Fuente única de verdad

`codigoComercial()` en `src/lib/module-groups.ts` arma el código final de un
módulo. Antes de 2026-09-15 la regla estaba replicada en cuatro superficies que
producían cadenas distintas para el mismo módulo:

| Superficie | Resultado para `W` 29×36 con `SM` |
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
pref + largo [+ alto] [+ -tipologiaDB] [+ -nOP-PUSH] [+ -SM]
```

1. **`pref` + largo** — vía `codigoModulo()`. En prefijos con guion la medida se
   inserta antes del guion: `B-FE` + 12" → `B12-FE` (ver migración
   `0041_codigo_modulo_medida_antes_del_sufijo.sql`).
2. **Alto** — solo en los tipos de `PREFS_ALTO_EN_CODIGO` (ver abajo).
3. **Tipología DB** — `DB18` + `DB-1S` → `DB18-1S`. El motor solo conoce el
   prefijo base `DB`; la tipología vive en el formulario.
4. **PCFD con gavetas ocultas** — `PCFD12-2OP-PUSH`.
5. **Sistema de frente** — `-SM` cuando `sistemaFrente === 'gola'`, vía
   `sufijoSistemaFrente()`. Ver [variantes_frente_gola_sm.md](variantes_frente_gola_sm.md).

## Qué tipos llevan el alto en el código

`PREFS_ALTO_EN_CODIGO = ['W', 'WBL', 'WER', 'WLD', 'WPC', 'PN']`

La familia `W` de superiores de pared y los paneles `PN` son los únicos cuyo
alto varía de forma independiente del tipo; en el resto el alto es un dato
implícito de la tipología y no se codifica. `incluyeAltoEnCodigo()` compara
contra la base del prefijo (lo anterior al primer guion), de modo que una
variante `W-XX` heredaría la regla.

**`WCC` queda fuera a propósito**: pese al prefijo `W`, es un módulo de clóset
(`categoria='closet'` en `cot_tipos_mueble`), no un superior de pared.

Los demás superiores por categoría (`S`, `SA`, `SBAS`, `SLOC`, `SMO`, `UW`,
`TW`) tampoco llevan alto: no hay hoja real que respalde el cambio y ampliarlo
reescribiría códigos ya guardados en el próximo recálculo.

## Sistema de medida

`anchoCodigo()` convierte la medida al sistema del proyecto (`imperial` → in,
`metrico` → cm) sin redondear a anchos de catálogo.

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
