# Interpretación espacial de cajoneras DB

## Resultado y alcance (2026-09-10)

Sí es posible reconstruir una interpretación coherente del armado DB en **frontal, lateral derecha y planta**. Las dimensiones de corte y los nombres permiten recuperar los planos principales, la estructura y el orden de las gavetas. No determinan todas las coordenadas de montaje, ranuras, perforaciones ni el sistema mecánico del cajón.

Se creó una visualización interactiva en [vistas-db.html](../../artifacts/interpretacion-db/vistas-db.html), fragmento para la superficie de visualización de Codex. Contiene siete ejemplos reales y 125 tableros. Las tres vistas son proyecciones de los mismos volúmenes; seleccionar una pieza la resalta en todas las vistas. Se puede alternar transparencia/exterior y desplazar la gaveta superior o interior. El desplazamiento es ilustrativo, no una validación del recorrido del herraje.

Es una investigación y un prototipo de interpretación. No se modificó el motor, las plantillas SQL ni los datos remotos. El estado de aplicación de las migraciones en una base activa no fue consultado.

## Fuentes y trazabilidad

- `Hojas de ruta 2.xlsx`, `Hoja1`: revisión de **1.240 filas, 71 descripciones DB**. Todas tienen laterales con A=762 mm y P=609,6 mm. La columna CANTIDAD está vacía en las 1.240 filas: se cuenta una instancia por fila/letra, no se convierte el vacío en cero ni se agrupan filas repetidas arbitrariamente.
- [evidencia-db.json](../../artifacts/interpretacion-db/evidencia-db.json): siete ejemplos, cada panel conserva fila, letra, nombre, dimensiones, espesor y fórmula originales.
- [extraer_db_visualizacion.py](../../scripts/extraer_db_visualizacion.py): extracción reproducible, solo lectura.
- [engine.ts](../../src/lib/engine.ts), [muebles.ts](../../src/lib/muebles.ts), [cotizar.ts](../../src/lib/cotizar.ts): motor, tipologías y sustitución de precio del riel.
- Migraciones [0014](../../db/migrations/0014_tipos_paneles_db.sql), [0027](../../db/migrations/0027_db_gavetas_mixtas.sql) y [0028](../../db/migrations/0028_geometria_espesor_reveal.sql): evolución local de las fórmulas DB.
- [db-gavetas-mixtas.test.ts](../../tests/db-gavetas-mixtas.test.ts): fixture de geometría corregida. No equivale a una lectura de la plantilla desplegada.

| Ejemplo | Filas de Hoja1 que contienen sus piezas | Tableros | Altos de frentes exteriores (mm) |
| --- | --- | ---: | --- |
| DB15-1S | 16919–16938, filtradas por descripción | 18 | 152,4 / 300,08 / 300,08 |
| DB30-2S | 7997–8014 | 18 | 187,3 / 187,3 / 377,8 |
| HRJ DB24-2 | 7568–7581 | 14 | 377,8 / 377,8 |
| DB30-3 | 8812–8829 | 18 | 250,8 / 250,8 / 250,8 |
| DB24-4 | 5019–5040 | 22 | 187,7 × 4 |
| HRJ DB30-2S SM-15MM | 13937–13955 | 19 | 173,9 / 173,9 / 351 |
| HRJ DB22-2+INT SMG Expocamacol | 17043–17060, filtradas por descripción | 16 | 351 / 351; frente interior aparte: 100 |

## Cómo se interpretan nombres y fórmulas

### Los ejes de la pieza no son ejes globales

El mueble tiene L (horizontal frontal), A (vertical) y P (profundidad). En el DSL antiguo A se llama **Ancho**; en la app se llama **Alto**. No se intercambian los ejes al convertir unidades.

La pieza tiene largo, ancho y espesor, pero su largo no tiene por qué ser horizontal una vez montada. Por ejemplo:

