# Cálculos automáticos del catálogo de tableros

## Alcance

El formulario `CatalogEditForm` de `src/app/admin/AdminCatalogos.tsx` aplica estos cálculos únicamente cuando administra `cot_tableros`. El comportamiento funciona tanto al crear como al editar un registro. Los catálogos de cantos y herrajes, los perfiles y los parámetros conservan su comportamiento anterior.

## Formato y área

`parseFormatoAnchoAlto` acepta medidas en centímetros con `X` o `x`, con espacios opcionales, por ejemplo `122X244`, `183x244` y `124 X 246`. `calcAreaM2` convierte ambas medidas a metros, multiplica y redondea a cuatro decimales.

Si el formato no coincide con el patrón o contiene medidas no positivas, el cálculo retorna `null` y el formulario conserva `area_m2`. Esto permite corregir o escribir el área manualmente.

## Precio bidireccional

- Al cambiar `precio`, `calcPrecioM2` divide el precio entre un área válida mayor que cero y redondea a dos decimales.
- Al cambiar `precio_m2`, `calcPrecio` multiplica por un área válida mayor que cero y redondea a dos decimales.
- Un área vacía, inválida o igual a cero no modifica el campo relacionado.

La actualización ocurre directamente en el `onChange` del campo que originó la operación. El valor calculado se incorpora en una sola actualización funcional de estado, por lo que no dispara el cálculo inverso ni crea ciclos. Todos los campos siguen siendo editables.

## Pruebas

`tests/catalogo-tableros-calculos.test.ts` cubre variantes válidas del formato, el fallback ante formato inválido, ambos sentidos de precio y la protección contra división por cero o área vacía.
