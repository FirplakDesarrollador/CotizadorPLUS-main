/** HOOD de estas familias descuenta altura; W-MO-HOOD conserva su regla propia. */
export function usaHoodSm(pref: string | null | undefined): boolean {
  return /^(TW|W)-SM-HOOD$/.test(String(pref ?? '').trim().toUpperCase());
}

/** Las dos medidas deben estar expresadas en la misma unidad. */
export function validarHoodSm(alto: number, hood: number | undefined, free: number | undefined): { altoCarcasa: number; altoFrenteFalsoBajoCarcasa: number } {
  if (hood == null || !Number.isFinite(hood) || hood < 0 || !Number.isFinite(alto) || hood >= alto) {
    throw new Error('HOOD es obligatorio, debe ser mayor o igual a cero y menor que Alto.');
  }
  if (free == null || !Number.isFinite(free) || free < 0 || free > hood) {
    throw new Error('FREE es obligatorio, debe ser mayor o igual a cero y no superar HOOD. Parte visible del extractor.');
  }
  return { altoCarcasa: alto - hood, altoFrenteFalsoBajoCarcasa: hood - free };
}
