# Rieles de Cajón para Muebles DB

## Contexto

Los muebles tipo **DB (Cajonera)** tienen una plantilla de herrajes que incluye un riel de cajón por defecto: `RIELTANDEM` (Riel Tandem China, ~$49.707). En la hoja `materiales.xlsx` (Hoja1, sección "HERRAJES") hay 6 tipos de riel disponibles, lo que motivó esta funcionalidad.

## Catálogo de Rieles (cot_herrajes, categoria='riel')

**Importante:** el `codigo` de cada fila debe coincidir EXACTAMENTE con el valor real en la tabla `cot_herrajes` de Supabase — `cotizar.ts` indexa `herrajesByCode` por ese campo (`Object.fromEntries(herrajesAll.map(h => [h.codigo, h]))`) y si `DB_RIELES` en `muebles.ts` usa un código distinto, el override de precio falla en silencio (el mueble se sigue cotizando con el precio de `RIELTANDEM`). El 2026-07-21 se detectó que 4 de los 6 códigos en `muebles.ts` no coincidían con producción (ver log). Verificar siempre contra la BD real, no solo contra los archivos de migración, antes de confiar en los códigos.

| Código real (BD) | Nombre | Precio (COP/par) | Fuente |
|---|---|---|---|
| `RIELMETALBOX` | Riel metal BOX | $28,000 | Excel Hoja1 fila 63 |
| `RIELFE500` | Riel full extension 500mm | $27,105 | Excel Hoja1 fila 64 |
| `RIELTANDEM` | Riel cajón Tandem | $49,706.80 | 0016_herrajes_tipos.sql |
| `RIELSLIMCHI` | Riel Slim China | $55,671.62 | Excel Hoja1 fila 66 |
| `SLIMBOXALTO` | Slim Box Alto Madecentro | $48,250 | Excel Hoja1 fila 67 |
| `SLIMBOXBAJO` | Slim Box Bajo Madecentro | $28,700 | Excel Hoja1 fila 68 |

Migraciones: `db/migrations/0020_rieles_db.sql` (5 rieles iniciales — códigos corregidos 2026-07-21 para reflejar los que realmente existen en Supabase), `db/migrations/0021_riel_full_extension.sql` (Riel full extension 500mm, `RIELFE500`, agregado 2026-07-21).

## Arquitectura de la Solución

### El problema
La plantilla de herrajes (`cot_herrajes_plantilla`) tiene el rol `riel` con `herraje_codigo = 'RIELTANDEM'` fijo en BD. Para cambiar el riel por mueble sin tocar la plantilla ni el motor, se usa un **override de precio en memoria**.

### Mecanismo (`cotizar.ts`)
```ts
if (inp.rielCodigo && inp.rielCodigo !== 'RIELTANDEM') {
  const rielElegido = herrajesByCode[inp.rielCodigo];
  if (rielElegido) {
    herrajesByCode['RIELTANDEM'] = { ...herrajesByCode['RIELTANDEM'], precio: Number(rielElegido.precio) };
  }
}
```
El motor (`engine.ts`) no se toca — busca el precio por código de herraje y encuentra el precio sobreescrito.

### Campo nuevo en CotizarInput
```ts
rielCodigo?: string; // ej. 'RIELMETALBOX'
```
Fluye desde el formulario → `CotizarInput` → `AgregarLineaInput` (por herencia) → `cotizar()`.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/lib/muebles.ts` | `DB_RIELES: DbRiel[]` — catálogo de rieles para componentes cliente (6 entradas) |
| `src/lib/cotizar.ts` | `rielCodigo?` en `CotizarInput` + override de precio en `cotizar()` |
| `src/store/simuladorStore.ts` | `rielCodigo: string` con default `'RIELTANDEM'` |
| `src/app/cotizador/CotizadorForm.tsx` | Selector "Tipo de riel" visible solo para DB |
| `src/app/cotizaciones/[id]/AddLineForm.tsx` | Ídem en formulario de cotizaciones |

## Comportamiento en UI

- El selector **"Tipo de riel"** aparece únicamente cuando el tipo de mueble seleccionado es **DB** (su `pref` empieza por `'DB'`).
- Por defecto está en `RIELTANDEM` para mantener compatibilidad con cotizaciones existentes.
- Muestra nombre + precio formateado en COP para facilitar la elección.
- El precio del riel seleccionado reemplaza al de `RIELTANDEM` en el cálculo; el desglose de herrajes mostrará el costo correcto.
