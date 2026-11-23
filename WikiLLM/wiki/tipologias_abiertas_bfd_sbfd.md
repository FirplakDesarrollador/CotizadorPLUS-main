# Tipologías abiertas BFD y SBFD

La migración `0184_tipologias_abiertas_bfd_sbfd.sql` incorpora versiones de catálogo sin puertas para toda la familia activa BFD/SBFD:

| Fuente | Abierta | Descripción visible |
| --- | --- | --- |
| `BFD` | `OBFD` | Mueble inferior (sin puertas) |
| `BFD-SM` | `OBFD-SM` | Mueble inferior con gola de madera (sin puertas) |
| `SBFD` | `OSBFD` | Mueble inferior lavaplatos (sin puertas) |
| `SBFD-SM` | `OSBFD-SM` | Mueble inferior lavaplatos con gola de madera sin entrepaño (sin puertas) |

## Regla de clonación

Cada tipo abierto es una copia explícita de su fuente. Se conservan categoría, margen, familia, etiquetas, cartón, prefijo métrico, permiso de agrupación, reglas paramétricas, herrajes estructurales y todos los metadatos de fabricación de las piezas. No se conservan manijas ni bisagras, porque dependen de la existencia de puertas.

La única exclusión son las filas de `cot_piezas_plantilla` cuyo `rol_tablero` es `frente`. El criterio deja intactos fondo, carcaza, refuerzos, entrepaños y gola de madera. Coincide con la evidencia documentada en [Validación contra hojas de ruta](validacion_hojas_de_ruta.md): el modificador `O` representa la carcaza abierta y `OBFD` equivale a BFD menos sus puertas.

La migración `0184` es idempotente: actualiza el tipo y reconstruye piezas, reglas y herrajes desde las fuentes vigentes. La migración `0185_herrajes_tipologias_sin_puertas.sql` retira después manijas y bisagras de los cuatro tipos abiertos y valida la ausencia de ambos roles.

## Regla general del motor

El motor determina si hay puertas desde el despiece efectivo, no desde el prefijo. Si no queda ninguna pieza con `rol_tablero = frente` y cantidad positiva, omite automáticamente los herrajes con rol `manija` o `bisagra`. Esto cubre tanto las tipologías O* como cualquier módulo calculado con `modoFrentes = sin_frentes`. Patas, tornillos, rieles y demás herrajes estructurales permanecen sin cambios.
