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

### Definición del Producto (Data-driven Template)
*   **`cot_tipos_mueble`:** Cabecera de los muebles disponibles para cotizar (ej: BFD, SBFD). Vincula cada tipo a su política de margen respectiva (`margen_key`).
*   **`cot_piezas_plantilla`:** Contiene las fórmulas matemáticas (en formato texto) para despiezar cada mueble en base al Largo ($L$), Alto ($A$) y Profundidad ($P$). Define además la orientación del tapacanto (`cantos` en formato JSON).
*   **`cot_reglas_config`:** Reglas condicionales con prioridad para calcular variables dinámicas (como cantidad de puertas, cajones o refuerzos) basadas en las dimensiones provistas por el usuario.

### Transaccionales (Cotizaciones)
*   **`cot_cotizaciones`:** Cabecera del documento de cotización (cliente, moneda, TRM congelada, estado del negocio).
*   **`cot_cotizacion_lineas`:** Líneas individuales que componen el presupuesto. Almacena las dimensiones, cantidad solicitada, variables de diseño y guarda el objeto `breakdown` final (JSON) generado por el motor para auditoría histórica.

## 3. Seguridad y Triggers
- Todos los registros cuentan con auditoría automática de fecha de modificación conectada al trigger `cot_touch_updated_at`.
- Cuenta con funciones auxiliares para validar permisos en las políticas de seguridad (RLS): `cot_is_admin()` y `cot_is_authenticated()`.
