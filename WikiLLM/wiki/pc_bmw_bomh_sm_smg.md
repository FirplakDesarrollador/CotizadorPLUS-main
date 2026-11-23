# PC, PC-MO, BMW y BOMH: copias SM/SMG

## Catálogo y alcance

Las migraciones `0261_pc_bmw_bomh_sm_smg.sql` y `0262_nombres_copias_pc_bmw_bomh.sql`
crean doce copias: sufijos SM y SMG de PC, PC-MO, BMW-1, BMW-1-FE, BOMH-1 y
BOMH-1-FE. Se copian filas completas de piezas, reglas y herrajes; solo se
retiran las manijas y se aplican los cambios de encuentro entre niveles.
Las correcciones posteriores de fijos, cajas FE y frentes superiores BOMH se
describen en la sección de la migración 0263; prevalecen sobre las copias iniciales.

PCFD-MO y PCFD-MO-SF se renombran PC-MO y PC-MO-SF conservando IDs.
BBL y BBL-SF quedan inactivas. El catálogo compartido por Simulador y
Cotizaciones excluye también BBLFD-D-L/R-SM-SF: se sigue configurando desde
BBLFD-D-L/R-SM con el interruptor sin fondo y el sufijo SF del código.
Su fila interna se conserva para resolver ese interruptor y el historial.

## Referencias geométricas confirmadas

La distancia de 25/21 mm se mide desde el borde inferior de la puerta superior
hasta la **cara inferior** del fijo, hacia arriba. Los refuerzos SM son
verticales de 80 mm de alto, a 20 mm del frente; las golas son horizontales de
80 mm de profundidad, sin retraso, pegadas debajo de cada refuerzo. Usan los
espesores reales de los roles refuerzo y caja, respectivamente.

Las reglas `fijo_superior_z` y `fijo_inferior_z` trabajan en pulgadas. El
montaje las expone como FS/FI en mm; no confundir ambas unidades.

| Variante | Encuentro |
| --- | --- |
| PC-SM | Fijo a puerta superior +25 mm; 30 mm entre puertas; un par refuerzo/gola. |
| PC-SMG | Fijo a puerta superior +21 mm; 30 mm entre puertas; recorte bajo el fijo. |
| PC-MO-SM | Fijo superior a puerta +25 mm; MO desde debajo de la gola superior hasta la cara superior del fijo inferior; dos pares refuerzo/gola; puerta inferior termina 30 mm debajo del fijo inferior. |
| PC-MO-SMG | Fijo superior a puerta +25 mm; MO desde 10 mm debajo del borde inferior de la puerta superior hasta la cara superior del fijo inferior; puerta inferior a 30 mm; recorte solo bajo el fijo inferior. |
| BMW/BOMH SM | Fijo conservado; frente de gaveta termina 30 mm debajo del fijo; un par refuerzo/gola bajo ese fijo. |
| BMW/BOMH SMG | Fijo y parte superior conservados; frente de gaveta a 30 mm; recorte bajo el fijo. |

El mecanizado se guarda en ambos laterales como recorte frontal de 27 mm hacia
el fondo y 73 mm hacia abajo desde la cara inferior del fijo. `RecorteMontaje`
admite `borde: frontal` con `z` obligatorio y validado; el visor existente ya
dibuja recortes frontales a nivel intermedio. La referencia local es FI−73−Z.

PC-SM/SMG conservan cuatro móviles y aplican la distribución superior contando
el fijo descrita en [torres PC](torres_tk_puertas_pcfd_mo.md). Las variantes MO
conservan la distribución original de un móvil superior y dos inferiores.

## Gavetas y límite físico

El montaje BMW/BOMH SM baja la caja de gaveta completa solo cuando hace falta
para caber bajo la gola; nunca cambia sus cortes ni mueve la parte superior.
La bajada se limita a la cara superior de la base. En BMW-1-FE-SM con caja y
refuerzo de 18 mm, el lateral FE de 100 mm no cabe por aproximadamente 0,07 mm:
la cara inferior de la gola queda en 117,93 mm y la base termina en 18 mm.
El simulador muestra un aviso de fabricación; no se recorta silenciosamente
la gaveta ni se desplaza el fijo. Con los tableros de 15 mm el conjunto cabe.

## Verificación de implementación

- Migración ensayada en transacción revertida, respaldo del catálogo en el
  directorio temporal del sistema y posterior aplicación registrada.
