// Herrajes que de verdad lleva una cotización.
//
// La propuesta traía una lista fija —bisagras, correderas, patas, soportes,
// manijas, gola, sistema elevable, platero, zócalo, papelera— con "N/A" en los
// que no aplicaban. Eso anuncia al cliente herrajes que su proyecto no incluye y
// esconde los que sí. Ahora la lista sale del despiece de cada módulo.

export type HerrajeDeLinea = { rol?: unknown; codigo?: unknown; cant?: unknown };

export type LineaConHerrajes = {
  /** Unidades de esa línea. */
  cantidad: number;
  herrajes: readonly HerrajeDeLinea[];
};

export type HerrajePropuesta = {
  rol: string;
  codigo: string;
  /** Nombre del catálogo (`cot_herrajes.nombre`); vacío si no está registrado. */
  descripcion: string;
  cantidad: number;
};

const texto = (v: unknown) => String(v ?? '').trim();
const numero = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };

/**
 * Suma los herrajes de todas las líneas, multiplicando por las unidades de cada
 * línea y por las veces que se repite el área.
 *
 * Se agrupa por **rol + código**: el mismo rol con dos referencias distintas son
 * dos renglones, porque al cliente se le entregan las dos.
 */
export function herrajesDeLaCotizacion(
  lineas: readonly LineaConHerrajes[],
  nombrePorCodigo: Readonly<Record<string, string>> = {},
  vecesArea = 1,
): HerrajePropuesta[] {
  const porClave = new Map<string, HerrajePropuesta>();
  const veces = numero(vecesArea) || 1;

  for (const linea of lineas) {
    const unidades = numero(linea.cantidad) || 1;
    for (const h of linea.herrajes ?? []) {
      const rol = texto(h.rol);
      const codigo = texto(h.codigo);
      if (!rol && !codigo) continue;
      const cantidad = numero(h.cant) * unidades * veces;
      if (cantidad <= 0) continue;

      const clave = `${rol}|${codigo}`;
      const ya = porClave.get(clave);
      if (ya) { ya.cantidad += cantidad; continue; }
      porClave.set(clave, { rol, codigo, descripcion: nombrePorCodigo[codigo] ?? '', cantidad });
    }
  }

  return [...porClave.values()]
    .map((h) => ({ ...h, cantidad: Math.round(h.cantidad * 100) / 100 }))
    .sort((a, b) => a.rol.localeCompare(b.rol) || a.codigo.localeCompare(b.codigo));
}

/** Rol con la inicial en mayúscula, para la columna de la propuesta. */
export function etiquetaRol(rol: string): string {
  const v = texto(rol);
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : '—';
}
