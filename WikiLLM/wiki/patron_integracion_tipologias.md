# Patron para integrar nuevas tipologias

Esta pagina fija la forma estandar de integrar nuevas tipologias de mueble. La frase del usuario **"incluir nueva tipologia"** debe activar este protocolo completo: analizar la referencia adjunta, deducir la estructura propia del mueble, crear la tipologia en datos/migracion, cargarla/aplicarla en Supabase, dejarla disponible en Simulador, Cotizaciones y HDR, validarla y documentarla.

La referencia canonica es la integracion `B-FE` del 2026-09-11, seguida por `UB-FE` y `V-FE`, pero solo como **metodo de trabajo**. No significa copiar la estructura de piezas de `B-FE` a cualquier tipologia nueva.

## Regla principal

Una tipologia nueva se crea como tipo independiente y no como mutacion silenciosa del tipo base. Ejemplo: `B-FE` se creo aparte de `B`; despues `UB-FE` y `V-FE` se crearon aparte de `UB` y `V`. Los tipos originales deben quedar intactos, salvo correcciones transversales confirmadas y documentadas en migraciones separadas.

La estructura de piezas, reglas y herrajes siempre sale del mueble/referencia que el usuario adjunte. `B-FE` no es molde de piezas; es el ejemplo de rigor: partir de evidencia real, no inferir de memoria, validar y documentar.

## Flujo obligatorio

1. Tomar la hoja de ruta real o referencia del usuario como fuente primaria. Deducir piezas, cantidades, formulas, cantos, espesores, tarugos, soportes y herrajes desde esa referencia, no desde supuestos.
2. Crear una migracion SQL re-ejecutable: `insert/upsert` del tipo, limpieza previa de piezas/reglas/herrajes de ese tipo y reinsercion completa. Evitar depender de orden o IDs manuales.
3. Aplicar/cargar la migracion en la base de datos de Supabase que corresponda al entorno de trabajo, o dejar explicitamente documentado el bloqueo si no hay acceso. Tras aplicar, leer desde Supabase para confirmar que `cot_tipos_mueble`, `cot_piezas_plantilla`, `cot_reglas_config`, `cot_herrajes_plantilla` y cualquier tabla relacionada quedaron con el estado esperado.
4. Deducir la estructura especifica del mueble adjunto. Solo reutilizar piezas, reglas o herrajes de una familia existente cuando la referencia lo confirme. En `B-FE`, la caja de gaveta en madera y el `RIELFE500` mandaron sobre la plantilla `B`; en `UB-FE`, solo se heredo de `UB` la variante `removible`; en `V-FE`, solo la categoria `vanity`.
5. Dejar `permite_agrupacion=false` y piezas `modo_agrupacion='local'` si no hay hoja de ruta agrupada que valide laterales compartidos, fondos continuos o cambios de ejes.
6. Registrar reglas explicitas de variables nuevas o criticas. Para FE, `alto_frente_gaveta` quedo como regla por tipo: 6" en `B-FE`/`V-FE`, 5.5" en `UB-FE`.
7. Validar geometricamente contra la referencia en milimetros usando datos reales leidos desde Supabase tras la carga. El objetivo es reproducir pieza, cantidad, largo, ancho, espesor y cantos con diferencia despreciable; `B-FE` cerro con 0.00mm en sus medidas.
8. Revisar herrajes y precio. Si existe Excel CEMA vigente, cruzar contra el maestro de costos. En `B-FE`, ese cruce detecto que `RIELFE500` debia actualizarse de `$27.105` a `$31.064` mediante una migracion separada.
9. Actualizar UI y utilidades afectadas: nombres de piezas en HDR, inferencia de canto/color, flags como `PREFS_CON_REMOVIBLE`, parser de codigos, tests de `codigoModulo()` si el prefijo incluye sufijo.
10. Respetar la convencion comercial del codigo: la medida va inmediatamente despues de la base y antes del sufijo. Ejemplo: `B-FE` + 12" = `B12-FE`, no `B-FE12`.
11. Agregar tests o scripts de validacion que cubran al menos el ejemplo real y no-regresiones del tipo base. Antes de cerrar, correr tests relevantes, typecheck y lint cuando sea viable.
12. Documentar el resultado en WikiLLM: pagina relevante, `index.md` si nace una pagina nueva y `log.md` con migracion, validacion, decisiones y pendientes.

## Superficies que deben quedar habilitadas

Cuando se implemente una tipologia nueva, no basta con sembrar la plantilla en base de datos. Debe quedar usable end-to-end:

- **Simulador/Diseño:** debe aparecer como tipo seleccionable, calcular piezas/costos correctamente y mostrar el despiece sin filas irrelevantes de cantidad cero.
- **Cotizaciones:** debe poder agregarse y editarse como linea de cotizacion, persistiendo cualquier configuracion propia en `config` y recalculando `codigo_modulo` con la convencion comercial correcta.
- **HDR:** el buscador debe interpretar el codigo comercial de la nueva tipologia, generar la tabla en mm, mostrar nombres de produccion adecuados y aplicar la inferencia correcta de canto/color/espesor.
- **Motor y datos:** reglas, piezas, herrajes, consumibles, presets, agrupacion/modificadores y codigos deben estar alineados para que Simulador, Cotizaciones y HDR vean la misma verdad.
- **Supabase:** la tipologia debe quedar cargada en la base real del entorno correspondiente, no solo escrita como SQL local. Despues de aplicar, verificar por consulta que el tipo, piezas, reglas y herrajes activos coinciden con la migracion.
- **Validacion:** probar al menos la referencia adjunta contra el motor real, y cuando haya Excel CEMA vigente, cruzar precio/herrajes/materiales para distinguir errores de plantilla de diferencias de preset.

## Criterios de no inferencia

- No activar agrupacion por analogia.
- No cambiar el tipo base para "parecerse" a la nueva tipologia.
- No reemplazar la estructura de una nueva tipologia con la estructura de `B-FE`; cada mueble adjunto se analiza y se modela por sus propias piezas, medidas, reglas y herrajes.
- No inventar herrajes faltantes si la referencia no los trae o si requieren criterio de producto.
- No resolver diferencias hoja de ruta vs Excel sin preguntar cuando cambian material, espesor, costo o estructura. En `B-FE`, el usuario resolvio a favor de la hoja para laterales/fondo de gaveta y a favor del Excel para precio del riel FE.
- No asumir que un sufijo es modificador transversal. Primero clasificar: puede ser tipologia nueva (`-FE`) o configuracion/modificador (`SM`, removible, sin frentes).
- No cerrar la tarea si la tipologia solo existe en migracion pero no se puede usar en Simulador, Cotizaciones y HDR.
- No cerrar la tarea si la tipologia no fue cargada/verificada en Supabase, salvo que el acceso a Supabase este bloqueado y quede reportado como pendiente concreto.

## Referencias internas

- `db/migrations/0037_tipo_b_fe.sql`: implementacion canonica de `B-FE`.
- `db/migrations/0038_tipos_ub_fe_v_fe.sql`: extension a referencias hermanas.
- `db/migrations/0040_precio_riel_fe.sql`: conciliacion de precio del riel full extension.
- `db/migrations/0041_codigo_modulo_medida_antes_del_sufijo.sql`: convencion de codigo comercial.
- [Validacion contra hojas de ruta](validacion_hojas_de_ruta.md): trazabilidad de la integracion FE y decisiones de validacion.
- [Esquema de Base de Datos](esquema_base_datos.md): convencion `codigo_modulo` para prefijos con sufijo.