- `SIDE R`: `LxA{0}AyL AxP{0}PyA` significa **largo de pieza = altura del mueble**, ancho de pieza = profundidad. Va en plano vertical lateral.
- `BASE`: `LxL{-30}LyL AxP{-24}PyA` significa ancho útil entre costados y profundidad útil. Va en plano horizontal.
- Frente DB15-1S central: `LxA[0,3938]AyL AxL{-3,2}LyA`: el **largo de corte de 300,08 mm es la altura visible** y el ancho de corte de 377,8 mm es la dimensión horizontal. La plantilla de la app expresa la misma pieza con esas dos dimensiones intercambiadas.
- `BACKING`: `LxA{-2}AyL AxL{-16}LyA` indica una placa vertical posterior de (A−2) × (L−16). No es el fondo horizontal de una gaveta.

En el DSL, `{}` representa desplazamiento aditivo en **mm** y `[]` factor multiplicativo. La app evalúa expresiones en **pulgadas**; `RV=3,2/25,4`, `TC`, `TF` y `TB` son espesores por rol convertidos a pulgadas. Los factores precalculados, como 0,3938, reproducen una referencia concreta pero no prueban una regla universal para cambiar la altura: las 71 hojas DB tienen la misma A=762 mm.

### Diccionario semántico

| Nombre de producción | Equivalente funcional en app | Plano / ubicación inferidos | Evidencia y límite |
| --- | --- | --- | --- |
| SIDE L / SIDE R | `lateral` ×2 | YZ, costados izquierdo/derecho | A×P y lateralidad explícita |
| BASE | `base` | XY, suelo de caja entre costados | L−2TC; alineación frontal asumida |
| RAIL DELANTERO / RAIL DEL | `refuerzo_horizontal` del seed | XY, travesaños delanteros | Nombre y alias del seed; giro y altura exactos no están en el DSL |
| RAIL TRASERO / REF TRASERO | `refuerzo_trasero` | XZ, dos travesaños posteriores | Nombre posterior; posición alta/baja y giro asumidos |
| FONDO GAVETA / FONDO GAV | `base_gaveta` | XY, fondo de cada cajón | L−105, profundidad fija 492 mm en los ejemplos |
| TRASERO CAJON / TRAS CAJON | `trasero_gaveta*` | XZ, trasera del cajón móvil | L−117; altura 68/183 según hoja, no según nombre genérico |
| FRENTE GAVETA SUP/CENTRAL/INF | `frente*` | XZ, fachada de cada gaveta | Orden explícito; sobreposición deducida de L−3,2 |
| BACKING | Función de respaldo; `fondo` no coincide exactamente | XZ, cierre posterior de caja | Dimensiones y espesor explícitos; ranuras inferidas |
| GOLA / GOLA SUP / GOLA INF | `gola_perfil` | XZ detrás del borde frontal | Cantidad/medidas documentadas; sección de montaje no definida |
| FONDO/TRAS/FRENTE GAV INT | No representado espacialmente por el preset `DB2-1OP` | Cajón interior detrás de un frente exterior | Tres piezas explícitas en DB22-2+INT; altura/retranqueo de montaje asumidos |

`rol_tablero` elige material y costo, no orientación: `refuerzo` también contiene fondos y traseros de gaveta. `orden` organiza el listado, no es una coordenada. Los cantos indican aristas tratadas, pero no resuelven por sí solos la cara frontal ni los apoyos.

Las letras A/B/C… identifican instancias **dentro de una hoja**. No son nombres funcionales universales: el respaldo es R en DB15-1S y V en DB24-4. `SUP`, `CENTRAL`, `INF` e `INT` sí aportan posición o pertenencia. `R17L762`, `R20L` y otros sufijos no tienen una definición de mecanizado suficiente en estas fuentes: no se decodificaron como ranuras inventadas.

### Nomenclatura del mueble

- `DB`: Drawer Base, inferior cajonera. `DB15-1S`: 15 pulgadas de ancho nominal, una gaveta pequeña arriba y dos grandes debajo.
- `DB-2S`: dos pequeñas arriba y una grande abajo; no son dos gavetas totales.
- `DB-2/3/4`: número total de gavetas exteriores con frentes repartidos.
- `SM/SMG`: variante de gola. No basta con quitar un dibujo de manija: afecta huecos de fachada y piezas.
- `-F9`: espesor de respaldo 9 mm. El ancho de la base cambia con el respaldo.
- `IC`: alias métrico DB definido por 0029. Se conserva la distinción entre definición local y disponibilidad en una base desplegada.
- `DB2-1OP` del selector tiene tres cajones, pero la app no define una relación espacial de uno interior y dos exteriores. La hoja `DB22-2+INT` proporciona un precedente concreto; su equivalencia comercial exacta con `DB2-1OP` sigue pendiente.

