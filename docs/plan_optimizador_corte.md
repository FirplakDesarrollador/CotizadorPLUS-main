# Plan de desarrollo — Optimizador de corte del Cotizador PLUS

Objetivo: a partir de una cotización (módulos y cantidades), generar automáticamente el **plan de corte**
del proyecto: cuántas láminas de cada material, cómo acomodar las piezas en cada lámina, la **secuencia y
el número de cortes** de guillotina, los sobrantes reutilizables y las etiquetas. Las medidas tienen que
ser ejecutables en la sierra de la planta.

## 1. Qué ya existe y se reutiliza

| Necesidad del optimizador | Dónde está hoy |
|---|---|
| Despiece de cada módulo (pieza, cantidad, largo, ancho en mm) | `calcularMueble` en `src/lib/engine.ts`, validado contra las hojas de ruta |
| Módulos y cantidades del proyecto | `cot_cotizacion_lineas` (incluye agrupación física) |
| Tablero de cada pieza (rol → código) | preset del proyecto + `cot_tableros` |
| Formato de lámina por proveedor | `cot_tableros.formato` (hoy: 183X244, 122X244, 124X246, 280X207; hay mayúsculas y minúsculas mezcladas) |
| Espesor y enchape de cada pieza | `cot_tableros.espesor_mm` y `cantos` de la plantilla |
| Letra de producción por pieza | lógica del HDR (`src/app/hdr/HdrTabla.tsx`) |

## 2. Arquitectura propuesta

```
Cotización ──► Lista de corte ──► Optimizador ──► Plan de corte ──► Vistas / PDF / CSV / costo
 (líneas)       (piezas por         (por material,     (láminas, cortes,
                material, con       búsqueda           sobrantes, métricas)
                letra y restricción) iterativa)
```

- **`src/lib/corte/lista.ts`**: convierte la cotización en piezas individuales con material, medida de
  corte (aplicando, si corresponde, el descuento del canto), si se pueden rotar, y su origen
  (módulo, línea, letra).
- **`src/lib/corte/guillotina.ts`**: optimizador puro, sin Next ni Supabase (como el motor), probado con
  tests. Recibe piezas, lámina y parámetros; devuelve el plan.
- **`src/lib/corte/secuencia.ts`**: convierte el acomodo en la secuencia ordenada de cortes (nivel 1
  longitudinal, nivel 2 transversal, nivel 3 recorte…) y los cuenta.
- **Tabla `cot_parametros_corte`** (o llaves en `cot_parametros`): espesor de sierra, refilado, niveles,
  altura de pila, mínimo de sobrante, criterio. Editables desde Admin.
- **Pantalla** `cotizaciones/[id]/corte`: resumen por material, dibujo SVG de cada lámina, secuencia de
  cortes, sobrantes; exportar PDF y CSV/XML para la sierra.

## 3. Algoritmo

1. Agrupar las piezas por material (código de tablero + espesor), porque cada material se corta en su
   propia lámina y formato.
2. Generar soluciones iniciales con varias heurísticas de guillotina por franjas (ordenar por largo,
   por ancho, por área; con y sin giro donde la veta lo permite; agrupar medidas iguales para reducir
   cortes).
3. Mejorar con búsqueda local durante un tiempo fijo (por ejemplo, 5–10 s): vaciar la lámina con peor
   aprovechamiento y redistribuir, intercambiar piezas entre franjas, fusionar franjas de igual ancho.
4. Elegir la mejor según el criterio configurado, en orden lexicográfico. Ejemplo:
   **(1) menos láminas → (2) menos cortes → (3) sobrante reutilizable más grande**.
5. Reportar contra el **mínimo teórico** (área de piezas + espesor de sierra ÷ área útil de la lámina),
   para saber qué tan cerca del ideal quedó cada material.

El resultado no es "el óptimo matemático garantizado" (es computacionalmente inviable), sino un plan
que suele quedar a 1–3 % del óptimo, igual que los optimizadores comerciales.

## 4. Fases

| Fase | Entregable | Criterio de aceptación |
|---|---|---|
| **0. Datos y reglas** | Formulario de condiciones completo (sección 5); formatos normalizados en `cot_tableros` | Todas las condiciones confirmadas por producción |
| **1. Lista de corte** | Lista de corte de una cotización real, exportable a Excel | Coincide pieza por pieza con las hojas de ruta de esos módulos |
| **2. Motor de optimización** | `guillotina.ts` + `secuencia.ts` con tests | Ninguna pieza se superpone ni sale de la lámina; espesor de sierra, refilado y veta respetados; mismo resultado con la misma entrada |
| **3. Validación con planta** | Corrida sobre 3–5 proyectos reales ya cortados | Láminas y cortes iguales o mejores que el método actual; el operario confirma que la secuencia es ejecutable |
| **4. Integración en la app** | Pantalla de plan de corte, PDF de láminas, etiquetas por pieza, CSV/XML para la sierra | Uso de punta a punta desde una cotización sin pasos manuales |
| **5. Costo real (opcional)** | Merma calculada desde el plan, en lugar del 15 % fijo, por proyecto | Precio del proyecto con láminas reales, conciliado con compras |
| **6. Sobrantes (opcional)** | Inventario de sobrantes que el optimizador usa antes de abrir lámina nueva | Sobrantes registrados y consumidos en proyectos siguientes |

