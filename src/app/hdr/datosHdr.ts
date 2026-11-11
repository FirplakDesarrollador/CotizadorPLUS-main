import type { CotizarResult } from '@/lib/cotizar';
import { orientarPieza, esTipologiaDbFe, puertasDescripcion, contarEntrepanos, familiaMaterialPorPrefijo } from '@/lib/muebles';
import { indiceALetras } from '@/lib/module-groups';
import { ordenarPiezasHdr } from './ordenPiezas';
import type { ModuloHDR } from './actions';
import { esPanel, nombrePanel } from '@/lib/nombres-modulos';
import { noLlevaCanto } from '@/lib/cantos';
import { consolidarGrupo } from '@/lib/group-result';
import type { GroupCalculation } from '@/lib/group-engine';
export type TableroHdr = { codigo: string; espesor_mm: number | null };
type ContextoPiezaHdr = { pref: string; conFondo: boolean; fondosLaterales?: boolean[] };
export type ResultadoHdr = Omit<CotizarResult, 'piezas'> & { piezas: (CotizarResult['piezas'][number] & { tableroCodigo?: string; contextoHdr?: ContextoPiezaHdr })[] };

/** Suma las asignaciones de costo antes de convertirlas en piezas físicas enteras. */
export function resultadoFisicoHdr(grupo: GroupCalculation, trm: number, margen: number, prefs?: readonly string[]): ResultadoHdr {
  const fondos = grupo.lineas.map(linea => linea.piezas.some(p => p.pieza === 'fondo' && p.cant > 0));
  // Cada lateral interior pertenece a sus dos vecinos; basta que uno tenga fondo.
  const fondosLaterales = [fondos[0], ...fondos.slice(1).map((fondo, i) => fondo || fondos[i]), fondos[fondos.length - 1]];
  const lineas = grupo.lineas.map((linea, i) => ({ ...linea, piezas: linea.piezas.map(p => ({ ...p, tableroCodigo: linea.maderaPorRol.find(m => m.rol === p.rol)?.codigo,
    ...(prefs?.[i] ? { contextoHdr: { pref: prefs[i], conFondo: p.compartida ? fondos.some(Boolean) : fondos[i],
      ...(p.compartida && p.pieza === 'lateral' ? { fondosLaterales } : {}),
    } } : {}),
  })) }));
  const resultado = consolidarGrupo({ ...grupo, lineas }, { trm, margen });
  return { ...resultado, vars: { ...resultado.vars, n_puertas: grupo.lineas.reduce((n, l) => n + (l.vars.n_puertas ?? 0), 0) } };
}
type Tablero = TableroHdr;

/** La misma resolución para la tabla y sus exportaciones. */
export function normalizarColorHdr(valor?: string | null, heredado?: string | null): string {
  return valor?.trim() || heredado?.trim() || 'Por definir';
}

export function descripcionPiezaPlanaHdr(pref?: string | null, anotaciones?: string | null): string | undefined {
  const nota = anotaciones?.trim().replace(/[.\s]+$/, '');
  return esPanel(pref) ? nombrePanel(nota) : /^F(?:-|$)/i.test(pref ?? '') ? `F - Filler${nota ? ` ${nota}` : ''}` : undefined;
}

// Traducción del nombre interno de la pieza al nombre de producción.
const NOMBRE_PRODUCCION: [RegExp, string][] = [
  [/^lateral$/, 'SIDE'],
  [/^base$/, 'BASE'],
  [/trasero_gaveta/, 'TRASERO CAJON'],
  [/refuerzo_trasero/, 'RAIL TRASERO'],
  [/refuerzo_(delantero|horizontal)/, 'RAIL DELANTERO'],
  [/entrepano/, 'SHELF'],
  [/base_gaveta/, 'PIEZA CAJON'],
  // Caja de gaveta en madera (tipos con riel full extension, ej. B-FE).
  [/lateral_gaveta_der/, 'LAT DER GAV'],
  [/lateral_gaveta_izq/, 'LAT IZQ GAV'],
  [/^contraparche$/, 'CONTRAPARCHE'],
  [/^fondo_gaveta$/, 'FONDO GAV'],
  [/frente_gaveta/, 'FRENTE GAVETA'],
  [/frente_cajon/, 'FRENTE GAVETA'],
  [/gola_perfil/, 'GOLA'],
  [/^fondo$/, 'BACKING'],
];

function nombreProduccion(nombre: string, tienePuertas: boolean): string {
  if (nombre === 'frente') return tienePuertas ? 'DOOR' : 'FRENTE';
  for (const [re, label] of NOMBRE_PRODUCCION) if (re.test(nombre)) return label;
  return nombre.toUpperCase().replace(/_/g, ' ');
}