- Lectura independiente del catálogo aplicado: doce copias con piezas,
  herrajes y reglas originales intactos salvo las modificaciones enumeradas.
- `tests/pc-bmw-bomh-gola.test.ts`: cotas, espesores 15/18 mm, preservación FE y
  parte superior BOMH, mecanizados, equivalencia de unidades y aviso físico.
- Auditorías de cotizaciones antes/después: cero diferencias de materiales;
  mismos dos grupos inválidos previos (Satori cocinas: plantilla lateral
  agrupable sin exactamente dos laterales; Bosketo: falta largo libre del
  horno). La auditoría estricta no pasa por estos datos anteriores; este
  trabajo no repara ni recalcula esas cotizaciones.
- Compuerta de calidad aprobada con 135 suites. `quality:learn -- --strict`
  sin HIGH; avisos MED/LOW de latencia ajenos a estas tipologías.

Las pruebas visuales usan Chrome local con Playwright porque el plugin Browser
no está disponible. No implican despliegue remoto ni fabricación física.

## Evidencia inicial, antes de la corrección 0263: 2026-11-12

- Chrome local en localhost:3000, escritorio 1440 x 1100 y vista móvil 390 x 844: las doce variantes calculadas; sin errores de aplicación.
- Las doce variantes agregadas por el formulario real a una cotización temporal, recargadas y verificadas en las líneas persistidas. BBLFD con el interruptor sin fondo guardado y recargado como `BBLFD42-D17 7/8R-SM-SF`. Las cotizaciones temporales y sesiones de QA se eliminaron al finalizar.
- Dos cargas independientes y dos ejecuciones de Guardar e imprimir en la cotización temporal: cuatro páginas por PDF, doce códigos presentes y total antes de IVA de COP 8.167.764,97 conciliado contra la suma independiente de líneas. Textos idénticos entre ambas generaciones y programación revisada a resolución completa.
- Dos PDF independientes de KUNDARA CAMPESTRE (10 páginas) y Casa A, con secciones Closet y materiales propios (6 páginas); pares con texto idéntico y revisión visual de todas las páginas renderizadas. Estas dos cotizaciones se revisaron sin guardar modificaciones a sus plantillas.
- Compuerta final: 135 suites aprobadas, sin aumento de deuda. Auditoría consultiva final: cero HIGH; quedan dos MED y tres LOW de latencia del optimizador.
- Evidencias locales en `.tmp/pc-gola-*`; no son artefactos de producción. La prueba se limita al navegador local y no incluye impresión física ni despliegue remoto.

## Correcciones de medidas y contorno: migración 0263

- PC-MO, PC-MO-SM y PC-MO-SMG y sus SF: ambos fijos copian exactamente largo,
  profundidad y descuentos de `base_tapa`, conservando su material de frente.
- BMW/BOMH SM y SMG (FE y SF incluidos): el fijo copia las dos medidas y los
  descuentos de la base. Los fijos se alinean en profundidad con sus bases.
- `ajustarEntrepanos` exceptúa estos fijos de la regla de profundidad de
  entrepaños móviles; sin esta excepción la corrección SQL se sobrescribía.
- Todo refuerzo delantero de las variantes corregidas conserva el largo neto
  de la base y tiene ancho de 80 mm, incluidos los refuerzos añadidos bajo fijos.
- BMW/BOMH FE SM/SMG usan laterales de 100 mm de alto y largo de 500 mm para
  P ≥ 24 pulgadas, 450 mm para 21 ≤ P < 24 y 350 mm por debajo de 21. El fondo
  queda 8 mm más corto. Se conserva la referencia de materiales de cada variante.
  Los ejes de fabricación son largo = profundidad y ancho = alto; el montaje
  lateral YZ intercambia esos ejes para representar el lateral correctamente.
- La caja interna BOMH-FE es la pequeña: laterales y contraparche de 100 mm,
  trasero de 80 mm. Las anchuras de trasero y contraparche siguen el descuento
  DB-FE de dos espesores de caja, 26 mm de rieles y dos espesores de lateral.
  El frente exterior conserva el encuentro a 30 mm bajo el fijo.
- BOMH sin FE: trasero de 68 mm para la gaveta pequeña Tandem.
- BOMH: los frentes laterales superiores parten de la cara superior del fijo
  (`FI+TR`) y terminan bajo el refuerzo superior (`A−80 mm`). Su altura es
  `A−80/25.4−fijo_inferior_z−TR` en pulgadas, sin el antiguo límite que dejaba
  el frente corto. El refuerzo superior mantiene su posición.
