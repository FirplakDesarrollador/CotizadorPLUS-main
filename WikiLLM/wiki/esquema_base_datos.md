# Esquema de Base de Datos (Supabase)

El Cotizador PLUS está integrado con **Supabase** como proveedor de base de datos relacional (PostgreSQL). Para integrarse de manera segura en un entorno de producción compartido, el esquema ha sido diseñado de forma aislada.

## 1. Regla de Aislamiento
Todas las tablas creadas para el cotizador utilizan el prefijo `cot_`. Las referencias a entidades preexistentes del sistema (como `colors`, `clients` o `product_references`) se manejan mediante columnas "blandas" o de referencia lógica (`text` o `uuid` sin llave foránea física o `Foreign Key`). Esto garantiza que el cotizador pueda instalarse sin modificar ni arriesgar la estructura existente de producción.

## 2. Tablas Principales
La base de datos se estructura en torno a los siguientes modelos:

### Configuración e Infraestructura
*   **`cot_perfiles`:** Asocia un usuario de la autenticación (`auth.users`) con un rol (`admin` o `vendedor`).
*   **`cot_parametros`:** Almacena variables globales del sistema en formato `JSONB` (TRM por defecto, márgenes por categoría, porcentaje de desperdicio de madera, formatos estándar).

### Catálogos de Insumos
*   **`cot_tableros`:** Catálogo de melaminas y sustratos (RH, estándar, CARB). Registra las dimensiones físicas de la lámina, el precio bruto y el precio por metro cuadrado.
*   **`cot_cantos`:** Catálogo de tapacantos por calibre (ej: `22x1`, `19x0,45`), indicando el costo por metro lineal.
*   **`cot_herrajes`:** Catálogo general de herrajes (bisagras, rieles, manijas) e insumos clasificados como `consumibles` (tarugos, cartón, etiquetas, soportes).
*   **`cot_recargos_cliente`:** *(Desactivada)* Catálogo de recargos por cliente. Actualmente se maneja la rentabilidad de forma exclusiva mediante márgenes.

### Definición del Producto (Data-driven Template)
*   **`cot_tipos_mueble`:** Cabecera de los muebles disponibles para cotizar (ej: BFD, SBFD). Vincula cada tipo a su política de margen respectiva (`margen_key`).
*   **`cot_piezas_plantilla`:** Contiene las fórmulas matemáticas (en formato texto) para despiezar cada mueble en base al Largo ($L$), Alto ($A$) y Profundidad ($P$). Define además la orientación del tapacanto (`cantos` en formato JSON).
*   **`cot_reglas_config`:** Reglas condicionales con prioridad para calcular variables dinámicas (como cantidad de puertas, cajones o refuerzos) basadas en las dimensiones provistas por el usuario.

### Transaccionales (Cotizaciones)
*   **`cot_cotizaciones`:** Cabecera del documento de cotización (cliente, moneda, TRM congelada, estado del negocio).
*   **`cot_cocinas`:** Jerarquía de cocinas dentro de un proyecto. Almacena el nombre, orden, cantidad (multiplicador de los muebles internos) y totales acumulados en COP/USD.
*   **`cot_cotizacion_lineas`:** Líneas individuales que componen el presupuesto. Almacena las dimensiones, cantidad solicitada, variables de diseño y guarda el objeto `breakdown` final (JSON) generado por el motor para auditoría histórica.
*   **`cot_grupos_modulos`:** Bloques físicos ordenados dentro de una cocina. Almacena la letra canónica, el código concatenado, los subtotales y el breakdown estructural del grupo. Cada línea apunta a un grupo y conserva su posición de izquierda a derecha.
*   **`cot_cotizacion_versiones`:** Historial inmutable de snapshots JSONB del agregado completo (cabecera, cocinas, grupos y líneas). La numeración es consecutiva por cotización y cada restauración crea primero un respaldo automático.

### Extensiones para agrupación

La migración `0020_agrupacion_modulos.sql` incorpora:

- `sistema_medida` en la cotización (`imperial` o `metrico`), fijado al crear el proyecto.
- Prefijos `pref_imperial` y `pref_metrico`, más `permite_agrupacion`, en los tipos de mueble. La equivalencia confirmada `BFD -> IP` se precarga; las demás quedan editables desde Diseño.
- `modo_agrupacion`, `clave_fusion` y `formula_largo_grupo` en las plantillas de piezas, también editables por un administrador.
- `grupo_id`, `posicion_grupo` y `codigo_modulo` en las líneas.
- Backfill de cada línea histórica como bloque unitario A, B, C… sin modificar sus importes ni breakdown históricos.

La tabla de grupos tiene RLS vinculada al propietario de la cotización o al rol administrador. La migración debe aplicarse antes de desplegar el código que consulta estas columnas.

La migración 0020 fue aplicada y verificada en Supabase **I+D** el 2026-07-15. El backfill produjo un grupo por cada una de las ocho líneas históricas existentes, sin líneas huérfanas, y dejó activas las cuatro políticas RLS del nuevo modelo.

### Versionado persistente

La migración `0024_versiones_cotizacion.sql` añade la tabla de versiones y las funciones RPC `cot_guardar_version` y `cot_restaurar_version`. La captura se serializa bajo bloqueo de la cabecera para evitar números duplicados. La restauración valida propiedad o rol administrador, repone todo el agregado dentro de una transacción y conserva el estado anterior como una nueva versión de respaldo.

La migración 0024 fue aplicada en Supabase **I+D** el 2026-07-22. Se verificó la existencia de la tabla, las dos funciones RPC y las dos políticas RLS.

## 3. Seguridad y Triggers
- Todos los registros cuentan con auditoría automática de fecha de modificación conectada al trigger `cot_touch_updated_at`.
- Cuenta con funciones auxiliares para validar permisos en las políticas de seguridad (RLS): `cot_is_admin()` y `cot_is_authenticated()`.
