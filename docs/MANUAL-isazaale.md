# Cotizador PLUS — Manual de funcionamiento

Aplicación para **cotizar muebles modulares** (cocina y baño) replicando, al peso, la lógica del Excel *Simulación muebles CEMA*. Construida en **Next.js + Supabase**.

---

## 1. Concepto general

El cotizador calcula el **costo de fabricación** y el **precio de venta** de cada mueble a partir de sus **dimensiones**, el **tipo de mueble**, los **materiales** (tableros) y la **configuración** (puertas, cajones, herrajes). Está organizado en tres niveles:

```
Proyecto  →  Cocina(s)  →  Módulo(s) / mueble(s)
```

- **Proyecto**: la cotización completa, con un nombre, cliente, moneda y TRM.
- **Cocina**: un ambiente dentro del proyecto (un proyecto puede tener varias cocinas).
- **Módulo**: cada mueble individual dentro de una cocina.

Los totales se consolidan automáticamente por cocina y por proyecto, en **COP y USD**.

---

> 💡 **Guía interactiva**: en las pantallas de *Cotizaciones* y *Simulador* encontrarás un botón **"Guía"** que resalta paso a paso cada elemento de la pantalla y explica cómo usarlo. Ideal para los primeros usos.

## 2. Acceso y roles

- Inicio de sesión con correo y contraseña (**Supabase Auth**).
- **Roles**:
  - **Vendedor**: crea y gestiona sus cotizaciones, usa el simulador.
  - **Admin**: además edita catálogos, parámetros y el diseño de los muebles.
- La seguridad se aplica en la base de datos (RLS): cada usuario ve/gestiona lo que le corresponde.

---

## 3. Cómo se calcula el precio (el motor)

Cada mueble se "explota" en **piezas**. Cada pieza tiene una **fórmula de dimensión** (en función del Largo `L`, Alto `A`, Profundidad `P`) y un **rol de material**:

| Rol | Material típico | Piezas |
|---|---|---|
| **caja** | Balance 15 mm | laterales, base/tapa, refuerzo vertical delantero |
| **refuerzo** | Polar 15 mm | refuerzos traseros/horizontales, entrepaños, gavetas |
| **frente** | Color 18 mm | puertas y frentes de cajón |
| **fondo** | tablero de fondo | backing |

El costo se arma en capas:

1. **Tablero (madera)** = Σ por rol de `área (m²) × (1 + desperdicio) × precio/m²` del tablero elegido.
2. **Canto** = longitud de enchape (por calibre 19 mm / 22 mm) × precio del canto, + desperdicio por arista.
3. **Consumibles** = tarugos, soportes, cartón de protección, etiquetas.
4. **Herrajes** (opcional) = patas, bisagras, manijas, rieles de cajón, etc.

Luego el **precio**:

```
Precio COP = Costo / (1 − margen)          (margen por categoría: muebles 57%, fillers 52%, paneles/zócalos 44%)
Precio COP = Precio / (1 − recargo)        (recargo por cliente, ej. CEMA +10%)
Precio USD = Precio COP / TRM
```

> El motor reproduce el Excel **al peso** en los tipos validados. La auditoría se ejecuta con `scripts/compare-excel.mjs`.

---

## 4. Variables que definen cada mueble

El despiece se ajusta con **reglas paramétricas** y **variables** (editables):

- **n_puertas**: nº de puertas (regla por ancho: hasta 21″ = 1, ≥24″ = 2).
- **n_entrepaños**: por altura (0 hasta 16″, 1 hasta 24″, 2 hasta 36″, 3 hasta 42″).
- **n_cajones**: nº de cajones (editable). **Al cambiarlo, escalan automáticamente los rieles y manijas.**
- **n_patas / zócalo**: patas (4 en muebles de piso) y alto del zócalo (toe‑kick) en torres.

Además, el modo de **frentes** permite variantes sin crear tipos nuevos:

- **Completo**: mueble con sus puertas/frentes.
- **Sin frentes (open)**: la carcasa sin puertas (familia "O" del Excel).
- **Solo kit de frentes**: únicamente las puertas/frentes (familia "KF").

---

## 5. Tipos de mueble disponibles