Todo cambio pasa por el sistema de calidad del repo (`npm run quality:plan` y `npm run quality:gate`
en verde) y se documenta en la wiki.

## 4.1 Condiciones confirmadas por producción (2026-10-07)

| Parámetro | Valor | Uso en el optimizador |
|---|---|---|
| Máquina | Sierra seccionadora Holz-Her (guillotina) | Acomodo por cortes de lado a lado |
| Espesor del disco | 4,4 mm | Se descuenta entre cada pieza y franja |
| Altura de pila | 4 láminas en 15 mm; 3 láminas en 18 mm | Las láminas con el **mismo patrón** se cortan juntas; el número de cortes se cuenta por pila |
| Giro de la lámina | Sí | Se permiten cortes en las dos direcciones |
| Refilado | 5 mm por lado (máximo 9 mm) | Solo en los bordes que delimitan zona usada; la zona que queda sin usar no se refila |
| Sobrante reutilizable | Mínimo 1000 × 500 mm | Por debajo de eso es desperdicio |
| Formatos de lámina | 2440 × 1830 mm y 2460 × 1240 mm | Catálogo: `183X244` y `124X246` |
| Veta | Textura *soft*: se puede rotar. *Rustick* y *Amazonas*: (por confirmar) no se rota | Hoy el catálogo no tiene campo de textura |
| Criterio | Desperdicio ≤ 15 % por material; pocos sobrantes; si hay sobrante, que quede en la **última lámina** de cada material | Objetivo lexicográfico: cumplir 15 % → menos láminas → concentrar el libre en la última lámina en un solo sobrante ≥ 1000 × 500 → menos cortes |

Pendientes de confirmar: niveles de corte de guillotina de la Holz-Her; textura de cada tablero
(rustick/amazonas sin rotar); si "15 % por corte" es por material del proyecto; si el sobrante
≥ 1000 × 500 cuenta o no como desperdicio; si la medida de la hoja de ruta es la de corte (canto);
medida mínima de pieza.

## 5. Información que necesito (formulario)

### A. Proyecto de prueba
- Lista de módulos y cantidades (ej. `B12 × 4`, `DB24-2S × 2`, `W3036-SM × 6`).
- Materiales por rol (caja, refuerzo, frente, fondo) o el preset que se usa.
- Si existe, el plan de corte real que se usó (Lepton u otro) para comparar.

### B. Láminas
- Formato real de cada proveedor y material (largo × ancho en mm), y si un material se consigue en
  varios formatos.
- Refilado por cada borde (mm) y zonas no utilizables.

### C. Sierra
- Tipo: sierra de panel (guillotina) o CNC de nesting.
- Espesor del disco (mm).
- Niveles de corte de guillotina permitidos (2, 3, 4…).
- Altura máxima de pila: cuántas láminas corta a la vez.
- Si gira la lámina entre cortes y dirección del primer corte (a lo largo o a lo ancho).
- Formato de importación que acepta (CSV, XML, otro) y un archivo de ejemplo.

### D. Piezas
- Materiales con veta y qué piezas no se pueden girar.
- Si la medida de corte descuenta el espesor del canto, y cuánto por calibre.
- Medida mínima de pieza y sobremedida si existe (para retestar o escuadrar).

### E. Sobrantes y criterio
- Medida mínima para guardar un sobrante.
- Prioridad del criterio: menos láminas, menos cortes, menos tiempo de máquina o sobrantes más grandes.

### F. Salidas
- Qué debe llevar la etiqueta de cada pieza y si hay impresora de etiquetas (modelo).
- Cómo quiere ver producción el plan: PDF por lámina, pantalla en planta, archivo para la máquina.

## 6. Riesgos y cómo se controlan

| Riesgo | Control |
|---|---|
| Plan bueno en papel pero no ejecutable | Validación con el operario en la fase 3 antes de integrar |
| Despiece del cotizador distinto al de producción | Se apoya en el despiece ya conciliado contra hojas de ruta; las correcciones pendientes (H1–H10) deben cerrarse antes |
| Formatos de lámina mal cargados | Normalización y validación de `cot_tableros.formato` en la fase 0 |
| Tiempo de cálculo en proyectos grandes | Límite de tiempo configurable y cálculo por material en paralelo |
| Expectativa de "óptimo perfecto" | Mostrar siempre el mínimo teórico y la distancia a él |
