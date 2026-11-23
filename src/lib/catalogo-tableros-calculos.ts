export type FormatoAnchoAlto = {
  anchoCm: number;
  altoCm: number;
};

const FORMATO_CM = /^\s*(\d+(?:[.,]\d+)?)\s*[xX]\s*(\d+(?:[.,]\d+)?)\s*$/;

function numeroValido(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const numero = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numero) ? numero : null;
}

function redondear(value: number, decimales: number): number {
  const factor = 10 ** decimales;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function parseFormatoAnchoAlto(formato: string): FormatoAnchoAlto | null {
  const match = formato.match(FORMATO_CM);
  if (!match) return null;

  const anchoCm = Number(match[1].replace(',', '.'));
  const altoCm = Number(match[2].replace(',', '.'));
  if (!Number.isFinite(anchoCm) || !Number.isFinite(altoCm) || anchoCm <= 0 || altoCm <= 0) return null;

  return { anchoCm, altoCm };
}

export function calcAreaM2(formato: string): number | null {
  const medidas = parseFormatoAnchoAlto(formato);
  if (!medidas) return null;
  return redondear((medidas.anchoCm / 100) * (medidas.altoCm / 100), 4);
}

export function calcPrecioM2(precio: unknown, areaM2: unknown): number | null {
  const precioNumero = numeroValido(precio);
  const areaNumero = numeroValido(areaM2);
  if (precioNumero === null || areaNumero === null || areaNumero <= 0) return null;
  return redondear(precioNumero / areaNumero, 2);
}

export function calcPrecio(precioM2: unknown, areaM2: unknown): number | null {
  const precioM2Numero = numeroValido(precioM2);
  const areaNumero = numeroValido(areaM2);
  if (precioM2Numero === null || areaNumero === null || areaNumero <= 0) return null;
  return redondear(precioM2Numero * areaNumero, 2);
}
