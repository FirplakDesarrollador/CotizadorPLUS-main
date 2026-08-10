# Variantes de frente Gola (`SM`)

## Fuentes y método

Se investigó `Simulación muebles CEMA (1).xlsx` cruzando:

- códigos, observaciones y costos de `Costos Muebles`;
- cantidades y áreas de piezas en `madera`;
- cantidades de perfil y fijaciones en `canto y otros `;
- precios de perfiles en `costos unitarios`;
- convenciones comerciales en `Plantilla códigos`.

Como contraste comercial se revisaron:

- `25083 - Related Urban Construction - Flagler Villas - Cambios de marzo 3 Cotización.xlsx`;
- `26052 - Thomas - Penthouse LA top Kitchen 2 - Cotización.xlsx`.

La búsqueda no trató `SM` como un tipo de mueble. Se compararon referencias con
el mismo prefijo, largo, alto y profundidad, eliminando únicamente el sufijo de
la variante para localizar el mueble base equivalente.

## Hallazgo principal

`SM` es una variación transversal del sistema de apertura de los frentes. No
debe convertirse en tipos duplicados como `BFD_SM`, `DB_SM` o `PCFD_SM`.

Sin embargo, el archivo fuente usa tres convenciones parcialmente
contradictorias:

| Señal | Significado observado |
| --- | --- |
| `-SM` | `Plantilla códigos` lo describe como gola fabricada en la misma melamina; elimina manijas y en varias familias modifica refuerzos. |
| `-SMG` | En `Costos Muebles` identifica normalmente gola metálica con perfiles de aluminio y sistema de fijación. |
| `-GOAL` | `Plantilla códigos` usa este sufijo para la oferta comercial de gola de aluminio. |

El maestro contiene 1.026 referencias con el token exacto `SM` distribuidas en
40 prefijos y 209 referencias `SMG` en 27 prefijos. Por esta inconsistencia, el
motor no debe inferir la ingeniería únicamente a partir del texto del SKU.

El código solicitado para las nuevas cotizaciones puede ser `SM`, pero
internamente debe guardarse una clave semántica independiente, por ejemplo
`gola_metalica`, y tratar `SMG`/`GOAL` como alias históricos al importar.

## Evidencia de refuerzos en `SM`

Se encontraron 478 pares exactos `SM`/mueble base con iguales dimensiones:

- 189 pares cambian al menos una cantidad de refuerzo.
- 222 cambian alguna pieza estructural.
- 256 solo eliminan manijas o no presentan otra diferencia de cantidad.

Por tanto, el refuerzo adicional es frecuente, pero no universal. La regla
depende de la familia:

| Familia | Patrón dominante observado |
| --- | --- |
| `BFD`, `SBFD`, `SVFD` | Agregan un refuerzo horizontal o cambian el refuerzo delantero de 3.25 a 5 in; algunas referencias solo eliminan manijas. |
| `B` | Agrega dos piezas de refuerzo vertical delantero. El área total observada equivale a `(L - 1.18) × 5`. |
| `DB`, `DV` | Duplica normalmente los refuerzos horizontales asociados a las gavetas. En `DB12-3`, pasa de 3 a 6. |
| `PC`, `PCFD` | Varias referencias agregan dos refuerzos traseros; existen excepciones y diferencias antiguas en número de puertas. |
| `W`, `VFD` | La mayoría conserva el despiece y solamente elimina manijas. |

Ejemplos canónicos:

| Base | Variante | Cambio estructural |
| --- | --- | --- |
| `BFD24` fila 451 | `BFD24-SM` fila 176 | un refuerzo horizontal adicional y cero manijas |
| `B12` fila 1172 | `B12-SM` fila 1207 | dos refuerzos verticales delanteros y cero manijas |
| `DB12-3` fila 1700 | `DB12-3-SM` fila 1796 | refuerzos horizontales de 3 a 6 y cero manijas |
| `PCFD1296 TK5` fila 5314 | `PCFD1296 TK5-SM` fila 5504 | refuerzos traseros de 3 a 5 y cero manijas |

Los valores históricos de costo también prueban que `SM` no equivale a
“quitar manijas”: el costo de madera/canto aumenta por el refuerzo, mientras el
costo de herraje baja. Por ejemplo, `B12-SM` aumenta COP 3.447,73 en costo sin
herrajes y elimina COP 14.900 de dos manijas frente a `B12`.

## Evidencia de gola metálica

Las columnas `DG:DI` de `canto y otros ` y `AU:AW` de `Costos Muebles`
registran:

- perfil Gola L;
- perfil Gola C;
- sistema de fijación metálico.

