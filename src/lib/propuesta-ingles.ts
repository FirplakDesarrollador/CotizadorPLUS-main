// Versión en inglés de la propuesta impresa.
//
// La cotización se arma en español: descripciones generadas ("2 puerta(s)"),
// anotaciones libres del cotizador ("Mueble Inferior Lavaplatos"), nombres de
// herrajes del catálogo y filas de especificación. Para clientes en EE. UU. el
// botón "Print / PDF (English)" abre la misma impresión con `lang=en`.
//
// La traducción es por glosario de carpintería y mobiliario, no automática: las
// frases más largas se reemplazan primero ("mueble inferior" → "base cabinet"
// antes que "mueble" → "cabinet"). Los códigos (UBFD36-18MM, PERALM12) no
// coinciden con ninguna entrada y salen intactos. Los nombres de color del
// catálogo son referencias comerciales y tampoco se traducen.

export type IdiomaPropuesta = 'es' | 'en';

export function idiomaDeConsulta(valor: string | string[] | undefined): IdiomaPropuesta {
  return (Array.isArray(valor) ? valor[0] : valor) === 'en' ? 'en' : 'es';
}

// ---------------------------------------------------------------------------
// Glosario. Clave en minúsculas; el valor conserva el uso de mayúsculas del
// texto original (TODO MAYÚSCULAS, Inicial o minúsculas).
// ---------------------------------------------------------------------------
const GLOSARIO: Record<string, string> = {
  // Frases de mueble completas
  'mueble inferior': 'base cabinet',
  'muebles inferiores': 'base cabinets',
  'mueble superior': 'wall cabinet',
  'muebles superiores': 'wall cabinets',
  'mueble elevado': 'floating cabinet',
  'mueble de nevera': 'refrigerator cabinet',
  'mueble sobre refrigerador': 'cabinet above refrigerator',
  'mueble lavamanos': 'vanity cabinet',
  'mueble elevado de lavamanos para baño': 'floating bathroom vanity cabinet',
  'mueble elevado de lvm': 'floating vanity cabinet',
  'torre de cajones': 'drawer tower',
  'torre de gavetas': 'drawer tower',
  'torre de alacenas': 'pantry tower',
  'torres de alacena': 'pantry towers',
  'puertas corredizas': 'sliding doors',
  'puerta basculante': 'lift-up door',
  'frente completo para perforar': 'full front, to be cut out on site',
  'formato completo': 'full height',
  'rieles se cotizan por aparte': 'drawer slides quoted separately',
  'apertura hacia la izquierda': 'opens left',
  'apertura hacia izquierda': 'opens left',
  'apertura hacia la derecha': 'opens right',
  'apertura hacia derecha': 'opens right',
  'abre a la sala': 'opens to living room',
  'sin fondo': 'no back panel',
  'sin manijas': 'handleless',
  'sin manija': 'handleless',
  'sin espaldar': 'no back panel',
  'push open': 'push-to-open',
  'estación de café': 'coffee station',
  'estación de cafe': 'coffee station',
  'zona parrilla': 'grill area',
  'zona de parrilla': 'grill area',
  'cierre lento': 'soft-close',
  'riel cajón': 'drawer slide',
  'riel cajon': 'drawer slide',
  'barra estabilizadora': 'stabilizer bar',
  'barras estabilizadoras': 'stabilizer bars',
  'pata ajustable': 'adjustable leveling leg',
  'pata niveladora': 'leveling leg',
  'soporte entrepaño': 'shelf support',
  'soportes de entrepaño': 'shelf supports',
  'soporte de entrepaño': 'shelf support',
  'lámina cartón protección': 'cardboard protection sheet',
  'tubo ovalado': 'oval closet rod',
  'clip de madera': 'wood clip',
  'clip de pvc': 'PVC clip',
  'chazo mas tornillo': 'wall anchor and screw',
  'panel nevera': 'refrigerator panel',
  'panel refrigerador': 'refrigerator panel',
  'panel lateral': 'side panel',
  'paneles laterales': 'side panels',
  'panel posterior': 'back panel',
  'panel fondo': 'back panel',
  'paneles horizontales': 'horizontal panels',
  'paneles completos': 'full panels',
  'parales verticales': 'vertical uprights',
  'filler / relleno': 'filler',
  'filler de muro': 'wall filler',
  'filler muro': 'wall filler',
  'lateral izq': 'left side',
  'lateral der': 'right side',
  'lat add caj': 'additional drawer side',
  'lat adicional cajones': 'additional drawer side',
  'ref tras': 'rear rail',
  'ref del': 'front rail',
  'refuerzo posterior': 'rear rail',
  'refuerzo delantero': 'front rail',
  'zócalo delantero/posterior': 'front/rear toe kick',
  'zócalo del / pos': 'front/rear toe kick',
  'zócalo del / post': 'front/rear toe kick',
  // Términos sueltos
  'mueble': 'cabinet',
  'muebles': 'cabinets',
  'módulo': 'module',
  'modulo': 'module',
  'módulos': 'modules',
  'modulos': 'modules',
  'torre': 'tower',
  'torres': 'towers',
  'alacena': 'pantry',
  'alacenas': 'pantries',
  'puerta': 'door',
  'puertas': 'doors',
  'cajón': 'drawer',
  'cajon': 'drawer',
  'cajones': 'drawers',
  'caj': 'drawer',
  'gaveta': 'drawer',
  'gavetas': 'drawers',
  'entrepaño': 'shelf',
  'entrepaños': 'shelves',
  'zócalo': 'toe kick',
  'zocalo': 'toe kick',
  'zócalos': 'toe kicks',
  'relleno': 'filler',
  'rellenos': 'fillers',
  'filleres': 'fillers',
  'paneles': 'panels',
  'paral': 'upright',
  'parales': 'uprights',
  'lateral': 'side',
  'laterales': 'sides',
  'lat': 'side',
  'lats': 'sides',
  'lado': 'side',
  'izq': 'left',
  'izquierda': 'left',
  'der': 'right',
  'derecha': 'right',
  'espaldar': 'back panel',
  'fondo': 'back panel',
  'refuerzo': 'rail',
  'refuerzos': 'rails',
  'ref': 'rail',
  'cenefa': 'valance',
  'nicho': 'niche',
  'división': 'divider',
  'division': 'divider',
  'divs': 'dividers',
  'intermedio': 'middle',
  'terminación': 'end',
  'final': 'end',
  'esquina': 'corner',
  'esquinero': 'corner',
  'superior': 'upper',
  'inferior': 'lower',
  'sup': 'upper',
  'inf': 'lower',
  'posterior': 'rear',
  'delantero': 'front',
  'tras': 'rear',
  'peq': 'small',
  'pequeño': 'small',
  'pequeños': 'small',
  'grande': 'large',
  'largo': 'long',
  'largos': 'long',
  'iguales': 'equal',
  'completo': 'full',
  'completos': 'full',
  'abierto': 'open',
  'elevado': 'floating',
  'removible': 'removable',
  'isla': 'island',
  'península': 'peninsula',
  'peninsula': 'peninsula',
  'penísula': 'peninsula',
  'barra': 'bar',
  'nevera': 'refrigerator',
  'refrigerador': 'refrigerator',
  'refrigerados': 'refrigerator',
  'lavaplatos': 'sink',
  'fregadero': 'sink',
  'lavavajillas': 'dishwasher',
  'lavamanos': 'washbasin',
  'lvm': 'washbasin',
  'lvp': 'sink',
  'horno': 'oven',
  'microondas': 'microwave',
  'extractor': 'range hood',
  'locero': 'dish rack',
  'platero': 'dish rack',
  'vajillero': 'dish rack',
  'maletero': 'top storage',
  'tapa': 'top',
  'detrás': 'behind',
  'parte': 'part',
  'manija': 'handle',
  'manijas': 'handles',
  'herraje': 'hardware',
  'herrajes': 'hardware',
  'bisagra': 'hinge',
  'bisagras': 'hinges',
  'riel': 'drawer slide',
  'rieles': 'drawer slides',
  'corredera': 'drawer slide',
  'correderas': 'drawer slides',
  'pata': 'leg',
  'patas': 'legs',
  'tornillo': 'screw',
  'tornillos': 'screws',
  'tarugo': 'dowel',
  'tarugos': 'dowels',
  'preimpregnado': 'pre-glued',
  'grapas': 'staples',
  'soporte': 'support',
  'soportes': 'supports',
  'perfil': 'profile',
  'guía': 'track',
  'guias': 'tracks',
  'guía superior': 'top track',
  'guía inferior': 'bottom track',
  'rodachinas': 'rollers',
  'tubo': 'rod',
  'acero': 'steel',
  'aluminio': 'aluminum',
  'aluminizado': 'aluminum-finish',
  'cromado': 'chrome-plated',
  'niquelado': 'nickel-plated',
  'cepillada': 'brushed',
  'cuadrada': 'square',
  'ovalado': 'oval',
  'metálico': 'metal',
  'metalico': 'metal',
  'unidad': 'unit',
  'unds': 'pcs',
  'und': 'pcs',
  'par': 'pair',
  'imán': 'magnet',
  'dispositivo': 'device',
  'sistema': 'system',
  'fijación': 'fastening',
  'etiqueta': 'label',
  'incluye': 'includes',
  'felpa': 'weatherstrip',
  'tablero': 'board',
  'canto': 'edge banding',
  'cantos': 'edge banding',
  'panel': 'panel',
  'baño': 'bathroom',
  'baños': 'bathrooms',
  'cocina': 'kitchen',
  'sobre': 'above',
  'para': 'for',
  'con': 'with',
  'sin': 'without',
  'y': 'and',
};

