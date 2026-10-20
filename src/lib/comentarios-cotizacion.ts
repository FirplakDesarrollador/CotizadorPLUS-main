export type ComentarioCotizacion = {
  id: string;
  texto: string;
  creadoPor: string;
  creadoEn: string;
};

export function parseComentariosCotizacion(raw: unknown): ComentarioCotizacion[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is ComentarioCotizacion => {
      if (!item || typeof item !== 'object') return false;
      const comentario = item as Partial<ComentarioCotizacion>;
      return typeof comentario.id === 'string'
        && typeof comentario.texto === 'string'
        && typeof comentario.creadoPor === 'string'
        && typeof comentario.creadoEn === 'string';
    });
  } catch {
    return [];
  }
}

export function estadoRequiereAlertaComentario(estado: string) {
  const normalizado = estado.trim().toLowerCase();
  return normalizado === 'enviada' || normalizado === 'aprobada';
}

export const ALERTA_COMENTARIO = 'Esta cotización está Enviada o Aprobada. Antes de continuar, verifica si debes agregar un comentario para dejar registro en esta versión. ¿Deseas continuar?';
