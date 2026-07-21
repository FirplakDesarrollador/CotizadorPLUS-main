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

export function anchoCodigo(value: number, unidad: UnidadDim, sistema: SistemaMedida): string {
  const target: UnidadDim = sistema === 'imperial' ? 'in' : 'cm';
  const converted = convertirExacto(value, unidad, target);
  // No redondea: solo elimina ceros de presentación introducidos por Number.
  return String(converted);
}

export function codigoModulo(
  pref: string,
  ancho: number,
  unidad: UnidadDim,
  sistema: SistemaMedida,
): string {
  return `${pref}${anchoCodigo(ancho, unidad, sistema)}`;
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