const ENTRADAS = Object.entries(GLOSARIO).sort((a, b) => b[0].length - a[0].length);
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const PATRON = new RegExp(
  `(?<![\\p{L}\\p{N}])(${ENTRADAS.map(([es]) => escapar(es)).join('|')})(?![\\p{L}\\p{N}])`,
  'giu',
);
const MAPA = new Map(ENTRADAS.map(([es, en]) => [es, en]));

function conMayusculas(original: string, traducido: string): string {
  const letras = original.replace(/[^\p{L}]/gu, '');
  if (letras.length > 1 && letras === letras.toUpperCase()) return traducido.toUpperCase();
  const primera = original.match(/\p{L}/u)?.[0] ?? '';
  if (primera && primera === primera.toUpperCase()) return traducido.charAt(0).toUpperCase() + traducido.slice(1);
  return traducido;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Traduce una descripción de mueble, anotación o nombre de herraje.
 *
 * Primero los contadores que genera el cotizador ("2 puerta(s)", "1 de 2",
 * "· 4 und"), después el glosario. Lo que no está en el glosario —códigos,
 * medidas, nombres propios de áreas— se conserva.
 */
export function traducirTexto(texto: string | null | undefined): string {
  if (!texto) return '';
  return String(texto)
    .replace(/(\d+)\s*puerta\(s\)/giu, (_, n) => plural(Number(n), 'door', 'doors'))
    .replace(/(\d+)\s*gaveta\(s\)/giu, (_, n) => plural(Number(n), 'drawer', 'drawers'))
    .replace(/(\d+)\s*entrepaño\(s\)/giu, (_, n) => plural(Number(n), 'shelf', 'shelves'))
    .replace(/(\d+)\s+de\s+(\d+)/giu, '$1 of $2')
    .replace(PATRON, (m) => conMayusculas(m, MAPA.get(m.toLowerCase()) ?? m));
}

/** Unidades de material suelto. */
export function traducirUnidad(unidad: string): string {
  const u = unidad.trim().toLowerCase();
  return u === 'und' || u === 'unds' ? 'pcs' : unidad;
}

// ---------------------------------------------------------------------------
// Especificaciones de materiales
// ---------------------------------------------------------------------------
const TITULOS_FAMILIA: Record<string, string> = {
  'Muebles superiores cocina': 'Kitchen wall cabinets',
  'Muebles inferiores cocina': 'Kitchen base cabinets',
  'Closet / Walk in closet': 'Closet / Walk-in closet',
  'Baños / Auxiliares': 'Bathroom vanities / Auxiliary',
};

const FILAS_ESPECIFICACION: Record<string, string> = {
  'Caja / refuerzos': 'Cabinet box / rails',
  'Refuerzo': 'Rails',
  'Refuerzos': 'Rails',
  'Caja': 'Cabinet box',
  'Fondo': 'Back panel',
  'Tablero Gaveta': 'Drawer box board',
  'Tablero Gaveta (15 mm)': 'Drawer box board (15 mm)',
  'Tablero Gaveta (15 mm; paredes DB-FE usan caja)': 'Drawer box board (15 mm; DB-FE drawer sides use the cabinet box board)',
  'Frentes / paneles / rellenos': 'Doors & drawer fronts / panels / fillers',
  'Caja / refuerzos de OBFD, OBFD-SM, OSBFD-SM, OW y OW-MO (incluidas variantes sin fondo)': 'Cabinet box / rails of OBFD, OBFD-SM, OSBFD-SM, OW and OW-MO (including no-back variants)',
  'Fondo de abiertos OBFD, OBFD-SM, OSBFD-SM, OW y OW-MO (6 mm, color del frente; solo con fondo)': 'Back panel of open cabinets OBFD, OBFD-SM, OSBFD-SM, OW and OW-MO (6 mm, front color; only where a back is used)',
  'Fondo general (solo donde lleva espaldar; los abiertos usan el fondo indicado arriba)': 'General back panel (only where a back is used; open cabinets use the back panel listed above)',
  'Fondo de gavetas DB-FE (todas las variantes; mismo tablero del espaldar)': 'DB-FE drawer bottoms (all variants; same board as the back panel)',
  'Canto de caja': 'Cabinet box edge banding',
  'Canto de frentes': 'Front edge banding',
};

const SUSTRATOS: Record<string, string> = {
  estandar: 'Standard particleboard',
  rh: 'Moisture-resistant (RH)',
};

/** Un valor de material: segmentos "código · sustrato · espesor · color · proveedor". */
export function traducirValorMaterial(valor: string): string {
  if (valor === 'No configurado') return 'Not configured';
  const sinCanto = valor.match(/^Sin canto \(tablero de (.+)\)$/);
  if (sinCanto) return `No edge banding (${sinCanto[1]} board)`;
  return valor.split(' · ').map((segmento) => {
    if (segmento === 'Referencia no encontrada en catálogo') return 'Reference not found in catalog';
    return SUSTRATOS[segmento.trim().toLowerCase()] ?? segmento;
  }).join(' · ');
}

export function traducirEspecificaciones<T extends { titulo: string; filas: Array<[string, string]> }>(bloques: readonly T[]): T[] {
  return bloques.map((b) => ({
    ...b,
    titulo: TITULOS_FAMILIA[b.titulo] ?? b.titulo.replace(/^Selección individual · /, 'Individual selection · '),
    filas: b.filas.map(([rol, valor]) => [FILAS_ESPECIFICACION[rol] ?? traducirTexto(rol), traducirValorMaterial(valor)] as [string, string]),
  }));
}

// ---------------------------------------------------------------------------
// Números y textos comerciales
// ---------------------------------------------------------------------------
const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** Entero de 0 a 999 en palabras; fuera de rango devuelve el dígito. */
export function numberInWords(n: number): string {
  if (!Number.isFinite(n)) return '';
  const e = Math.trunc(n);
  if (e < 0 || e > 999) return String(e);
  if (e < 20) return UNITS[e];
  if (e < 100) return TENS[Math.floor(e / 10)] + (e % 10 ? `-${UNITS[e % 10]}` : '');
  const resto = e % 100;
  return `${UNITS[Math.floor(e / 100)]} hundred${resto ? ` ${numberInWords(resto)}` : ''}`;
}

/** "ninety (90)". */
export function inWordsAndDigits(n: number): string {
  const e = Number.isFinite(n) ? Math.trunc(n) : 0;
  return `${numberInWords(e)} (${e})`;
}

export function paymentTerms(depositPct: number, balancePct: number): string {
  return `${depositPct}% deposit and ${balancePct}% balance prior to shipment`;
}

export const TITULO_GRUPO_EN: Record<string, string> = {
  muebles: 'Cabinets',
  paneles: 'Panels',
  filler: 'Fillers',
  herrajes: 'Hardware',
};

export const ROL_HERRAJE_EN: Record<string, string> = {
  barra: 'Closet rod / bar',
  bisagra: 'Hinge',
  manija: 'Handle',
  pata: 'Leveling leg',
  push: 'Push-to-open',
  riel: 'Drawer slide',
  tornillo: 'Screw',
  soporte: 'Shelf support',
  gola: 'Gola handle profile',
};
