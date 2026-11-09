import { normalizarBusqueda } from '@/lib/combobox-filtro';
import { descripcionModulo } from './datosHdr';
import type { ModuloHDR } from './actions';

// Consumo de los muebles de una cotización, en las unidades que compra producción:
// tablero en m², canto en metro lineal y consumibles en su unidad, SIEMPRE
// discriminados — nunca en una cifra única.
//
// Reglas, tomadas de WikiLLM/wiki/consumo_materiales.md:
//  - El tablero se calcula desde la medida NETA (`cm2`) y se le aplica el % que se
//    ingrese: NO se parte de `m2`, que ya trae la merma del proyecto (15% por
//    defecto), o se terminaría sumando merma dos veces. Por eso el campo arranca en
//    0 y, con 0, muestra el neto; escribiendo 15 reproduce exactamente la columna
//    «Cantidad» de la tabla Materiales del Simulador.
//  - El canto NO recibe ese porcentaje: su merma son 5 cm por arista (y 8 cm por
//    refuerzo), ya sumados dentro de `metros`.
//  - Todo se multiplica por la CANTIDAD DE LA FILA, que por defecto es **1** y se
//    edita en la tabla: el consumo no arrastra lo que diga la cotización (esa cifra
//    viaja solo como referencia informativa en `cantidadCotizacion`).
//  - El tablero se agrupa por **ROL + código**, con el mismo orden y las mismas
//    filas que la tabla Materiales del Simulador: caja y refuerzo comparten código
//    (`PRIRH15CONSTRUCTOR`) pero son dos filas, porque son dos partidas de compra
//    distintas en el desglose. Agruparlos por código solo hacía que Consumos no
//    cuadrase fila a fila con el Simulador.

export type ConsumoMaterial = {
  /** Rol dentro del mueble (`caja`, `refuerzo`, `frente`, `fondo`…). */
  rol: string;
  /** Código del tablero (ej. `C18`, `PRIRH15CONSTRUCTOR`). */
  codigo: string;
  /** m² netos de esa partida, de todas las unidades del mueble. */
  m2Neto: number;
  /** m² a comprar de esa partida, con el desperdicio indicado. */
  m2Tableros: number;
};

export type ConsumoCanto = {
  /** Calibre del canto con la grafía del catálogo (ej. `19x0,45`). */
  calibre: string;
  /** Metro lineal de ese calibre, de todas las unidades del mueble. */
  metros: number;
};

export type ConsumoConsumible = {
  /** Clave interna del consumible (`tarugos`, `soportes`, `carton`, `etiquetas`). */
  clave: string;
  /** Nombre para mostrar, ya pluralizado como en el Simulador. */
  nombre: string;
  /** Unidades de ese consumible para la cantidad de la fila. */
  valor: number;
};

export type ConsumoMueble = {
  /** `lineaId` del módulo; solo sirve como clave de render. */
  clave: string;
  /** Código comercial del módulo (ej. `SBFD30`, `GRUPO DB12 + DB12`). */
  codigo: string;
  /** Descripción completa del mueble (notas del panel/filler o gavetas, puertas, entrepaños). */
  descripcion: string;
  /** `codigo + descripción`, el mismo título que encabeza su tabla HDR. */
  titulo: string;
  /** Cocina/área a la que pertenece. */
  area: string;
  /** Unidades con las que se calcula el consumo (editable en la UI; por defecto 1). */
  cantidad: number;
  /** Unidades que trae la cotización: solo informativo, NUNCA es el valor por defecto. */
  cantidadCotizacion: number;
  /** Piezas físicas totales de esas unidades. */
  piezas: number;
  /** Consumo de tablero, una entrada por rol + código (igual que el Simulador). */
  materiales: ConsumoMaterial[];
  /** Consumo de canto, una entrada por calibre. */
  cantos: ConsumoCanto[];
  /** Consumibles del mueble (tarugos, soportes, cartón, etiquetas), una entrada por tipo. */
  consumibles: ConsumoConsumible[];
};