## Reglas numéricas y su alcance

En las siguientes expresiones todas las medidas están en mm, A=altura y L=ancho frontal.

| Elemento | Regla interpretada |
| --- | --- |
| Luz entre costados | L−2TC |
| Base de caja | (L−2TC) × (P−18−TB), según 0028; fuente estándar TC15/TB6: (L−30) × (P−24) |
| Frente exterior, ancho | L−3,2 |
| DB-1S | pequeño 152,4; grandes (A−3×3,2−152,4)/2 |
| DB-2S | u=(A−4×3,2)/4; frentes u, u, 2u+3,2 |
| DB-2/3/4 | A/n−3,2, en 0028 |
| Gola | resta total de 53,6 a la pila; 0028 distribuye proporcionalmente a la altura inicial |
| Fondo de gaveta | ancho L−105 en fuente; app L−4,13 in ≈ L−104,902 |
| Trasero de gaveta | ancho L−117 en fuente; migración mixta L−4,607 in ≈ L−117,018 |

El artefacto conserva los **cortes medidos del Excel**, no fuerza sus valores a una fórmula nueva. En DB15-1S la suma más tres juntas de 3,2 excede A en 0,16 mm. En DB24-4 excede en 1,6 mm: 4×187,7+4×3,2=763,6. Con juntas internas de 3,2, el prototipo centra los frentes y deja márgenes exteriores de 1,52 mm y 0,8 mm respectivamente. Es una hipótesis de reparto que permite mostrar la discrepancia, no una corrección de la fuente. La fórmula corregida de DB-4 da 187,3 mm por frente.

## Hallazgos que impiden dibujar directamente el despiece de la app

1. **Profundidad:** los 142 laterales de las 71 hojas DB tienen `AxP{0}PyA` y 609,6 mm. En esta familia P es profundidad del lateral, no profundidad exterior con frente. Con frente sobrepuesto de 18 mm, el prototipo tiene 627,6 mm totales. Con el frente de 15 mm del ejemplo SM tiene 624,6 mm. La glosa anterior de la wiki que decía P exterior no sirve para estas DB.
2. **Nombre del refuerzo:** 0014 crea `refuerzo_horizontal`; 0028 intenta descontar gola donde `nombre='refuerzo_delantero'`. No hay renombrado DB entre ambas migraciones locales. En una reconstrucción desde ese seed, el UPDATE no afecta el refuerzo DB. El test usa un fixture con `refuerzo_delantero`, por lo que pasa sin detectar esta divergencia. No se verificó si una base activa fue editada manualmente.
3. **Respaldo:** la plantilla 0028 queda en `(L−TC) × A`; DB15-1S real tiene `365×760×6` y no `366×762×6`. La afirmación antigua de que falta todo respaldo debe matizarse: existe `fondo`, pero no reproduce exactamente `BACKING`. En el conjunto DB hay 62 respaldos con descuento L−16, cinco con L−22 y uno con L−20; no imponer L−16 a todos los espesores/ensambles.
4. **Traseros de tipologías parejas:** la plantilla conserva `L−3,427 in` y 2,6875 in de alto (≈68,26 mm). Las fuentes DB24-2 y DB30-3 seleccionadas usan L−117 y 183 mm de alto, mientras DB24-4 usa L−117 y 68 mm. El fixture confirma tamaños de frentes pero no estas traseras contra producción. El ancho genérico queda unos 29,95 mm mayor que el de estas hojas.
5. **Travesaños:** el seed usa 3,25 in=82,55 mm; los siete ejemplos usan 80 mm. Cantidad y ubicación requieren conservar la identidad del modelo y del modificador.
6. **Gaveta interior:** usar únicamente `n_cajones=3` dibujaría tres frentes exteriores iguales. La hoja con `+INT` tiene dos frentes exteriores de 351 mm y uno interior de 100×525,6×15 mm. Se debe modelar por separado cantidad de cajones y cantidad de frentes exteriores.
7. **Herraje intercambiable:** `cotizar.ts` sustituye el precio bajo `RIELTANDEM` cuando se selecciona otro riel. No introduce holguras, altura de lateral, fijaciones ni geometría de ese fabricante. Por ello no se dibuja un sistema comercial preciso a partir del precio seleccionado.

