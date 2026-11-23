import { calcularMueble, type CalcInput } from '@/lib/engine';
import { contarEntrepanos } from '@/lib/muebles';

/** Contrasta la selección persistida con las reglas, sin reemplazar personalizaciones. */
export function validarEntrepanosHdr(calc: CalcInput): string[] {
  if (calc.overrides?.n_entrepanos == null) return [];
  const overrides = { ...calc.overrides };
  delete overrides.n_entrepanos;
  const guardados = contarEntrepanos(calcularMueble(calc).piezas);
  const esperados = contarEntrepanos(calcularMueble({ ...calc, overrides }).piezas);
  return guardados === esperados ? [] : [
    `Entrepaños: la configuración guardada genera ${guardados}; las reglas actuales para estas medidas generan ${esperados}. Revisa la cantidad en la cotización o confirma que la diferencia es intencional.`,
  ];
}

export function exigirRevisionHdr(modulos: readonly { avisosValidacion?: string[]; aperturaPendiente?: boolean }[], confirmado: boolean): void {
  if (modulos.some(m => m.aperturaPendiente)) throw new Error('Completa la apertura L/R de los muebles de una puerta en la cotización antes de exportar las HDR.');
  if (!confirmado && modulos.some(m => m.avisosValidacion?.length)) {
    throw new Error('Hay diferencias entre las HDR y las reglas actuales. Revisa los avisos y confirma las cantidades antes de exportar.');
  }
}
