import type { FormatoLamina } from './config';

type Medida = { largoMm: number; anchoMm: number };
export type MedidaCorte = Medida & { medidaConRefilado?: Medida };

/** Si una medida coincide con el lado bruto de la lámina, contiene los dos refilos de ese eje. */
export function medidaParaCorte(pieza: Medida, formato: FormatoLamina, refiladoMm: number, girable: boolean): MedidaCorte | null {
  const margen = 2 * refiladoMm;
  function ajustar(limiteLargo: number, limiteAncho: number): MedidaCorte | null {
    const ajustarEje = (medida: number, limite: number) => margen > 0 && Math.abs(medida - limite) <= 0.05 ? limite - margen : medida;
    const largoMm = ajustarEje(pieza.largoMm, limiteLargo);
    const anchoMm = ajustarEje(pieza.anchoMm, limiteAncho);
    if (!(largoMm > 0 && anchoMm > 0 && largoMm <= limiteLargo - margen && anchoMm <= limiteAncho - margen)) return null;
    return largoMm !== pieza.largoMm || anchoMm !== pieza.anchoMm
      ? { largoMm, anchoMm, medidaConRefilado: { largoMm: pieza.largoMm, anchoMm: pieza.anchoMm } }
      : { largoMm, anchoMm };
  }
  const directa = ajustar(formato.largoMm, formato.anchoMm);
  if (directa && !directa.medidaConRefilado) return directa;
  const girada = girable ? ajustar(formato.anchoMm, formato.largoMm) : null;
  return girada && !girada.medidaConRefilado ? girada : directa ?? girada;
}

export function areaConSierra(pieza: Medida, formato: FormatoLamina, refiladoMm: number, discoMm: number): number {
  const largoUtil = formato.largoMm - 2 * refiladoMm;
  const anchoUtil = formato.anchoMm - 2 * refiladoMm;
  const lado = (medida: number) => medida === largoUtil || medida === anchoUtil ? medida : medida + discoMm;
  return lado(pieza.largoMm) * lado(pieza.anchoMm);
}
