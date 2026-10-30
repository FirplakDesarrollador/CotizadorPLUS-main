# Copiar una sección completa de cotización

El icono de dos hojas en la cabecera de cada sección, junto a eliminar, crea
una copia inmediata dentro de la misma cotización. El nombre conserva el
original más `-copia`; se puede cambiar con el botón habitual **renombrar**.
La copia queda justo debajo del origen, con su misma cantidad de repeticiones.
Durante la operación se bloquea el botón y se muestran los errores sin confirmar
una copia fallida. No se abre una pestaña ni se pide confirmar la duplicación.

## Datos y precios

Se copian todos los campos de `cot_cocinas`, `cot_grupos_modulos` y
`cot_cotizacion_lineas`: etiquetas y posiciones de grupo, códigos, cantidades,
configuración de materiales/cantos, HOOD/FREE y otros overrides, herrajes/otros,
anotaciones, despieces, referencias y precios COP/USD. Los IDs y las fechas son
nuevos; cada línea apunta a su nuevo grupo y sección. Las líneas históricas sin
grupo mantienen ese estado. No hay referencias compartidas con los grupos de
origen. Los JSON se copian completos mediante `jsonb_populate_record`.

La duplicación conserva precios guardados, sin volver a ejecutar el motor ni
sincronizar materiales. El total nuevo se obtiene sumando los precios totales
de sus líneas y multiplicando una vez por la cantidad de secciones. No se vuelve
a multiplicar la cantidad de línea, ya incluida en su precio total. Se añade
esta contribución a la cabecera en ambas monedas, sin modificar otras secciones.
La clasificación PDF de adicionales y la familia closet se conservan.

## Transacción y permisos

`0233_duplicar_seccion_cotizacion.sql` implementa la RPC
`cot_duplicar_cocina(p_cotizacion_id,p_cocina_id)` con `SECURITY INVOKER` y los
permisos RLS existentes de propietario/admin. Solo `authenticated` recibe EXECUTE;
se revoca a PUBLIC y anon. No hay nuevos roles ni políticas.

La RPC bloquea la cabecera y sección y mantiene estables sus grupos/líneas,
valida que pertenezcan a la cotización y reasigna los grupos mediante un mapa
de UUID. Desplaza el orden de las secciones posteriores, inserta todos los
registros y actualiza importes en la misma transacción. Cualquier fallo revierte
también el orden y los grupos nuevos, sin dejar una sección parcial.

`duplicarCocina()` en `src/lib/cotizaciones.ts` llama a esa única RPC.
`duplicarCocinaAction()` verifica sesión e invalida detalle, impresión, lista y
dashboard. `CocinaCard.tsx` presenta el icono, el estado ocupado y los errores.
El flujo existente de renombrar sigue aplicando sus reglas de materiales.

## Verificación

- `tests/cotizaciones.test.ts`: parámetros y resultado RPC, errores y ausencia
  de recálculo por motor.
- `db/tests/duplicar_seccion.sql`: transacción con rollback; igualdad de todos
  los campos, grupos remapeados, líneas sin grupo, adicionales fraccionarios,
  repetición de sección, COP/USD, independencia al editar, renombrado, copia
  repetida/vacía, rechazo de usuario ajeno y de cotización distinta, acceso
  anónimo y rollback provocado después de insertar sección/grupos.
- La prueba SQL revoca INSERT de líneas solo dentro de su transacción para
  provocar ese fallo y revierte datos y permisos al finalizar.

Prueba real en Chrome con Playwright (plugin Browser no disponible): sección
temporal con diez líneas, ocho grupos y cantidad 32; doble clic produjo una
sola copia. Se compararon campos/JSON y grupos, nuevos IDs, orden adyacente,
duplicación exacta del total y renombrado independiente. Se verificaron dos
generaciones de PDF incluyendo las dos filas de adicionales.

Relacionados: [agrupación](plan_agrupacion_modulos.md),
[protocolo PDF](protocolo_pdf_cotizaciones.md),
[arquitectura frontend](arquitectura_frontend.md).

Resultado: 91 suites aprobadas en quality:gate y cero HIGH en quality:learn
--strict. Auditoría de todas las propuestas sin errores ni diferencias. Icono
verificado también a 390 px. Dos PDF de cinco páginas con texto idéntico y
revisión de páginas renderizadas; adicionales separados de muebles y total
incluido una vez. Cotización temporal y copias eliminadas al finalizar.
