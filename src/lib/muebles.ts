// Datos de dominio de tipologías de mueble compartidos por los formularios (cliente).
// NO importar 'server-only' aquí: se usa en componentes cliente.

// ---------------------------------------------------------------------------
// Variantes transversales (aplican sobre el mismo tipo de mueble, no lo duplican)
// ---------------------------------------------------------------------------

// Sistema de apertura del frente. `gola` corresponde a los códigos comerciales
// SM / SMG / GOAL del maestro histórico; internamente se guarda la clave
// semántica, no el sufijo (ver WikiLLM/wiki/variantes_frente_gola_sm.md).
//
// Efecto medido en las hojas de ruta: la gola consume 53.6mm del alto disponible
// para la pila de frentes y, en DB, agrega 2 perfiles de gola y retira un
// refuerzo delantero. Se aplica vía el override `gola` (0/1).
export type SistemaFrente = 'manija' | 'gola';
export const SISTEMAS_FRENTE: { key: SistemaFrente; label: string; desc: string }[] = [
  { key: 'manija', label: 'Manija', desc: 'Frente con manija (estándar)' },
  { key: 'gola', label: 'SM', desc: 'Gola en melamina; sin manijas. Añade el sufijo -SM al código (W2936-SM)' },
];

// ---------------------------------------------------------------------------
// Convenciones de presentación del despiece
// ---------------------------------------------------------------------------
// La hoja de ruta lista cada panel con su medida mayor primero (`SIDE 914.4x304.8`
// es vertical, `BASE 706.6x304.8` es horizontal), mientras que el motor guarda
// largo/ancho como ejes geométricos atados a `visualizacion.intercambiar` de cada
// pieza (ver WikiLLM/wiki/ejes_fondo_backing.md).
//
// El frente siempre se presenta con el alto primero. El fondo conserva sus ejes de
// fabricación: largo = alto útil (A−2mm) y ancho = largo útil (L−16mm). Así el
// despiece comunica la misma orientación que las fórmulas y el montaje.
//
// Vive aquí y no en cada tabla para que el despiece del Simulador y el del HDR no
// vuelvan a contradecirse.
export function orientarPieza<T extends { rol: string; largoIn: number; anchoIn: number }>(
  pieza: T,
): { largoIn: number; anchoIn: number } {
  const invertir = pieza.rol === 'frente';
  return invertir
    ? { largoIn: pieza.anchoIn, anchoIn: pieza.largoIn }
    : { largoIn: pieza.largoIn, anchoIn: pieza.anchoIn };
}

// El motor llama `frente` tanto a una puerta como a la cara de una gaveta. Solo es
// puerta cuando la tipología declara `n_puertas`; en una cajonera el mismo nombre
// designa el frente de gaveta. `HdrTabla` aplica la misma distinción para elegir
// entre `DOOR` y `FRENTE`.
export function nombrePieza(nombre: string, tienePuertas: boolean): string {
  if (nombre === 'shlef' || nombre === 'shelf') return 'entrepano';
  return nombre === 'frente' && tienePuertas ? 'puerta' : nombre;
}

// Orden fijo de produccion para la tabla de despiece del Simulador. Las piezas
// no contempladas conservan su orden relativo despues de las piezas conocidas.
function ordenPiezaDespiece(nombre: string): number {
  if (nombre === 'base' || nombre.startsWith('base_')) return 10;
  if (nombre === 'tapa' || nombre.startsWith('tapa_')) return 20;
  if (nombre === 'lateral' || nombre.startsWith('lateral_')) return 30;
  if (nombre === 'refuerzo_delantero' || nombre.startsWith('refuerzo_delantero_') || nombre === 'refuerzo_horizontal') return 40;
  if (nombre === 'refuerzo_trasero' || nombre.startsWith('refuerzo_trasero_')) return 50;
  if (nombre.startsWith('entrepano') || nombre === 'shelf' || nombre === 'shlef') return 60;
  if (nombre === 'frente' || nombre.startsWith('frente_') || nombre === 'puerta' || nombre.startsWith('puerta_')) return 70;
  if (nombre === 'fondo' || nombre.startsWith('fondo_')) return 80;
  return 999;
}