Cocina, baño y complementos, entre otros: **B, BFD, SBFD, DB** (cajonera), **W** (superior), **OVPC/PCFD/PC** (torre/alacena), **SVFD, SV, V, VFD, DV** (baño), **UB, UBFD, UDV** (línea U), **WBL** (esquinero), **F, PN, TK, D, R** (fillers/paneles/zócalos).

> Los tipos no validados se mantienen **inactivos** (no aparecen al cotizar) para no entregar precios incorrectos.

---

## 6. Cotizar (paso a paso)

### Simulador (`/cotizador`)
Para calcular un mueble individual:
1. Elige el **tipo** (buscador), ingresa **dimensiones** (pulgadas, cm o mm) y la **unidad**.
2. Elige los **tableros** por rol (caja/refuerzo/frente/fondo).
3. Opcional: **cliente** (recargo), **nº de puertas/cajones**, **modo de frentes**, **con/sin herrajes**.
4. Calcula → verás el **precio** (COP/USD conmutable) y el **desglose** completo: materiales, piezas, canto y herrajes.

### Cotizaciones por proyecto (`/cotizaciones`)
1. **Nuevo proyecto**: nombre, cliente, moneda, TRM. Se crea con una "Cocina 1".
2. En el detalle, agrega **cocinas** y, dentro de cada una, **módulos** (con el mismo formulario del simulador).
3. Cada módulo se guarda con su desglose; los **totales** por cocina y proyecto se actualizan solos.
4. Puedes **renombrar** el proyecto, cambiar cliente/moneda/TRM/estado, y eliminar líneas o cocinas.
5. **Exportar**: desde el detalle del proyecto, **"Exportar Excel"** descarga un `.xlsx` con todas las cocinas, módulos, subtotales y total (COP y USD); **"Imprimir / PDF"** abre una vista lista para imprimir o guardar como PDF desde el navegador.

---

## 7. Unidades y moneda

- **Dimensiones**: pulgadas (in), centímetros (cm) o milímetros (mm). El motor convierte todo internamente a pulgadas.
- **Moneda**: COP y USD, conmutable en vivo. La **TRM** es editable (manual) y por defecto sigue la del Excel de referencia.

---

## 8. Administración (solo admin)

### Materiales y configuración (`/admin`)
- **Tableros**: proveedor, sustrato, espesor, color, código, área, precio y **precio/m²** (lo que usa el cálculo).
- **Cantos**: referencia, calibre y precio por metro.
- **Herrajes**: patas, bisagras, manijas, rieles, etc., con su precio.
- **Clientes**: recargos por cliente (ej. CEMA +10%, Infinitum +25%).
- **Parámetros**: desperdicios, márgenes por categoría, TRM, formatos de lámina.

Cualquier cambio aquí se refleja **de inmediato** en el cálculo.

### Diseño de muebles (`/admin/diseno`)
Editor del **despiece** de cada tipo, sin tocar código:
- **Piezas**: nombre, rol de tablero, fórmulas de cantidad/largo/ancho, canto (calibre + aristas), tarugos y soportes.
- **Reglas**: variables paramétricas por tipo (n_puertas, n_cajones, etc.).
- **Herrajes**: qué herraje lleva el mueble y su fórmula de cantidad.
- **Previsualización**: ingresa dimensiones y verás el costo y desglose en vivo.

---

## 9. Buenas prácticas y notas

- Las **fórmulas** usan las variables `L`, `A`, `P` y las derivadas (`n_puertas`, `n_cajones`, `n_entrepanos`, `n_patas`, `zocalo`). Admiten operaciones aritméticas y condicionales (`L<12 ? 5 : 3.25`).
- El **costo es la fuente de verdad** (en COP, independiente de la TRM); el precio en USD depende de la TRM elegida.
- Para asegurar fidelidad al agregar/editar un tipo, valida contra el Excel con el comparador (`scripts/compare-excel.mjs`).
- Algunas filas del Excel tienen inconsistencias puntuales (p. ej. ciertos tamaños con doble puerta); el motor es consistente y esas diferencias quedan documentadas.

---

## 10. Limitaciones actuales

- Geometrías especiales aún no encodadas: esquineros ciegos (BBLFD), insertos POD, frentes de 5.5 mm con gola (línea UW) y algunos esquineros de baño.
- **Export a Excel y PDF: disponible** (botones en el detalle del proyecto). Códigos SAP: en hoja de ruta.
