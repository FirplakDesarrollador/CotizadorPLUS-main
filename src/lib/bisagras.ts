type PiezaPuerta = { pieza: string; cant: number; anchoIn: number };
// El despiece persistido expresa pulgadas con seis decimales.
const TOLERANCIA_MM = 0.0000005 * 25.4 + 1e-9;

/** El eje ancho del despiece de puertas corresponde al alto de fabricación. */
export function cantidadBisagras(
  piezas: readonly PiezaPuerta[],
  codigo: string | null,
  cantidadPlantilla: number,
): number {
  if (cantidadPlantilla <= 0) return cantidadPlantilla;
  let puertas = 0;
  let fueraDeRango = 0;
  let bisagras = 0;
  for (const pieza of piezas) {
    if (!/^(?:puerta(?:_|$)|frente(?:_izq|_der|_canto_puertas_op)?$)/i.test(pieza.pieza) || !(pieza.cant > 0)) continue;
    const altoMm = pieza.anchoIn * 25.4;
    puertas += pieza.cant;
    if (!(altoMm > 0) || altoMm > 2400 + TOLERANCIA_MM) {
      fueraDeRango += pieza.cant;
      continue;
    }
    const porPuerta = altoMm <= 1200 + TOLERANCIA_MM ? 2 : altoMm <= 1800 + TOLERANCIA_MM ? 3 : 5;
    bisagras += pieza.cant * porPuerta;
  }
  if (puertas === fueraDeRango) return cantidadPlantilla;
  const unidadesPorReferencia = codigo === 'BISAGRAPAR' ? 2 : 1;
  return bisagras / unidadesPorReferencia + cantidadPlantilla * fueraDeRango / puertas;
}
