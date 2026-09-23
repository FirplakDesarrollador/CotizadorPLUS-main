import type { UnidadDim } from '@/lib/engine';

export type SistemaMedida = 'imperial' | 'metrico';

export function indiceALetras(index: number): string {
  if (!Number.isInteger(index) || index < 0) throw new Error('Índice de grupo inválido');
  let n = index + 1;
  let out = '';
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

export function letrasAIndice(value: string): number {
  const letters = value.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(letters)) throw new Error('Letra de grupo inválida');
  let n = 0;
  for (const char of letters) n = n * 26 + char.charCodeAt(0) - 64;
  return n - 1;
}

export function normalizarEtiquetaGrupo(value: string): { letra: string; posicion: number | null } {
  const clean = value.trim().toUpperCase().replace(/\s+/g, '');
  const match = /^([A-Z]+)([1-9]\d*)?$/.exec(clean);
  if (!match) throw new Error('Usa una letra de grupo, opcionalmente seguida de una posición: A, A1, A2…');
  return { letra: match[1], posicion: match[2] ? Number(match[2]) : null };
}

export function etiquetaLinea(etiquetaGrupo: string, posicion: number, cantidad: number): string {
  return cantidad > 1 ? `${etiquetaGrupo}${posicion}` : etiquetaGrupo;
}

export function convertirExacto(value: number, from: UnidadDim, to: UnidadDim): number {
  if (from === to) return value;
  const factors: Record<UnidadDim, Record<UnidadDim, number>> = {
    in: { in: 1, cm: 2.54, mm: 25.4 },
    cm: { in: 1 / 2.54, cm: 1, mm: 10 },
    mm: { in: 1 / 25.4, cm: 0.1, mm: 1 },
  };
  // Elimina ruido binario (30.479999999999997) sin redondear a una medida
  // comercial: conserva las 15 cifras significativas fiables de Number.
  return Number((value * factors[from][to]).toPrecision(15));
}

