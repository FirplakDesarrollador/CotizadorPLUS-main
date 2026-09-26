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
  if (nombre === 'entrepano' || nombre === 'shelf' || nombre === 'shlef') return 60;
  if (nombre === 'frente' || nombre.startsWith('frente_') || nombre === 'puerta' || nombre.startsWith('puerta_')) return 70;
  if (nombre === 'fondo' || nombre.startsWith('fondo_')) return 80;
  return 999;
}

export function ordenarPiezasDespiece<T extends { pieza: string }>(piezas: readonly T[]): T[] {
  return piezas
    .map((pieza, index) => ({ pieza, index, orden: ordenPiezaDespiece(pieza.pieza) }))
    .sort((a, b) => a.orden - b.orden || a.index - b.index)
    .map(({ pieza }) => pieza);
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
  { key: 'DB-3', nc: 3, nb: 0, npeq: 0, desc: '3 cajones iguales · sin barras' },
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
