export const PAISES_COTIZACION = ['Colombia', 'Estados Unidos', 'México', 'Ecuador', 'Perú', 'Panamá', 'Costa Rica', 'Chile', 'República Dominicana', 'Guatemala', 'España', 'Venezuela', 'Argentina', 'Brasil'];

export function normalizarUbicacion(pais: string, ciudad?: string | null) {
  const limpio = pais.trim().replace(/\s+/g, ' ');
  if (!limpio || limpio.length > 100) throw new Error('Indica un país de entre 1 y 100 caracteres.');
  const nombre = PAISES_COTIZACION.find(p => p.localeCompare(limpio, 'es', { sensitivity: 'base' }) === 0) ?? limpio;
  const ciudadLimpia = ciudad?.trim().replace(/\s+/g, ' ') || null;
  if (ciudadLimpia && ciudadLimpia.length > 160) throw new Error('La ciudad no puede superar 160 caracteres.');
  return { pais: nombre, ciudad: ciudadLimpia };
}