/** Orden compartido por pantalla y Excel, sin modificar las entradas originales. */
export function ordenarConsumos(filas: readonly ConsumoMueble[]): ConsumoMueble[] {
  const comparar = new Intl.Collator('es', { sensitivity: 'base', numeric: true }).compare;
  return [...filas].sort((a, b) => comparar(a.codigo, b.codigo) || comparar(a.descripcion, b.descripcion) || comparar(a.area, b.area) || comparar(a.clave, b.clave));
}

/**
 * Cantidad escrita en el input de la tabla.
 *
 * Vacío, texto o negativo vuelven al **1**, que es el valor por defecto de la fila:
 * el consumo nunca depende de lo que diga la cotización, solo de lo que se escriba
 * aquí. Un `0` explícito sí se respeta (mueble excluido del consumo).
 */
export function parseCantidad(raw: string | undefined): number {
  const texto = (raw ?? '').replace(',', '.').trim();
  if (texto === '') return 1;
  const n = Number(texto);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

/** Acepta coma decimal y acota a un porcentaje usable en planta. */
export function normalizarDesperdicio(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) return 0;
  return valor > 100 ? 100 : valor;
}

function tituloDe(m: ModuloHDR): { codigo: string; descripcion: string; titulo: string } {
  const codigo = m.codigoModulo;
  // Un módulo sin despiece (`ok: false`) no tiene `result`: se describe solo con su
  // código para que el buscador igual pueda mostrarlo y reportarlo como error.
  // `||` y no `??`: una descripción vacía tampoco debe tapar la del despiece.
  const descripcion = m.ok ? (m.nombreDescriptivo || descripcionModulo(m.result, m.pref)) || '' : '';
  return { codigo, descripcion, titulo: `${codigo} ${descripcion}`.replace(/\s+/g, ' ').trim() };
}

function coincide(texto: string, m: ModuloHDR): boolean {
  const palabras = normalizarBusqueda(texto).trim().split(/\s+/).filter(Boolean);
  if (!palabras.length) return true;
  const { titulo } = tituloDe(m);
  const heno = normalizarBusqueda(`${titulo} ${m.cocinaNombre} ${m.pref ?? ''}`);
  return palabras.every((p) => heno.includes(p));
}

/**
 * Desglose del módulo ya con la cantidad de la fila: tablero por **rol + código**,
 * canto por calibre y consumibles por tipo — en el MISMO orden y con las MISMAS
 * filas que la tabla «Materiales» del Simulador, para que ambos cuadren.
 */
function discriminar(
  m: ModuloHDR,
  cantidad: number,
  pct: number,
): { materiales: ConsumoMaterial[]; cantos: ConsumoCanto[]; consumibles: ConsumoConsumible[] } {
  if (!m.ok) return { materiales: [], cantos: [], consumibles: [] };
  const res = m.result;

  // Una fila por ROL + código, en el orden en que el motor la emite (el mismo que
  // dibuja el Simulador). Caja y refuerzo con el mismo tablero quedan en dos filas.
  const porRolCodigo = new Map<string, ConsumoMaterial>();
  for (const x of res.maderaPorRol) {
    const cm2 = Number(x.cm2 || 0);
    if (cm2 <= 0) continue;
    const m2Neto = (cm2 / 10000) * cantidad;
    const clave = `${x.rol}\u0000${x.codigo}`;
    const previa = porRolCodigo.get(clave);
    if (previa) {
      previa.m2Neto += m2Neto;
      previa.m2Tableros += m2Neto * (1 + pct);
    } else {
      porRolCodigo.set(clave, { rol: x.rol, codigo: x.codigo, m2Neto, m2Tableros: m2Neto * (1 + pct) });
    }
  }
  const materiales = [...porRolCodigo.values()];

  const porCalibre = new Map<string, number>();
  for (const c of res.cantoPorCalibre) {
    const metros = Number(c.metros || 0);
    if (metros <= 0) continue;
    porCalibre.set(c.calibre, (porCalibre.get(c.calibre) ?? 0) + metros);
  }
  const cantos: ConsumoCanto[] = [...porCalibre.entries()]
    .map(([calibre, m]) => ({ calibre, metros: m * cantidad }))
    .sort((a, b) => a.calibre.localeCompare(b.calibre));

  // Consumibles: el motor ya expone la cantidad en unidades (no el costo), que es
  // lo que pide producción. Se listan los > 0, como en el Simulador.
  const nombres: Record<string, string> = {
    tarugos: 'Tarugos', soportes: 'Soportes', carton: 'Cartón', etiquetas: 'Etiquetas',
  };
  const consumibles: ConsumoConsumible[] = Object.entries(res.cantidadesConsumibles ?? {})
    .filter(([, v]) => Number(v) > 0)
    .map(([clave, v]) => ({ clave, nombre: nombres[clave] ?? clave, valor: Number(v) * cantidad }));

  return { materiales, cantos, consumibles };
}

