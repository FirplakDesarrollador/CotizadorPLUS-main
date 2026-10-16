// Orden de los grupos de módulos dentro de una cocina.
//
// `cot_grupos_modulos` tiene única `(cocina_id, orden)`. La regla vive aparte de
// `cotizaciones.ts` para poder probarla: aquel importa `server-only` y no se
// carga desde un test.

/**
 * Orden libre para un grupo nuevo, a partir del mayor que ya existe en la cocina.
 *
 * Es **max + 1**, no el conteo de grupos. El conteo solo coincide si los valores
 * son 0..n-1 sin huecos, y basta un grupo borrado para que choque contra la
 * única. `normalizarGrupos` renumera a 0..n-1 después, así que el valor exacto
 * no importa: lo que importa es que no colisione.
 */
export function siguienteOrdenGrupo(ordenMaximo: number | null | undefined): number {
  return typeof ordenMaximo === 'number' && Number.isFinite(ordenMaximo)
    ? Math.floor(ordenMaximo) + 1
    : 0;
}
