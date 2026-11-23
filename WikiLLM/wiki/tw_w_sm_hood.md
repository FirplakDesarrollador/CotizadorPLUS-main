# TW-SM-HOOD y W-SM-HOOD

Implementadas mediante `0231_tw_w_sm_hood.sql`, aplicada a Supabase.
`0232_hood_frente_falso_extension.sql` añade el tramo superior del frente falso.
Fuente: `TW-SM-HOOD.iges` en la raíz y tabla de corte del usuario. TW lleva una
puerta superior y W dos. Comparten estructura, materiales y montaje; cambia
la cantidad de puertas, su ancho y sus bisagras.

## Medidas confirmadas

- Carcasa = Alto − HOOD. HOOD es la medida total bajo la carcasa.
- FREE es la «parte visible del extractor». El tramo bajo carcasa es HOOD−FREE.
- Alto total del frente falso = HOOD−FREE + 145,95 mm. Las puertas comienzan
  a z=175,95 mm; el borde superior del falso queda a z=145,95 mm, 30 mm debajo.
- Ejemplo en cm: Alto 70, HOOD 35, FREE 10 → carcasa 35 y frente falso 39,595.
  Son 25 cm bajo carcasa más 14,595 cm que cubren el tramo interno pendiente.
- El borde inferior conserva z=−(HOOD−FREE); FREE sigue descubierto debajo.
- HOOD y FREE son obligatorios: 0 ≤ FREE ≤ HOOD < Alto. Si FREE=HOOD, el
  frente falso conserva el tramo superior de 145,95 mm, con cantidad uno.
- La carcasa debe admitir el entrepaño fijo a 200,85 mm y la tapa; el servidor
  rechaza altura insuficiente y fija una/dos puertas aunque llegue un override.

El servidor convierte las dimensiones a pulgadas y descuenta HOOD una vez
al preparar. `calc.dims.A` contiene la altura física de carcasa y alimenta
plantillas, costos y visualización. La línea mantiene Alto original y ambos
valores en `config.overrides.HOOD/FREE` en pulgadas, sin volver a descontar
al editar o recalcular. W-MO-HOOD conserva su semántica previa y no usa FREE.

## Despiece y montaje

El IGES tiene once sólidos. Referencia: ancho 650 mm, profundidad 350 mm,
carcasa 550 mm, caja 15 mm y frente 18 mm.

| Pieza | Cantidad TW/W | Referencia (mm) |
|---|---:|---|
| Base / tapa | 1 cada una | 620 × 350 |
| Laterales | 2 | 550 × 350 |
| Refuerzos traseros | 2 | 620 × 80 |
| Gola de madera | 1 | 620 × 80 |
| Entrepaño fijo | 1 | 620 × 327 |
| Puerta superior | 1 / 2 | 646,8 / 321,8 de ancho × 370,85 de alto |
| Frente falso | 1 | 646,8 de ancho × (HOOD−FREE+145,95 mm) |
| Fondo | 1 | 534 × 634, según tabla elegida por el usuario |

El fondo del IGES era 536 × 636; se aplican las holguras de 16 mm de la tabla.
Se conservan del IGES el entrepaño a z=200,85 mm, la gola de 80 mm debajo,
la puerta desde z=175,95 mm y el remate superior con luz de 3,2 mm.
Los cantos efectivos respetan Características del proyecto; las bisagras
se heredan de W-SM y se cuentan solo por puerta superior.

Usan las reglas existentes de agrupación de superiores con alturas físicas,
laterales compartidos y piezas continuas/locales. El frente falso inferior
no se interpreta como un frente ciego lateral al distribuir las puertas.
Los códigos incluyen alto nominal y profundidad, además de SM15/SM18 cuando
caja y frente comparten espesor.

## Interfaz y verificaciones

HOOD/FREE aparecen junto a las dimensiones en Simulador y alta/edición de
cotizaciones, con aclaraciones. Se convierten al cambiar unidad en Simulador.
`simuladorStore` versión 9 conserva FREE por módulo, historial y almacenamiento;
los estados anteriores migran con FREE vacío.

