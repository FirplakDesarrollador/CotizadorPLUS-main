# Líneas de material suelto en una cotización

## Qué son

Un tablero, canto o herraje cobrado dentro de una cocina **sin pasar por un
módulo**: un repuesto, un sobrante, herraje adicional. Se agregan con el botón
**"+ Agregar herrajes"**, junto a "+ Agregar módulo".

El catálogo que ofrece es el de **Materiales-Parámetros**: `cot_tableros`,
`cot_cantos` y `cot_herrajes`, solo los activos.

## Unidad y precio

Cada catálogo cobra en su propia unidad y su tarifa ya está expresada en ella,
así que la cantidad se pide en esa misma unidad en lugar de convertir:

| Tipo | Unidad | Tarifa |
| --- | --- | --- |
| Tablero | m² | `cot_tableros.precio_m2` |
| Canto | metro lineal | `cot_cantos.precio` |
| Herraje | unidad | `cot_herrajes.precio` |

El margen **depende de lo que se agregue**, decidido con el usuario: un herraje
lleva `margen_herraje` (35 % por defecto) y un tablero o un canto llevan
`margen_muebles` (60 %), igual que dentro de un módulo. Se aplica con la misma
cadena que `engine.ts` —margen sobre precio, `costo / (1 - margen)`— y el
descuento del proyecto se aplica después, solo sobre el valor en USD, también
como hace el motor.

El costo se reparte igual que en un módulo: un herraje suma a `costoHerrajes` y
el resto a `costoSinHerrajes`, de modo que las columnas **s/H** y **c/H** de la
cotización siguen significando lo mismo.

## El guardia del recálculo

Es la pieza con más consecuencias de todo esto.

Una línea de material no tiene `tipo_mueble_id`. Todas las rutas de recálculo
—editar, agrupar, mover, recalcular la cotización completa— pasan por
`recalcularGrupo()`, que convierte cada línea del grupo en entrada del motor con
`inputDesdeLinea()`. Sin protección, una línea de material haría que el motor
lanzara "Tipo de mueble no encontrado" y **tumbaría el recálculo de la cotización
entera**, no solo el de esa línea.

`grupoSeSaltaElMotor()` lo evita. Comprueba con `some` y no con `every`
deliberadamente: si alguna vez una línea de material quedara mezclada con
módulos, se deja el grupo intacto en lugar de reventar. `agregarLineaMaterial()`
las pone siempre **solas en su grupo**, de modo que esa situación no debería
darse.

Como contrapartida, el precio de una línea de material **no se recalcula**: queda
fijado al agregarla. Si cambia la tarifa del catálogo o el margen del proyecto,
hay que borrarla y volver a agregarla.

## Dónde vive cada cosa

| Pieza | Archivo | Por qué ahí |
| --- | --- | --- |
| Precio, unidades, descripción, guardia | `src/lib/materiales-linea.ts` | No importa `server-only`, así que **se puede probar** |
| Catálogo e inserción | `src/lib/cotizaciones.ts` | Necesita el cliente de Supabase |
| Acciones | `src/app/cotizaciones/actions.ts` | |
| Formulario | `src/app/cotizaciones/[id]/AgregarMaterialForm.tsx` | Pide el catálogo al abrirse, en vez de enhebrarlo como props |

El formulario pide los catálogos con una acción al montarse. Enhebrarlos como
props habría obligado a tocar la página, el cliente del detalle y la tarjeta de
cocina para un dato que solo usa un formulario que casi nunca está abierto.

## Cobertura y deuda

`tests/materiales-linea.test.ts`, 15 casos: el margen por tipo, el reparto entre
las columnas s/H y c/H, el descuento sobre el USD, una TRM de cero que no
produzca `Infinity`, cantidades negativas, un margen del 100 % que no divida por
cero, el formato de la descripción y las cuatro ramas del guardia.

**`quality:learn` deja un hallazgo HIGH sin resolver, con justificación.**
Señala que `cotizaciones.ts` cambió 112 líneas sin `tests/cotizaciones.test.ts`.
Toda la lógica se extrajo ya a `materiales-linea.ts`, que sí está cubierto; lo
que queda en `cotizaciones.ts` es acceso a datos —consultar los catálogos,
insertar la fila— que no se puede probar sin base. Y el módulo **no es
importable desde un test**: empieza con `import 'server-only'` y el intento falla
con *"This module cannot be imported from a Client Component module"*
(comprobado). Cubrirlo exigiría pruebas de integración contra Supabase, que el
repositorio no tiene.

**Sin verificar en pantalla**: la cotización está tras login y no hay
credenciales disponibles, así que el flujo se valida por tipos, pruebas
unitarias, `quality:gate` y build, no abriendo el formulario.