export function ordenarPiezasDespiece<T extends { pieza: string; origen?: string; compartida?: boolean }>(piezas: readonly T[]): T[] {
  return piezas
    .map((pieza, index) => {
      const modulo = pieza.origen?.match(/^A(\d+)\b/);
      const bloque = pieza.compartida ? 0 : modulo ? Number(modulo[1]) : 1;
      return { pieza, index, bloque, orden: ordenPiezaDespiece(pieza.pieza) };
    })
    .sort((a, b) => a.bloque - b.bloque || a.orden - b.orden || a.index - b.index)
    .map(({ pieza }) => pieza);
}

export type FamiliaMaterial = 'inferior' | 'superior';

// Los prefijos pueden contener ambas letras (por ejemplo WBL). La primera B o
// W, leída de izquierda a derecha, determina el juego de materiales del proyecto.
// Los tipos sin ninguna de las dos letras conservan el bloque inferior como
// fallback compatible con las cotizaciones anteriores.
export function esMuebleSuperior(pref: string | null | undefined): boolean {
  const value = String(pref ?? '').toUpperCase();
  // TW y todas sus variantes pertenecen explícitamente a muebles superiores.
  if (value === 'TW' || value.startsWith('TW-')) return true;
  const b = value.indexOf('B');
  const w = value.indexOf('W');
  return w >= 0 && (b < 0 || w < b);
}

export function familiaMaterialPorPrefijo(pref: string | null | undefined): FamiliaMaterial {
  return esMuebleSuperior(pref) ? 'superior' : 'inferior';
}

// Prefijos que en la descripción de una línea se escriben con su nombre de
// producción en lugar de la letra. `F` es la única tipología de categoría
// `filler` del catálogo, y producción la lee como FILLER.
const ETIQUETA_DESCRIPCION: Record<string, string> = { F: 'FILLER' };

// La etiqueta con la que empieza `descripcion_es`. Recibe lo que haya en
// `prefLabel`, que al agregar la línea es el código completo (`F636`) y tras el
// primer recálculo es solo el prefijo base (`F`) — ambos deben dar FILLER.
//
// Se compara contra las letras iniciales, no contra el valor entero, para que
// `F636` resuelva pero un prefijo distinto que empiece por F (p. ej. `FPK`) no
// se vea arrastrado.
export function etiquetaDescripcion(prefLabel: string | null | undefined): string {
  const value = String(prefLabel ?? '').trim();
  if (!value) return '';
  const letras = value.toUpperCase().match(/^[A-Z]+/)?.[0] ?? '';
  return ETIQUETA_DESCRIPCION[letras] ?? value;
}

// Solo los campos que la regla necesita, para no atar este módulo —que es de
// cliente— a la forma completa de `Pieza`.
type PiezaAjustable = {
  nombre: string;
  rol_tablero: string;
  formula_cantidad: string;
  formula_largo: string | null;
  formula_ancho: string | null;
};

// "Sin fondo" es una configuración de proyecto que describe los módulos
// INFERIORES: anula la pieza de respaldo y deja la base en la profundidad menos
// exactamente un espesor de tablero de caja. **Los muebles superiores siempre
// llevan fondo**, así que la transformación no les aplica — de lo contrario un W
// se cotizaría sin respaldo y el tablero de fondo de superiores que el formulario
// sigue pidiendo no se consumiría.
//
// Vive aquí y no en `cotizar.ts` porque aquel importa `server-only` y no puede
// ejercerse desde una prueba; la regla afecta al precio, así que necesita una.
export function ajustarPiezasSinFondo<T extends PiezaAjustable>(
  piezas: T[], pref: string | null | undefined, conFondo: boolean | undefined,
): T[] {
  if (conFondo !== false || esMuebleSuperior(pref)) return piezas;
  return piezas.map((pieza) => {
    if (pieza.rol_tablero === 'fondo') return { ...pieza, formula_cantidad: '0' };
    if (pieza.nombre !== 'base') return pieza;
    // Se conserva el eje de largo propio de cada plantilla.
    if (/\bP\b/.test(pieza.formula_ancho ?? '')) return { ...pieza, formula_ancho: 'P-TC' };
    if (/\bP\b/.test(pieza.formula_largo ?? '')) return { ...pieza, formula_largo: 'P-TC' };
    return pieza;
  });
}