/** Instrucción de producción: solo cambia el texto de las piezas solicitadas. */
function nombreConInstruccion(nombre: string, pieza: string, espesor: number | null, contexto?: ContextoPiezaHdr): string {
  if (!contexto?.pref) return nombre;
  if (/(?:^|-)FE(?:-|$)/i.test(contexto.pref)) {
    const nombresFe: Record<string, string> = {
      lateral_gaveta_pequena: 'LAT GAV PEQ R13L',
      lateral_gaveta_grande: 'LAT GAV GRANDE R13L',
      contraparche_pequeno: 'CONTRAPARCHE PEQ R13L',
      contraparche_grande: 'CONTRAPARCHE GRANDE R13L',
    };
    if (nombresFe[pieza]) return nombresFe[pieza];
  }
  // Lista exacta: excluye base_gaveta, divisiones, entrepaños y refuerzos.
  if (!contexto.conFondo || !['base', 'tapa', 'base_tapa', 'lateral', 'lateral_der', 'lateral_izq'].includes(pieza)) return nombre;
  const familia = familiaMaterialPorPrefijo(contexto.pref);
  if (familia !== 'superior' && familia !== 'inferior') return nombre;
  const superior = familia === 'superior';
  const codigo = espesor === 15 ? (superior ? 'R16L' : 'R17L') : espesor === 18 ? (superior ? 'R19L' : 'R20L') : '';
  return codigo ? `${nombre} ${codigo}` : nombre;
}

// Color vs Blanco de canto: no está guardado por pieza en cot_piezas_plantilla (solo
// hay un calibre). Regla deducida cruzando la hoja de ruta real de B12: las piezas
// visibles desde afuera van en Color, las ocultas dentro de la carcasa van en Blanco.
// Es una inferencia por nombre, no un dato confirmado pieza por pieza en todo el catálogo.
function esVisible(nombre: string): boolean {
  return !/trasero|entrepano|base_gaveta|lateral_gaveta|contraparche/.test(nombre);
}

function espesorCantoLabel(calibre: string | null): string {
  if (!calibre) return '';
  // Insensible a mayúsculas: el calibre puede llegar como `19x0,45` o `19X0,45`
  // según venga de la plantilla de la pieza o del override del formulario. Con el
  // split sensible a `x` minúscula, la columna salía vacía en el segundo caso.
  return calibre.split(/x/i)[1] ?? '';
}

export type FilaHDR = {
  origen?: string;
  tableroCodigo?: string;
  letra: string;
  pieza: string;
  largoMm: number;
  anchoMm: number;
  espesorMm: number | null;
  cantoLargoColor: number;
  cantoAnchoColor: number;
  cantoLargoBlanco: number;
  cantoAnchoBlanco: number;
  espesorCanto: string;
};

export function construirFilas(res: ResultadoHdr, tableros: Tablero[], pref?: string): FilaHDR[] {
  const rolToEspesor: Record<string, number | null> = {};
  for (const m of res.maderaPorRol) {
    rolToEspesor[m.rol] = tableros.find((t) => t.codigo === m.codigo)?.espesor_mm ?? null;
  }
  const tienePuertas = (res.vars.n_puertas ?? 0) > 0;
  const contexto = pref ? { pref, conFondo: res.piezas.some(p => p.pieza === 'fondo' && p.cant > 0) } : undefined;

  const filas: FilaHDR[] = [];
  let letraIdx = 0;
  // No reiniciar en A después de Z: la letra identifica tanto la fila de React
  // como su color editable. Repetirla mezclaba los datos de piezas distintas.
  const siguienteLetra = () => indiceALetras(letraIdx++);

  for (const p of ordenarPiezasHdr(res.piezas.filter((p) => p.cant > 0), tienePuertas, pref)) {
    const nombreBase = pref === 'DB-FE' && /^trasero_gaveta/.test(p.pieza)
      ? 'TRASERO GAV'
      : nombreProduccion(p.pieza, tienePuertas);
    const visible = esVisible(p.pieza);
    const tableroCodigo = p.tableroCodigo ?? res.maderaPorRol.find(m => m.rol === p.rol)?.codigo;
    const espesor = p.tableroCodigo ? tableros.find(t => t.codigo === p.tableroCodigo)?.espesor_mm ?? null : rolToEspesor[p.rol] ?? null;
    const sinCanto = noLlevaCanto(espesor);
    const espesorCanto = sinCanto ? '' : espesorCantoLabel(p.cantoCalibre);
    const n = Math.round(p.cant);
    if (Math.abs(n - p.cant) > 0.000001) throw new Error(`La pieza ${p.pieza} tiene cantidad fraccionaria; debe generarse la HDR del grupo completo.`);
    for (let i = 0; i < n; i++) {
      const esLateralPar = p.pieza === 'lateral' && n === 2;
      const esBaseTapa = p.pieza === 'base_tapa' && n === 2;
      const esPuertaPar = p.pieza === 'frente' && tienePuertas && n === 2;
      const esEntrepanoPar = p.pieza === 'entrepano' && n > 1;
      const nombre = esLateralPar
        ? `SIDE ${i === 0 ? 'R' : 'L'}`
        : esBaseTapa
        ? (i === 0 ? 'BASE' : 'TAPA')
        : esPuertaPar
        ? `DOOR ${i === 0 ? 'R' : 'L'}`
        : esEntrepanoPar
        ? `SHELF ${i + 1}`
        : nombreBase;
      // Orientación de presentación compartida con el despiece del Simulador.
      const orientada = orientarPieza(p);
      filas.push({
        origen: p.compartida ? 'Compartida del grupo' : p.origen,
        tableroCodigo,
        letra: siguienteLetra(),
        pieza: nombreConInstruccion(nombre, p.pieza, espesor, p.contextoHdr?.fondosLaterales
          ? { ...p.contextoHdr, conFondo: p.contextoHdr.fondosLaterales[i] ?? p.contextoHdr.conFondo } : p.contextoHdr ?? contexto),
        largoMm: orientada.largoIn * 25.4,
        anchoMm: orientada.anchoIn * 25.4,
        espesorMm: espesor,
        cantoLargoColor: !sinCanto && visible ? p.cantoLargos : 0,
        cantoAnchoColor: !sinCanto && visible ? p.cantoAnchos : 0,
        cantoLargoBlanco: !sinCanto && !visible ? p.cantoLargos : 0,
        cantoAnchoBlanco: !sinCanto && !visible ? p.cantoAnchos : 0,
        espesorCanto,
      });
    }
  }
  return filas;
}

