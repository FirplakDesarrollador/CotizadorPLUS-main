import type { PanelVisual } from './visualizacion';

/** Contorno físico YZ: el mecanizado intermedio no elimina la esquina superior. */
export function contornoLateral(p: PanelVisual, opening = 0, drawer = ''): number[][] {
  const recortes = p.recortes ?? (p.recorte ? [p.recorte] : []);
  const dy = p.cajon && p.cajon === drawer ? -opening : 0;
  const y0 = p.y + dy, y1 = y0 + p.d, z0 = p.z, z1 = z0 + p.h;
  const cortes = recortes.map(recorte => {
    const inicio = recorte.borde === 'frontal_superior' ? p.h - recorte.alto : recorte.z ?? 0;
    return { y: y0 + recorte.profundidad, inicio: z0 + inicio, fin: z0 + inicio + recorte.alto };
  }).sort((a, b) => b.fin - a.fin);
  const outline = [[p.x, y0, z0], [p.x, y1, z0], [p.x, y1, z1]];
  if (!cortes.length || cortes[0].fin < z1 - .01) outline.push([p.x, y0, z1]);
  let cursor = z1;
  for (const corte of cortes) {
    if (corte.fin > cursor + .01) continue;
    if (cursor > corte.fin) outline.push([p.x, y0, corte.fin]);
    outline.push([p.x, corte.y, corte.fin], [p.x, corte.y, corte.inicio], [p.x, y0, corte.inicio]);
    cursor = corte.inicio;
  }
  if (cursor > z0) outline.push([p.x, y0, z0]);
  return outline;
}
