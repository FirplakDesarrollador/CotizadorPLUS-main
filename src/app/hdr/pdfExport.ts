// Tamaño carta (8.5x11in) en mm, y margen de impresión razonable a cada lado.
const CARTA_ANCHO_MM = 215.9;
const CARTA_ALTO_MM = 279.4;
const MARGEN_MM = 10;

// Exporta un nodo del DOM (la tarjeta de una hoja HDR) a un PDF independiente,
// como una imagen del nodo tal cual se ve en pantalla -- mismo look, mismo logo,
// mismos estilos, sin tener que redibujar la tabla a mano en el PDF.
// html2canvas-pro (no el html2canvas original) porque Tailwind v4 pinta con
// colores oklch() y el html2canvas clasico no los sabe parsear.
//
// La página siempre es tamaño carta (no un tamaño a medida del contenido): la tabla
// HDR es ancha (11 columnas), así que se ajusta en orientación horizontal si el
// contenido es más ancho que alto, o vertical si no, y se escala para llenar la
// página respetando el margen y sin deformar la proporción original.
export async function exportarNodoAPdf(el: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');
  // 96dpi (estandar CSS) -> mm, y /2 por el scale:2 usado arriba (mas nitidez sin agrandar la imagen).
  const pxToMm = (px: number) => (px / 2) * 0.264583;
  const contenidoAnchoMm = pxToMm(canvas.width);
  const contenidoAltoMm = pxToMm(canvas.height);

  const horizontal = contenidoAnchoMm >= contenidoAltoMm;
  const paginaAnchoMm = horizontal ? CARTA_ALTO_MM : CARTA_ANCHO_MM;
  const paginaAltoMm = horizontal ? CARTA_ANCHO_MM : CARTA_ALTO_MM;
  const disponibleAnchoMm = paginaAnchoMm - 2 * MARGEN_MM;
  const disponibleAltoMm = paginaAltoMm - 2 * MARGEN_MM;

  const escala = Math.min(disponibleAnchoMm / contenidoAnchoMm, disponibleAltoMm / contenidoAltoMm);
  const finalAnchoMm = contenidoAnchoMm * escala;
  const finalAltoMm = contenidoAltoMm * escala;
  const x = (paginaAnchoMm - finalAnchoMm) / 2;
  const y = (paginaAltoMm - finalAltoMm) / 2;

  const doc = new jsPDF({
    orientation: horizontal ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'letter',
  });
  doc.addImage(imgData, 'PNG', x, y, finalAnchoMm, finalAltoMm);
  doc.save(filename);
}

const REEMPLAZOS: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n', Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ñ: 'N',
};

export function nombreArchivoPdf(titulo: string): string {
  const sinAcentos = titulo.split('').map((ch) => REEMPLAZOS[ch] ?? ch).join('');
  const slug = sinAcentos
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return `HDR_${slug || 'modulo'}.pdf`;
}
