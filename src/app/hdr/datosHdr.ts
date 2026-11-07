import type { CotizarResult } from '@/lib/cotizar';
import { orientarPieza, esTipologiaDbFe, puertasDescripcion } from '@/lib/muebles';
import { indiceALetras } from '@/lib/module-groups';
import { ordenarPiezasHdr } from './ordenPiezas';
import type { ModuloHDR } from './actions';
import { esPanel, nombrePanel } from '@/lib/nombres-modulos';
import { noLlevaCanto } from '@/lib/cantos';
export type TableroHdr = { codigo: string; espesor_mm: number | null };
type Tablero = TableroHdr;

export function descripcionPiezaPlanaHdr(pref?: string | null, anotaciones?: string | null): string | undefined {
  const nota = anotaciones?.trim().replace(/[.\s]+$/, '');
  return esPanel(pref) ? nombrePanel(nota) : /^F(?:-|$)/i.test(pref ?? '') ? `F - Filler${nota ? ` ${nota}` : ''}` : undefined;
}

// Traducción del nombre interno de la pieza al nombre de producción. No se pudieron
// reproducir los sufijos de código de riel/bisagra de la hoja real (ej. "R17L762"):
// no hay dato en la app para derivarlos, así que se omiten.
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

export function construirFilas(res: CotizarResult, tableros: Tablero[]): FilaHDR[] {
  const rolToEspesor: Record<string, number | null> = {};
  for (const m of res.maderaPorRol) {
    rolToEspesor[m.rol] = tableros.find((t) => t.codigo === m.codigo)?.espesor_mm ?? null;
  }
  const tienePuertas = (res.vars.n_puertas ?? 0) > 0;

  const filas: FilaHDR[] = [];
  let letraIdx = 0;
  // No reiniciar en A después de Z: la letra identifica tanto la fila de React
  // como su color editable. Repetirla mezclaba los datos de piezas distintas.
  const siguienteLetra = () => indiceALetras(letraIdx++);

  for (const p of ordenarPiezasHdr(res.piezas.filter((p) => p.cant > 0), tienePuertas)) {
    const nombreBase = nombreProduccion(p.pieza, tienePuertas);
    const visible = esVisible(p.pieza);
    const sinCanto = noLlevaCanto(rolToEspesor[p.rol]);
    const espesorCanto = sinCanto ? '' : espesorCantoLabel(p.cantoCalibre);
    const n = Math.round(p.cant);
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
        letra: siguienteLetra(),
        pieza: nombre,
        largoMm: orientada.largoIn * 25.4,
        anchoMm: orientada.anchoIn * 25.4,
        espesorMm: rolToEspesor[p.rol] ?? null,
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
  if (!/^BOV(?:-|$)/.test(pref ?? '') && n('n_entrepanos') > 0) partes.push(`${n('n_entrepanos')} ENTREPAÑO${n('n_entrepanos') > 1 ? 'S' : ''}`);
  return partes.join(' ');
}


/** Solo se consolidan despieces equivalentes; el optimizador conserva sus líneas y grupos originales. */
export function consolidarModulosHdr(modulos: readonly ModuloHDR[]): ModuloHDR[] {
  const result: ModuloHDR[] = [];
  const keys = new Map<string, number>();
  for (const m of modulos) {
    const cantidad = m.cantidad * (m.repeticionesArea ?? 1);
    if (!m.ok) { result.push({ ...m, cantidad }); continue; }
    const key = JSON.stringify({ codigo: m.codigoModulo, descripcion: m.nombreDescriptivo ?? descripcionModulo(m.result, m.pref),
      piezas: m.result.piezas.map(p => [p.pieza, p.rol, p.cant, p.largoIn, p.anchoIn, p.cantoLargos, p.cantoAnchos, p.cantoCalibre]),
      materiales: m.result.maderaPorRol.map(p => [p.rol, p.codigo]).sort((a,b) => a[0].localeCompare(b[0])) });
    const index = keys.get(key);
    if (index === undefined) { keys.set(key, result.length); result.push({ ...m, cantidad }); }
    else result[index] = { ...result[index], cantidad: result[index].cantidad + cantidad };
  }
  return result;
}