export function descripcionModulo(res: CotizarResult, pref?: string): string {
  if (esTipologiaDbFe(pref)) { const n = Math.round(res.vars.n_cajones ?? 0); return n > 0 ? `${n} GAVETA${n === 1 ? "" : "S"}` : ""; }
  const partes: string[] = [];
  const n = (k: string) => Math.round(res.vars[k] ?? 0);
  if (n('n_cajones') > 0) partes.push(`${n('n_cajones')} GAVETA${n('n_cajones') > 1 ? 'S' : ''}`);
  const puertas = puertasDescripcion(pref, res.piezas, n('n_puertas'));
  if (puertas > 0) partes.push(`${puertas} PUERTA${puertas > 1 ? 'S' : ''}`);
  const entrepanos = contarEntrepanos(res.piezas);
  if (entrepanos > 0) partes.push(`${entrepanos} ENTREPAÑO${entrepanos > 1 ? 'S' : ''}`);
  return partes.join(' ');
}

/** Nombre único compartido por la HDR, el buscador y las hojas de seguimiento. */
export function tituloModuloHdr(m: ModuloHDR): string {
  return `${m.codigoModulo} ${m.nombreDescriptivo ?? (m.ok ? descripcionModulo(m.result, m.pref) : '')}`.trim();
}


/** Solo se consolidan despieces equivalentes; el optimizador conserva sus líneas y grupos originales. */
export function consolidarModulosHdr(modulos: readonly ModuloHDR[]): ModuloHDR[] {
  const result: ModuloHDR[] = [];
  const keys = new Map<string, number>();
  for (const m of modulos) {
    const cantidad = m.cantidad * (m.repeticionesArea ?? 1);
    const origenes = m.origenes ?? [{ lineaId: m.lineaId, codigoModulo: m.codigoModulo, cantidad: m.cantidad, repeticionesArea: m.repeticionesArea ?? 1 }];
    if (!m.ok) { result.push({ ...m, cantidad, repeticionesArea: 1, origenes }); continue; }
    const key = JSON.stringify({ codigo: m.codigoModulo, descripcion: m.nombreDescriptivo ?? descripcionModulo(m.result, m.pref),
      piezas: m.result.piezas.filter(p => p.cant > 0).map(p => [p.pieza, p.rol, p.cant, p.largoIn, p.anchoIn, p.cantoLargos, p.cantoAnchos, p.cantoCalibre, p.tableroCodigo, p.origen, p.contextoHdr]).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      materiales: m.result.maderaPorRol.filter(p => p.cm2 == null || p.cm2 > 0).map(p => [p.rol, p.codigo]).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      herrajes: (m.result.herrajes ?? []).filter(h => h.cant > 0).map(h => [h.rol, h.codigo, h.cant]).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) });
    const index = keys.get(key);
    if (index === undefined) { keys.set(key, result.length); result.push({ ...m, cantidad, repeticionesArea: 1, origenes }); }
    else result[index] = { ...result[index], cantidad: result[index].cantidad + cantidad, origenes: [...(result[index].origenes ?? []), ...origenes], aperturaPendiente: result[index].aperturaPendiente || m.aperturaPendiente, avisosValidacion: [...new Set([...(result[index].avisosValidacion ?? []), ...(m.avisosValidacion ?? [])])] };
  }
  return result;
}