Las siete pruebas DB existentes pasan. Eso valida lo que afirman sus fixtures, no todas las piezas reales ni la aplicabilidad del SQL. Ninguno de estos hallazgos fue corregido en el motor durante esta investigación.

## Hipótesis explícitas del armado

Origen: esquina inferior izquierda del frente de la caja. X a derecha, Y hacia atrás, Z hacia arriba. Los frentes sobrepuestos ocupan Y negativo. Frontal proyecta X/Z, lateral derecha Y/Z y planta X/Y.

- Laterales y base se alinean a Y=0; base apoyada a Z=0.
- BACKING se centra en ancho/alto y empieza detrás del extremo de la base. Con TC15 y L−16, penetra 7 mm en cada costado: sugiere ranura o rebaje. No se modela el mecanizado y esta intersección no es una validación de encastre.
- Travesaños delanteros se dibujan horizontales cerca del borde superior de sus frentes; posteriores verticales arriba/abajo. Sus cotas y giros definitivos no proceden de las fórmulas.
- Fondos de gaveta: 30 mm encima del borde inferior de su frente y 10 mm detrás de la caja. Trasero colocado sobre el fondo, junto al extremo posterior. Son offsets ilustrativos.
- Gola: se distribuyen dos huecos de 26,8 mm, uno superior y otro antes del último frente; perfiles verticales retranqueados 80 mm. El descuento total está documentado; ese emplazamiento no.
- Gaveta interior: frente retranqueado 30 mm, borde superior H−30; situada por encima del cajón exterior superior. La hoja `+INT` no contiene piezas GOLA aunque el nombre es SMG: se muestra el hueco de fachada, sin inventar esos tableros.
- Líneas discontinuas representan costados/herrajes de gaveta esquemáticos sin volumen de corte. No se incluyen patas, zócalo, cubierta, manijas, tornillos ni perforaciones: estas hojas no fijan su geometría de montaje.

## Qué falta para una implementación paramétrica de fabricación

Agregar una capa de montaje sobre el motor de corte, con rol geométrico explícito, instancia, lado, plano, grupo de gaveta, relación interior/exterior, transformación local y anclajes. Guardar las reglas de posición junto con su fuente y estado de confirmación. Conservar el material como dato separado del uso físico de la pieza.

Cada pieza debe derivar su tamaño **una sola vez** y alimentar a las tres proyecciones. Resolver uniones, ranuras y posiciones con un plano aprobado por familia y un perfil de herraje con holguras. Validar cierre de fachada, envolvente y colisiones considerando las uniones reales. No basta con convertir largo/ancho en rectángulos sobre ejes fijos.

Este prototipo prueba la viabilidad visual con siete referencias de altura fija; no certifica cambios arbitrarios de altura, fondo, herraje o espesor.

## Verificación realizada

- Extracción: siete referencias únicas, conteos 18/18/14/18/22/19/16.
- [verificar_db_visualizacion.mjs](../../scripts/verificar_db_visualizacion.mjs): 125 volúmenes conservan exactamente las tres dimensiones de corte por permutación, identidad de fila, dimensiones positivas y límites laterales/verticales. El movimiento de apertura solo traslada las tres piezas de la gaveta elegida, conservando sus relaciones.
- Sintaxis de JavaScript comprobada. Siete pruebas existentes de `tests/db-gavetas-mixtas.test.ts` aprobadas.
- Sin comprobación del mecanizado o del recorrido comercial del herraje. Sin validación visual en navegador.

Referencias relacionadas: [validación de hojas de ruta](validacion_hojas_de_ruta.md), [gavetas mixtas](db_gavetas_mixtas.md), [gola](variantes_frente_gola_sm.md), [motor](motor_calculo.md).