export const PREFS_CON_PUERTA_PARAMETRICA = ['BBLFD', 'BBLFD-D-L/R-SM', 'WBL-D-L/R-SM'] as const;

export function usaPuertaParametrica(pref: string | null | undefined): boolean {
  const value = String(pref ?? '').toUpperCase();
  return (PREFS_CON_PUERTA_PARAMETRICA as readonly string[]).includes(value);
}

export function usaHuecoHornoParametrico(pref: string | null | undefined): boolean {
  return ['BOMH-1', 'BOMH-1-FE'].includes(String(pref ?? '').toUpperCase());
}

// Familias con pares base/removible verificados en las hojas de ruta. Fuera de
// esta lista la opción se bloquea: la regla estructural (rails más anchos, base
// más profunda, fondo reorientado) no se extrapola sin datos.
export const PREFS_CON_REMOVIBLE = ['USVFD', 'USBFD', 'UB', 'UB-FE', 'UDB', 'UBFD'] as const;

export function permiteRemovible(pref: string | null | undefined): boolean {
  const p = String(pref ?? '').toUpperCase();
  return (PREFS_CON_REMOVIBLE as readonly string[]).includes(p);
}

// Tipologías de cajonera DB: definen nº de cajones, nº de pares de barra estabilizadora
// y nº de cajones "pequeños" (frente fijo de 6", ver cot_piezas_plantilla del tipo DB).
// Las barras van en los cajones grandes; es fijo por tipología, no depende de la medida.
// El/los cajón(es) pequeño(s) siempre van arriba (SUP); el resto se reparte por igual abajo.
export type DbTipologia = { key: string; nc: number; nb: number; npeq: number; noculto?: number; desc: string };
export const DB_TIPOLOGIAS: DbTipologia[] = [
  { key: 'DB-1S', nc: 3, nb: 2, npeq: 1, desc: '1 cajón pequeño + 2 grandes · 2 pares de barra' },
  { key: 'DB-2S', nc: 3, nb: 1, npeq: 2, desc: '2 cajones pequeños + 1 grande · 1 par de barra' },
  { key: 'DB-2', nc: 2, nb: 2, npeq: 0, desc: '2 cajones iguales (grandes) · 2 pares de barra' },
  // DB-3 son tres cajones GRANDES (el catálogo le da tres `trasero_gaveta_grande`
  // y ningún pequeño), y las barras van en los cajones grandes: le corresponden
  // tres pares. Estaba en 0, que es lo que hacía que el selector dijera
  // "sin barras" y que el módulo se cotizara sin las barras estabilizadoras.
  { key: 'DB-3', nc: 3, nb: 3, npeq: 0, desc: '3 cajones iguales · 3 pares de barra' },
  { key: 'DB-4', nc: 4, nb: 0, npeq: 0, desc: '4 cajones iguales · sin barras' },
  { key: 'DB2-1OP', nc: 3, nb: 1, npeq: 0, noculto: 1, desc: '2 cajones + 1 oculto · 1 par de barra' },
];

// Cajoneras que comparten el selector comercial de tipologias DB. Mantener
// esta decision en una sola funcion evita que una ruta aplique el selector sin
// incluir sus overrides, el riel o el sufijo del codigo.
export const PREFS_CON_TIPOLOGIA_DB = ['DB', 'UDB', 'UDV'] as const;

export function permiteTipologiaDb(pref: string | null | undefined): boolean {
  const p = String(pref ?? '').toUpperCase();
  return (PREFS_CON_TIPOLOGIA_DB as readonly string[]).includes(p);
}