- `tests/hood-sm.test.ts`: ejemplo, tabla, versiones, montaje, agrupación e historial.
- `tests/fixtures/hood-sm.json`: nueve plantillas por familia del catálogo desplegado.
- `db/tests/hood_sm.ts`: auditoría de solo lectura del catálogo/motor real,
  cm/mm/in, validaciones y cantidad de puertas.

Relacionados: [W-MO-HOOD](w_mo_hood.md), [agrupación](plan_agrupacion_modulos.md),
[códigos comerciales](codificacion_comercial_modulos.md).

## Verificación final

Prueba en Chrome mediante Playwright (plugin Browser no disponible): creados
ambos tipos en una cotización temporal, rechazado FREE>HOOD, guardado 70/35/10,
editado FREE a 12 y de vuelta a 10, recargado y verificado el despiece persistido.
El Simulador conserva HOOD/FREE al cambiar cm→mm→in→cm y recargar, sin residuos
visibles por redondear a pulgadas. FREE también se comprobó en móvil 390×844.
La envolvente dibujada incluye el espacio libre FREE: muestra 700 mm nominales
para el ejemplo, con carcasa de 350 mm y frente falso de 395,95 mm.

Se generaron dos PDF independientes con cuatro páginas cada uno, texto idéntico
y ambas tipologías en programación; se revisaron las ocho páginas renderizadas.
El formato del PDF permanece intacto. La cotización temporal fue eliminada;
la auditoría de propuestas terminó sin errores ni diferencias de materiales.
`quality:plan`, `quality:impact` y `quality:gate`: 90 suites, exit 0.
La prueba real de preparación se mantiene en `db/tests/hood_sm.ts` como cobertura
específica de cotizar, además de los tests unitarios de reglas y geometría.

## Corrección de extensión superior (2026-10-30)

La migración 0232 está aplicada. En ambas versiones se verificó el borde
superior a 145,95 mm y una separación de 30 mm con cada puerta; el borde
inferior sigue en −(HOOD−FREE). El ejemplo 70/35/10 produce un alto de corte
395,95 mm. Con Alto=705 mm, HOOD=155 mm y FREE=0 se recuperan exactamente
los 300,95 mm del frente falso original del IGES.

Se comprobó aumento de área de frente, canto y precio respecto al panel corto,
y conservación de FREE al editar. Prueba real de simulador, creación y edición
de ambos tipos, unidades y móvil; dos PDF de cuatro páginas con texto idéntico
revisados visualmente. Fixture temporal eliminado. No existían módulos HOOD
persistidos antes de la prueba. Calidad: 91 suites aprobadas y cero HIGH.
Interfaz: la línea explicativa de fórmulas fue retirada del Simulador y formulario de cotización por solicitud del usuario. Se mantienen las aclaraciones breves de HOOD y FREE.
La aclaración de FREE se presenta como «Parte visible del extractor», con mayúscula inicial, en ambos formularios.

## Tarugos de armado (2026-10-30)

La migración `0234_hood_46_tarugos.sql` fija 46 tarugos para el mueble completo,
igual en TW y W. Se cuentan por pieza, no mediante un total artificial:

| Pieza | Tarugos |
|---|---:|
| Base | 8 |
| Tapa | 8 |
| Dos refuerzos traseros | 4 cada uno = 8 |
| Gola | 4 |
| Entrepaño fijo | 8, sin soportes móviles |
| Frente falso fijado a laterales/base | 10 |
| Total completo individual | 46 |

Las puertas superiores y el fondo no agregan tarugos. El costo usa el precio
vigente del selector `tarugo` del catálogo. Se mantienen las reglas existentes
cuando se omiten piezas: sin frentes son 36, solo frentes 10; dos carcazas
agrupadas iguales consumen 78 por sus uniones estructurales compartidas.
`tests/hood-sm.test.ts` y `db/tests/hood_sm.ts` verifican cantidades, costo y
agrupación. Al aplicar no existían líneas persistidas de estas tipologías.
Verificación de tarugos: 46 visibles en Simulador y persistidos en ambos módulos de prueba; edición y recarga correctas, dos PDF de cuatro páginas idénticos revisados, auditoría sin diferencias y fixture eliminado. Quality: 91 suites aprobadas, sin HIGH.
