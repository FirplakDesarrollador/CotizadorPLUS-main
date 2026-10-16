// IVA colombiano sobre la cotización.
//
// Solo se liquida cuando el proyecto se cotiza en **pesos**: una venta en dólares
// es exportación y sale sin IVA. Por eso la regla es por moneda y no un
// interruptor aparte que alguien pueda dejar mal puesto.

/** Tarifa general en Colombia. */
export const IVA_COLOMBIA = 0.19;

export type MonedaCotizacion = 'USD' | 'COP';

export function aplicaIva(moneda: MonedaCotizacion): boolean {
  return moneda === 'COP';
}

/** Valor del IVA sobre una base. Devuelve 0 para bases no válidas o negativas. */
export function calcularIva(base: number, tarifa: number = IVA_COLOMBIA): number {
  if (!Number.isFinite(base) || base <= 0) return 0;
  return base * tarifa;
}

export function totalConIva(base: number, tarifa: number = IVA_COLOMBIA): number {
  if (!Number.isFinite(base)) return 0;
  return base + calcularIva(base, tarifa);
}

/** Etiqueta de la fila, con la tarifa a la vista: "IVA 19%". */
export function etiquetaIva(tarifa: number = IVA_COLOMBIA): string {
  return `IVA ${Math.round(tarifa * 1000) / 10}%`;
}