// Las tipologias DB con Gola de madera son tipos independientes en base de
// datos porque cada una tiene plantillas y montaje propios. En el formulario
// se presentan como una sola familia para evitar tres entradas casi iguales.
export type DbSmTipologia = {
  pref: 'DB-2S-SM' | 'DB-2-SM' | 'DB-3-SM';
  desc: string;
};

export const DB_SM_TIPOLOGIAS: DbSmTipologia[] = [
  { pref: 'DB-2S-SM', desc: '2 gavetas pequeñas + 1 grande' },
  { pref: 'DB-2-SM', desc: '2 gavetas iguales' },
  { pref: 'DB-3-SM', desc: '3 gavetas iguales' },
];

export function esTipologiaDbSm(pref: string | null | undefined): boolean {
  const p = String(pref ?? '').toUpperCase();
  return DB_SM_TIPOLOGIAS.some((tipologia) => tipologia.pref === p);
}

// Cajoneras DB con Gola de madera y cajas de gaveta en madera para riel
// Full Extension de 500 mm. Se presentan como la familia comercial DB-SM-FE,
// aunque cada variante conserva una plantilla independiente en la base de datos.
export type DbSmFeTipologia = {
  pref: 'DB-2S-SM-FE' | 'DB-2-SM-FE' | 'DB-3-SM-FE';
  desc: string;
};

export const DB_SM_FE_TIPOLOGIAS: DbSmFeTipologia[] = [
  { pref: 'DB-2S-SM-FE', desc: '2 gavetas pequeñas + 1 grande' },
  { pref: 'DB-2-SM-FE', desc: '2 gavetas iguales' },
  { pref: 'DB-3-SM-FE', desc: '3 gavetas iguales' },
];

export function esTipologiaDbSmFe(pref: string | null | undefined): boolean {
  const p = String(pref ?? '').toUpperCase();
  return DB_SM_FE_TIPOLOGIAS.some((tipologia) => tipologia.pref === p);
}

// Configuraciones rápidas de torre PCFD. Son presets editables: después de
// aplicarlos el usuario puede ajustar cajones, entrepaños, puertas y zócalo.
export type PcfdConfiguracion = {
  key: 'STANDARD' | '2OP' | '4OP';
  nc: number;
  ne: number;
  zocalo: number;
  desc: string;
};
export const PCFD_CONFIGURACIONES: PcfdConfiguracion[] = [
  { key: 'STANDARD', nc: 0, ne: 5, zocalo: 5.25, desc: 'Estándar · sin gavetas · 5 entrepaños · TK5' },
  { key: '2OP', nc: 2, ne: 3, zocalo: 4.5, desc: '2 gavetas ocultas · 3 entrepaños · PUSH · TK4' },
  { key: '4OP', nc: 4, ne: 3, zocalo: 5.25, desc: '4 gavetas ocultas · 3 entrepaños · PUSH · TK5' },
];

// Tipos de riel de cajón para muebles DB y PCFD-OP
// (fuente: Excel materiales.xlsx Hoja1 sección HERRAJES).
// El código corresponde al registro en cot_herrajes.
// El riel por defecto del sistema es RIELTANDEM (plantilla heredada de 0016_herrajes_tipos.sql).
export type DbRiel = { codigo: string; nombre: string; precio: number };
export const DB_RIELES: DbRiel[] = [
  { codigo: 'RIELMETALBOX', nombre: 'Riel metal BOX',           precio: 28000 },
  { codigo: 'RIELFE500',    nombre: 'Riel full extension 500mm', precio: 31064 },
  { codigo: 'RIELTANDEM',   nombre: 'Riel Tandem china',         precio: 49706.8 },
  { codigo: 'RIELSLIMCHI',  nombre: 'Riel Slim China',           precio: 55671.62 },
  { codigo: 'SLIMBOXALTO',  nombre: 'Slim Box Alto Madecentro',  precio: 48250 },
  { codigo: 'SLIMBOXBAJO',  nombre: 'Slim Box Bajo Madecentro',  precio: 28700 },
];
