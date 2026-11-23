export type ValoresCotizacion = {
  costoSinUsd: number; costoSinCop: number; costoConUsd: number; costoConCop: number;
  precioSinUsd: number; precioSinCop: number; precioConUsd: number; precioConCop: number;
};

type LineaValores = {
  cantidad?: number; precio_unit_usd?: number; precio_total_cop?: number; costo_sin_herrajes_cop?: number;
  costo_herrajes_cop?: number; costo_total_cop?: number; breakdown?: Record<string, unknown> | null;
};
type SeccionValores = { cantidad?: number; lineas?: LineaValores[] };

export function calcularValoresCotizacion(secciones: SeccionValores[], trm: number): ValoresCotizacion {
  const result: ValoresCotizacion = {
    costoSinUsd: 0, costoSinCop: 0, costoConUsd: 0, costoConCop: 0,
    precioSinUsd: 0, precioSinCop: 0, precioConUsd: 0, precioConCop: 0,
  };
  const tasa = Number(trm) > 0 ? Number(trm) : 1;
  for (const seccion of secciones) {
    const multiplicador = Math.max(1, Number(seccion.cantidad || 1));
    for (const linea of seccion.lineas ?? []) {
      const qty = Math.max(0, Number(linea.cantidad || 0)) * multiplicador;
      const b = linea.breakdown ?? {};
      const costoConCop = Number(linea.costo_total_cop ?? b.costoConHerrajes ?? 0);
      const costoSinCop = Number(linea.costo_sin_herrajes_cop ?? b.costoSinHerrajes ?? Math.max(0, costoConCop - Number(linea.costo_herrajes_cop ?? b.costoHerrajes ?? 0)));
      const precioSinUsd = Number(b.precioUsd ?? linea.precio_unit_usd ?? 0);
      const precioSinCop = Number(b.precioCop ?? precioSinUsd * tasa);
      const precioConUsd = Number(b.precioConHerrajesUsd ?? linea.precio_unit_usd ?? 0);
      const precioConCop = Number(b.precioConHerrajesCop ?? (Number(linea.precio_total_cop ?? 0) / Math.max(1, Number(linea.cantidad || 1))));
      result.costoSinCop += costoSinCop * qty;
      result.costoSinUsd += costoSinCop * qty / tasa;
      result.costoConCop += costoConCop * qty;
      result.costoConUsd += costoConCop * qty / tasa;
      result.precioSinCop += precioSinCop * qty;
      result.precioSinUsd += precioSinUsd * qty;
      result.precioConCop += precioConCop * qty;
      result.precioConUsd += precioConUsd * qty;
    }
  }
  return result;
}