De las 209 referencias `SMG`, 205 tienen consumo explícito de perfil o
fijaciones. Las cuatro restantes son inconsistencias puntuales del maestro.
También existen referencias `SM` antiguas con perfil cargado, por lo que el
sufijo no es una fuente totalmente confiable.

Para cada recorrido de perfil, el Excel aplica:

```text
cantidad_tramo_3m = (L × 2.54 × 1.20) / 300
```

Es la longitud del mueble convertida a centímetros, con 20 % de desperdicio,
dividida por una barra de 300 cm. Los costos unitarios guardados en las filas
72–74 son COP 33.952 por perfil L de 3 m, COP 42.024 por perfil C de 3 m y
COP 2.634 por fijación metálica.

La combinación depende de la familia:

- `BFD` suele usar un recorrido L y dos fijaciones.
- `DB` con gavetas suele usar recorridos L y C y cuatro fijaciones.
- torres `PC` observadas pueden usar únicamente recorrido C.
- casos con dos recorridos del mismo perfil duplican longitud y fijaciones.

No es correcto añadir siempre un perfil L, un perfil C y cuatro fijaciones.

## Evidencia comercial

La cotización 25083 especifica en `Summary!A129:C129`:

```text
Gola | Melamine | Opening system for fronts and doors with gola in the same melamine material.
```

La cotización 26052 registra `Gola | NA`. Esto confirma que la gola es una
especificación comercial del proyecto o cocina, no una tipología de carcasa.
Debe existir como valor predeterminado del proyecto con posibilidad de
sobrescribirlo por mueble.

## Modelo recomendado

### Separar dos ejes

El campo actual `modoFrentes` responde qué se entrega:

- mueble completo;
- sin frentes;
- solo kit de frentes.

No debe reutilizarse para describir cómo se abre el frente. Se recomienda un
segundo campo, mostrado dentro de la misma sección visual **Frentes**:

```text
sistemaFrente = manija | gola_sm | gola_metalica | push
```

Si comercialmente la gola metálica debe identificarse como `SM`, la línea
puede generar el sufijo `-SM`, pero la configuración persistida debe conservar
`sistemaFrente = gola_metalica`. Así se evita confundirla con los códigos
históricos de gola en melamina.

### Configuración por proyecto y por línea

- Añadir `sistemaFrente` a los valores predeterminados del proyecto.
- Copiarlo al crear líneas y permitir override por mueble.
- Guardarlo dentro de `cot_cotizacion_lineas.config`.
- Mantener `modoFrentes` independiente.

### Modificadores por familia

No se recomienda una fórmula global `+1 refuerzo`. La opción debe aplicar
modificadores data-driven por tipo de mueble:

- piezas adicionales o reemplazadas;
- cambio de cantidad o ancho de refuerzos;
- exclusión de manijas;
- perfiles L/C y fijaciones cuando corresponda;
- regla de sufijo comercial.

La solución más mantenible es un catálogo de variantes de frente y tablas de
modificadores por `tipo_mueble_id`. El motor superpone esos modificadores sobre
la plantilla base sin duplicar el tipo de mueble. Alternativamente, una primera
fase puede añadir la variable numérica `frente_sm` a las fórmulas de cada
plantilla verificada, pero no debe activarse en familias sin evidencia.

### Compatibilidad con agrupaciones

Los módulos de un mismo grupo deben usar sistemas de frente compatibles. Los
refuerzos continuos SM deben participar en la misma lógica de fusión existente.
Para gola metálica, la primera versión puede reproducir el costo CEMA por
módulo; una optimización posterior puede comprar barras por longitud total del
grupo para reducir desperdicio real.

## Fases propuestas

1. Crear el catálogo `sistemaFrente` y persistencia proyecto/línea.
2. Implementar `SM` en familias con pares verificados: `B`, `BFD`, `SBFD`,
   `SVFD`, `DB`, `DV`, `PC` y `PCFD`.
3. Validar cada familia contra un par base/SM del Excel; bloquear temporalmente
   la opción en familias sin regla confirmada.
4. Incorporar perfiles L/C y fijaciones como modificadores de herraje para la
   variante metálica.
5. Añadir pruebas de regresión para cantidades de refuerzo, ausencia de
   manijas, sufijo comercial y costo.

## Conclusión

La mejor representación es una variante de frente con reglas por familia,
predeterminada a nivel de proyecto y editable por mueble. No debe ser un tipo
de mueble nuevo ni una simple exclusión de manijas. La separación entre la
clave interna semántica y el sufijo comercial `SM` es necesaria para conservar
la intención del usuario sin heredar las ambigüedades `SM`/`SMG`/`GOAL` del
Excel.
