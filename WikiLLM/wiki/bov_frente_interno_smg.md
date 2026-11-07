# BOV interno y variante BOV-SMG

## Regla confirmada el 2026-11-07

El usuario confirmó **sin holguras adicionales**. El frente se ubica entre los laterales y sobre la base, con su cara exterior alineada al frente del cuerpo. BOV-SMG es copia del BOV corregido y solo cambia el alto del frente para dejar **73 mm superiores exactos**.

Con `L/A/P` exteriores, `TC` espesor real de caja, `TR` espesor real del refuerzo y fórmulas del motor en pulgadas:

| Pieza/eje | BOV y BOV-SF | BOV-SMG |
| --- | --- | --- |
| Ancho del frente | `L-2*TC` | igual |
| Alto del frente | `A-TC` | `A-TC-73/25.4` |
| Largo de base | `L-2*TC` | igual |
| Profundidad de base | `P-TR` | igual |

No se resta RV a esos cortes. HDR muestra alto del frente en Largo, y su ancho en Ancho, como el resto de frentes. Para 800 × 785 × 610 mm con caja/refuerzo de 15 mm: BOV tiene frente 770 × 770 mm; BOV-SMG, 697 × 770 mm; ambos tienen base 770 × 595 mm.

Montaje: frente `x=TC, y=0, z=TC`, sin invadir laterales ni base. El refuerzo delantero conserva su corte de 80 mm y se coloca detrás, `y=TF`, para evitar interpenetración. Ambos tipos usan el mismo montaje; BOV-SMG deja 73 mm entre el frente y el borde superior del mueble. Los siete paneles, cantos, agrupación de carcasa y herrajes se conservan.

`ajustarGeometriaBov` en `src/lib/reglas-fabricacion.ts` se aplica en `prepararCotizacion`, después de las normalizaciones históricas y de fondo. La base no cambia a `P-TC` al desactivar el espaldar. `geoVars` expone TR desde el material de refuerzo, con fallback a caja si no se selecciona refuerzo. No se confunde el refuerzo con el fondo.

## Catálogo y persistencia

La migración idempotente `0250_bov_frente_interno_smg.sql` actualiza BOV/BOV-SF y crea BOV-SMG copiando tipo, cinco renglones de plantilla, reglas y herrajes. Conserva `permite_agrupacion`, cartón, etiquetas y márgenes. Comparación SQL de plantillas sin IDs/fechas y sin el alto del frente: cero diferencias. No agrega piezas de gola ni herrajes nuevos. BOV-SMG hereda cuatro patas PATA10AJUST y dieciséis tornillos TORNILLO858 cuando estén incluidos, respetando activación/exclusiones individuales.

TR tiene regla de compatibilidad `typeof TR === typeof TC ? TR : TC`: usa el refuerzo real en el motor actual y evita fórmulas indefinidas en versiones anteriores. Todos los BOV actuales tienen TC=TR; se verificó por catálogo. Las pruebas incluyen caja/refuerzo de espesores distintos (15/18 mm) para comprobar que el motor actual descuente el refuerzo correcto.

La descripción de BOV cuenta el único frente real y omite entrepaños globales inexistentes; una variable global de dos puertas no hace anunciar dos frentes. El caché del simulador es v14: conserva entradas y descarta resultados de la geometría anterior. Los códigos y selectores incluyen BOV-SMG en simulador, cotizaciones, HDR y exportaciones.

## Aplicación a Condominio V y verificación

- Migración aplicada y registrada en Supabase. Se sustituyeron únicamente los cuatro registros BOV de Condominio V, equivalentes a 24 unidades por repetición de áreas. No quedan BOV originales en esa cotización.
- Respaldo previo al cambio de catálogo: `cotizador-fabricacion-1794053239677.json`; previo a conversión: `cotizador-fabricacion-1794053287527.json`, ambos en el temporal del sistema. Recálculo con las funciones reales, primero en memoria y después en transacción con control de concurrencia. Los BOV de otros proyectos reciben su nueva geometría BOV, sin convertirse en SMG.
- Comparación estricta de 1.054 líneas y doce cotizaciones: se conservan dimensiones exteriores, cantidades, notas, grupos, materiales, selecciones globales/individuales y herrajes; 217 adicionales intactos. Se restituyó el orden original de dos listas BMW reordenadas incidentalmente por la primera pasada general, verificando igualdad de valores y timestamp de esa misma transacción. Las auditorías posteriores se acotaron a los 18 grupos BOV y resultaron sin escrituras pendientes.
- Repetición de la migración dentro de una transacción revertida: cero cambios en tipos, piezas, reglas o herrajes. Auditoría de propuestas sin diferencias de materiales, referencias, agrupación o conciliación de importes.
- Pruebas en `tests/bov-smg.test.ts`: espesores 15/18, geometría sin holguras, 73 mm exactos, base con/sin fondo, coordenadas internas, refuerzo sin interpenetrar, siete piezas, agrupación y códigos en pulgadas/cm/mm. Los tests de la hoja BOV24 original permanecen intactos como fixture histórico; el preparador actual aplica la regla nueva.
- Chrome autenticado local mediante Playwright existente (Browser plugin no disponible): BOV y BOV-SMG en HDR/Excel, selector de simulador, cuatro líneas y editor de Condominio V. Dos cargas/guardados/impresiones independientes de Condominio V: diez páginas por PDF, texto idéntico y código BOV-SMG presente sin el BOV anterior. Se revisan páginas renderizadas; no implica despliegue remoto ni impresión física.

Evidencias locales: `.tmp/bov-smg-browser.json`, `.tmp/bov-smg-integridad.json`, `.tmp/bov-smg-postflight.txt`, `.tmp/bov-smg-auditoria.txt`, `.tmp/bov-smg-medidas-guardadas.txt` y `.tmp/bov-condominio-1.pdf` / `-2.pdf`.

Cierre: la consolidación de los cuatro registros produce una HDR de 24 unidades (`.tmp/bov-smg-consolidacion.json`). HDR anuncia una puerta, incluso si la variable global devuelve dos; Excel conserva 697 × 770 mm. `quality:gate` aprobó 125 archivos y 758 pruebas, exit 0; `quality:learn -- --strict` no dejó HIGH. La cobertura de motor está en pruebas de dominio (incluida `bov-smg.test.ts`), aunque el detector sugiera `engine.test.ts`; los demás avisos son latencias del optimizador. No se modificaron baseline ni WikiLLM/raw. Datos aplicados en Supabase; código local en LIz, sin commit ni publicación en esta tarea.

Relacionados: [BOV24 histórico](bov24_hoja_real.md), [herrajes BOV](preferencias_herrajes_bov.md), [HDR/Excel](hdr_excel_consolidado.md), [protocolo PDF](protocolo_pdf_cotizaciones.md).