/**
 * Filas de consumo de los módulos cargados, filtradas por el buscador.
 *
 * `cantidades` es el mapa `lineaId → cantidad` escrito en la tabla. **Sin entrada se
 * usa 1**, nunca la cantidad de la cotización: cada fila arranca en una unidad y el
 * usuario decide cuántas contar (ver `parseCantidad`).
 *
 * Los módulos con error se excluyen del cálculo (no tienen despiece) pero se
 * reportan en `conError` para que la omisión sea visible en pantalla. El recuento
 * es sobre el conjunto ya filtrado, así que un error fuera del texto escrito no
 * aparece hasta que la búsqueda lo alcanza.
 */
export function calcularConsumos(
  modulos: readonly ModuloHDR[],
  desperdicioPct: number,
  texto = '',
  cantidades: Readonly<Record<string, number>> = {},
): { filas: ConsumoMueble[]; conError: number } {
  const pct = normalizarDesperdicio(desperdicioPct) / 100;
  const filas: ConsumoMueble[] = [];
  let conError = 0;

  for (const m of modulos) {
    if (!coincide(texto, m)) continue;
    if (!m.ok) { conError += 1; continue; }

    const res = m.result;
    const editada = cantidades[m.lineaId];
    const cantidad = editada !== undefined && Number.isFinite(editada) && editada >= 0 ? editada : 1;
    const piezasUnidad = res.piezas.reduce((s, p) => (p.cant > 0 ? s + Math.round(p.cant) : s), 0);
    const { codigo, descripcion, titulo } = tituloDe(m);
    const { materiales, cantos, consumibles } = discriminar(m, cantidad, pct);

    filas.push({
      clave: m.lineaId,
      codigo,
      descripcion,
      titulo,
      area: m.cocinaNombre,
      cantidad,
      // Lo que la cotización pediría: cantidad × repeticiones del área (en un módulo
      // ya consolidado las repeticiones son 1, así que es simplemente `cantidad`).
      cantidadCotizacion: (Number.isFinite(m.cantidad) ? m.cantidad : 1)
        * (m.repeticionesArea != null && Number.isFinite(m.repeticionesArea) ? m.repeticionesArea : 1),
      piezas: piezasUnidad * cantidad,
      materiales,
      cantos,
      consumibles,
    });
  }

  return { filas: ordenarConsumos(filas), conError };
}

/** Solo presentación: el cálculo se hace una vez por cambio de estado, no por celda. */
export const fmtM2 = (v: number) => v.toLocaleString('es-CO', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export const fmtMl = (v: number) => v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Consumibles: hasta 1 decimal, la misma grafía que usa el Simulador (cartón 1,2). */
export const fmtUnidad = (v: number) => v.toLocaleString('es-CO', { maximumFractionDigits: 1 });
