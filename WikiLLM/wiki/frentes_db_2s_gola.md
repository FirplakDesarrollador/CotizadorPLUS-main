# Frentes de tres gavetas DB-2S con gola SM/SMG

Regla confirmada por el usuario el 2026-11-06 para `DB-2S-SM`, `DB-2S-SMG` y sus variantes FE, SF y FE-SF. Sustituye en estas configuraciones el descuento histórico de 53,6 mm; no generaliza la distribución de tres frentes a DB-2, DB-3, DB-2-1INT ni DB tradicional.

## Fórmulas y ejemplo

La gola consume dos espacios de **30 mm**. `A` es el alto exterior, y la luz `RV` es **3,2 mm**:

- Frente inferior grande: `(A − 2 × 30) / 2`.
- Cada frente pequeño (superior y central): `grande / 2 − RV`.
- Comprobación: `2 × pequeño + grande + 2 × 30 + 2 × RV = A`.

| Alto exterior | Frente superior | Frente central | Frente inferior |
| --- | --- | --- | --- |
| 762 mm / 30 pulgadas | 172,3 mm | 172,3 mm | 351 mm |
| 780 mm | 176,8 mm | 176,8 mm | 360 mm |
| 785 mm, imagen suministrada | 178,05 mm | 178,05 mm | 362,5 mm |

HDR presenta máximo un decimal: 178,05 mm se muestra como **178,1**. El cálculo y los consumos conservan la precisión interna del motor. El ancho del frente sigue siendo `L−RV`; para 650 mm es 646,8 mm. Cantidades, tablero de frente y cantos mantienen la selección del mueble.

## Origen de la diferencia

Las variantes SMG heredaban de SM la regla pequeña `A/4−RV−13,4 mm`. El frente grande se obtenía como saldo con tres luces y 53,6 mm de gola. Para A=785 esto daba 179,65 / 179,65 / 362,5 mm. El inferior ya coincidía numéricamente con la nueva mitad útil, pero cada pequeño excedía en 1,6 mm el nuevo objetivo. Cambiar solo el pequeño habría aumentado incorrectamente el grande calculado por saldo. Por eso se sustituyen ambas dependencias por la fórmula confirmada.

## Implementación compartida

- Migración idempotente `0246_frentes_db_2s_gola.sql`: variables `espacio_gola=30/25.4`, `alto_frente_grande=(A−2×espacio_gola)/2`, `alto_frente_pequeno=alto_frente_grande/2−RV` y expresiones de las dos piezas de frente. No altera otras configuraciones DB ni datos de selección del proyecto.
- `src/lib/frentes-gaveta.ts`: la misma normalización en `prepararCotizacion`, incluso con un catálogo precargado que aún tenga expresiones anteriores. El motor, grupos, simulador, cotizaciones, HDR y optimizador reciben las mismas piezas calculadas.
- Visualización: usa los dos espacios de 30 mm cuando existe `espacio_gola`; las familias no incluidas conservan su tratamiento previo. El corte sigue siendo la fuente de las dimensiones dibujadas.
- HDR: estas tipologías seleccionan gola de forma fija, evitando que el buscador inyecte accidentalmente `gola=0` por su estado inicial de manija.

## Aplicación y decisiones

El usuario confirmó incluir SM de madera además de SMG. Se detectó `DB72-2S-SM-FE-SF` de KUNDARA con `gola=0`; autorizó activarla y aplicar la regla nueva. Esa fue la única selección individual de gola modificada.

Se respaldaron las plantillas/reglas en `.tmp/frentes-gaveta-catalogo-respaldo.txt` antes de aplicar la migración. Preflight de 13 módulos en 13 grupos, distribuidos en siete proyectos. Respaldo de cabeceras, áreas, grupos y líneas: `cotizador-frentes-gaveta-1794006617794.json` en el directorio temporal del sistema. Se recalcularon frentes, consumos, precios y totales de esos grupos; comprobación posterior de frentes guardados y conservación de materiales, cantos, exclusiones/referencias de herrajes y globales.

La conciliación de las doce cotizaciones mediante una sola consulta SQL mostró cero diferencias de cabecera frente a líneas multiplicadas por área. Una auditoría previa con varias lecturas había observado un desfase transitorio de Condominio V mientras cambiaban sus datos; no se sobrescribieron selecciones ni importes para corregir esa lectura inconsistente.

## Pruebas

`tests/frentes-dos-pequenos-smg.test.ts`: ejemplos 762/780/785, ocho variantes, cm/mm/pulgadas, cantidades/ancho/canto sin cambios, suma completa de alturas, inmutabilidad del catálogo, montaje de los frentes y preparador real con catálogo antiguo. Las pruebas históricas de otras familias permanecen intactas.

Verificación final: Chrome local con SM, SMG y SMG-FE a 780 mm, y SMG a 785 mm; filas mostradas 176,8/176,8/360 y 178,1/178,1/362,5 respectivamente, ancho 646,8 y espesor 18 conservados. Browser plugin no disponible: Playwright. Cero errores de consola/ejecución. Dos cargas y exportaciones independientes a 785 mm produjeron páginas PDF renderizadas idénticas, revisadas con PDFium.

`quality:gate`: exit 0, 119 archivos / 726 pruebas, cero fallidas y sin incrementar deuda; `quality:learn -- --strict`: cero HIGH. Consulta SQL final: 13 módulos, cero golas desactivadas y cero medidas de frente pendientes. La migración está aplicada en Supabase; la verificación de interfaz corresponde al servidor local.

Relacionados: [familia SMG](db_smg.md), [gola de madera y variantes](tipologias_prueba_gola_madera.md), [edición individual y HDR](reglas_fabricacion_y_edicion_individual.md).