- `contornoLateral` conserva la esquina frontal superior cuando el recorte es
  intermedio: desaparece la arista diagonal, sin rellenar el mecanizado 27×73.
  Los mecanizados que sí abren por arriba siguen quitando esa esquina.

### Evidencia de la corrección

Migración 0263 respaldada, ensayada con rollback y aplicada/registrada. El ensayo
modifica 54 piezas y conserva tipos, reglas y herrajes. Pruebas con espesores
15/18 mm, límites de profundidad FE y SF; geometría de polígonos, área neta del
recorte y preservación de las piezas fuera de la corrección solicitada.

En Chrome local (Playwright, Browser plugin no disponible) se calcularon y
guardaron las doce variantes, se recargaron y se contrastaron las medidas del
breakdown persistido contra las bases. Se inspeccionaron los dos polígonos SVG
de cada una de las seis variantes SMG: ninguna arista diagonal. Capturas en
`.tmp/pc-correcciones-contorno-*`; sin errores de aplicación.

Se generaron dos PDF independientes por proyecto: prueba temporal (4 páginas),
KUNDARA (10) y Casa A/Closet (6). Los pares tienen texto idéntico y sus páginas
renderizadas fueron revisadas. Los doce códigos están presentes y el total de
prueba antes de IVA, COP 8.102.117,13, coincide con la suma de líneas guardadas.
La cotización temporal y las sesiones de QA se eliminaron. La compuerta aprobó
135 suites; `quality:learn -- --strict` reportó cero HIGH, un MED y dos LOW.
Las auditorías anterior y posterior mantienen cero diferencias de materiales y
los mismos dos errores previos de Satori/Bosketo descritos arriba.

### Dos líneas históricas recalculadas con autorización

Hay dos despieces guardados anteriores a la corrección. La previsualización de
solo lectura confirma fijos iguales a base y los siguientes cambios:

| Proyecto | Profundidad anterior → nueva | Precio de línea COP anterior → nuevo | Cambio total de proyecto antes de IVA |
| --- | --- | --- | --- |
| Bosketo | 511,9 → 526 mm | 712.159,38 → 713.691,89 | +30.650,20 COP, por repetición de área |
| KUNDARA CAMPESTRE | 411,9 → 426 mm | 875.570,07 → 877.597,98 | +68.948,94 COP, por repetición de área |

La primera ejecución fue rechazada por la revisión automática al faltar una
autorización expresa para modificar importes históricos. El usuario respondió
«autorizo» y se recalcularon únicamente los dos grupos indicados, cada uno con
una línea. Se comprobó que los importes coincidieran con la previsualización
aprobada antes de escribir y después de guardar. Cantidades, materiales y todas
las demás líneas de ambos proyectos permanecen iguales al respaldo.

Totales actuales antes de IVA: Bosketo COP 156.717.077,37 y KUNDARA CAMPESTRE
COP 1.585.637.028,82. La cabecera y la sección afectada de cada proyecto quedaron
conciliadas con sus líneas y repeticiones de área. El respaldo completo de
cabeceras, áreas, grupos y líneas está en el directorio temporal del sistema:
`cotizador-fijos-pc-mo-0263-1794508359183.json`.

Se abrieron las dos cotizaciones actualizadas en Chrome local y se generaron
dos PDF desde cargas independientes por proyecto: Bosketo 6 páginas y KUNDARA
10. Cada par tiene texto idéntico, los códigos actualizados están presentes y
los totales impresos coinciden con los guardados en la moneda de la propuesta
(Bosketo COP, KUNDARA USD). Se revisaron las páginas renderizadas; sin errores
de aplicación. La sesión temporal se cerró al terminar.

Compuerta posterior aprobada: 135 suites, sin regresiones. Auditoría de datos:
cero diferencias de materiales y los mismos dos errores previos de Satori y
el hueco de horno de Bosketo, ajenos a estos grupos. Estos datos no se repararon.

Previsualización en `.tmp/previsualizar-fijos-pc-mo.ts`; aplicación autorizada
en `.tmp/sincronizar-fijos-pc-mo.ts`; informe de cambios y respaldo en
`.tmp/pc-correcciones-sincronizacion.json`. Evidencia PDF y navegador en
`.tmp/pc-mo-autorizado-*`.