// Interpreta medidas escritas en fracción imperial (ej. "24 7/8", "24-7/8", "7/8")
// además de números planos ("24.875"). Los campos de Largo/Alto/Prof de AddLineForm
// son de texto libre justamente para permitir este formato; sin este parseo,
// Number("24 7/8") da NaN, que Supabase guarda como NULL y se lee de vuelta como 0
// (un módulo "0x0x0" con costo casi nulo en una cotización real).
export function parseMedida(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  const s = raw.trim().replace(/["”]/g, '');
  if (s === '') return NaN;
  const directo = Number(s);
  if (!Number.isNaN(directo)) return directo;
  const m = /^(\d+(?:\.\d+)?)?\s*[-\s]?\s*(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (m && Number(m[3]) > 0) {
    const entero = m[1] ? Number(m[1]) : 0;
    return entero + Number(m[2]) / Number(m[3]);
  }
  return NaN;
}

// Selecciona el precio de una línea según incluya o no herrajes. `res.precioCop`
// (del motor) NUNCA incluye herrajes, tenga o no la línea un margenOverride —
// solo `precioConHerrajesCop` (= precioCop + precioHerrajesCop) los suma. Antes
// de este fix, `cotizaciones.ts` tenía una rama "unificada" que, cuando había
// margenOverride, guardaba precioCop a secas sin importar conHerrajes: un
// módulo con herrajes y uno sin herrajes quedaban costando exactamente lo
// mismo en cualquier proyecto/línea con margen manual. Ver tests/precio-herrajes.test.ts.
export function precioUnitario(
  conHerrajes: boolean,
  res: { precioCop: number; precioUsd: number; precioConHerrajesCop: number; precioConHerrajesUsd: number },
): { cop: number; usd: number } {
  return conHerrajes
    ? { cop: res.precioConHerrajesCop, usd: res.precioConHerrajesUsd }
    : { cop: res.precioCop, usd: res.precioUsd };
}

export function anchoCodigo(value: number, unidad: UnidadDim, sistema: SistemaMedida): string {
  const target: UnidadDim = sistema === 'imperial' ? 'in' : 'cm';
  const converted = convertirExacto(value, unidad, target);
  // No redondea: solo elimina ceros de presentación introducidos por Number.
  return String(converted);
}

// La medida va inmediatamente después de la letra base, no al final del código.
// En los prefijos con sufijo separado por guion (B-FE, UB-FE, V-FE) eso significa
// insertarla antes del guion: B-FE + 12" -> `B12-FE`, no `B-FE12`.
// Los prefijos sin guion (B, SBFD, W, DB...) no cambian: la medida sigue al final,
// donde `codigoComercial()` le concatena después el alto o la tipología.
export function codigoModulo(
  pref: string,
  ancho: number,
  unidad: UnidadDim,
  sistema: SistemaMedida,
): string {
  const medida = anchoCodigo(ancho, unidad, sistema);
  const guion = pref.indexOf('-');
  if (guion === -1) return `${pref}${medida}`;
  return `${pref.slice(0, guion)}${medida}${pref.slice(guion)}`;
}

export function sufijoSistemaFrente(sistemaFrente: string | null | undefined): string {
  return sistemaFrente === 'gola' ? '-SM' : '';
}

// Los superiores de la familia W y los paneles PN incluyen el alto en el código
// (W2936 = 29 de largo, 36 de alto): a diferencia de los demás tipos su alto sí
// varía y no es un dato implícito del tipo. WCC queda fuera a propósito — es un
// módulo de clóset (categoria='closet'), no un superior de pared.
const PREFS_ALTO_EN_CODIGO = ['W', 'UW', 'OW', 'WBL', 'WER', 'WLD', 'WPC', 'PN'] as const;

export function incluyeAltoEnCodigo(pref: string | null | undefined): boolean {
  const base = String(pref ?? '').toUpperCase().split('-')[0];
  return (PREFS_ALTO_EN_CODIGO as readonly string[]).includes(base);
}

export type CodigoComercialInput = {
  pref: string;
  largo: number;
  alto: number;
  prof?: number;
  unidad: UnidadDim;
  sistema: SistemaMedida;
  sistemaFrente?: string | null;
  dbTipo?: string | null;
  pcfdCajones?: number | null;
};

// Código comercial completo de un módulo. Es la única fuente de verdad del orden
// de los segmentos: el Simulador, el formulario de cotizaciones, el recálculo que
// persiste `codigo_modulo` y el buscador de HDR deben producir exactamente la misma
// cadena para el mismo módulo. Antes cada uno lo armaba por su cuenta y divergían
// (el formulario omitía el alto: `W29-SM` en vez de `W2936-SM`).
export function codigoComercial(input: CodigoComercialInput): string {
  const { pref, largo, alto, prof, unidad, sistema } = input;
  const base = codigoModulo(pref, largo, unidad, sistema);
  const altoSufijo = incluyeAltoEnCodigo(pref) ? anchoCodigo(alto, unidad, sistema) : '';
  // Los superiores W de 24 in identifican esa profundidad en su código. La
  // comparación se hace en pulgadas para conservar la regla en cm o mm.
  const esWProf24 = String(pref).toUpperCase().split('-')[0] === 'W'
    && prof != null
    && Math.abs(convertirExacto(prof, unidad, 'in') - 24) < 0.001;
  const profSufijo = esWProf24 ? anchoCodigo(prof!, unidad, sistema) : '';
  const dbSufijo = input.dbTipo ? `-${input.dbTipo.split('-').slice(1).join('-')}` : '';
  const pcfdSufijo = Number(input.pcfdCajones) > 0 ? `-${Number(input.pcfdCajones)}OP-PUSH` : '';
  return base + altoSufijo + profSufijo + dbSufijo + pcfdSufijo + sufijoSistemaFrente(input.sistemaFrente);
}

export function codigoGrupo(codigos: string[]): string {
  return codigos.join('.');
}

export function redondearMoneda(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function distribuirResiduoMoneda(values: number[]): number[] {
  if (values.length === 0) return [];
  const target = redondearMoneda(values.reduce((sum, value) => sum + value, 0));
  let allocated = 0;
  return values.map((value, index) => {
    const rounded = index === values.length - 1
      ? redondearMoneda(target - allocated)
      : redondearMoneda(value);
    allocated = redondearMoneda(allocated + rounded);
    return rounded;
  });
}

const PASTELES = [
  'bg-blue-50/70', 'bg-emerald-50/70', 'bg-amber-50/70', 'bg-violet-50/70',
  'bg-rose-50/70', 'bg-cyan-50/70', 'bg-lime-50/70', 'bg-orange-50/70',
] as const;

export function colorGrupo(orden: number): string {
  return PASTELES[Math.abs(orden) % PASTELES.length];
}
