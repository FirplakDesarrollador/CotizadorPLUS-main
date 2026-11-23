import type { FilaDashboard } from './dashboard-cotizaciones';

function celdaTexto(valor: string | null) {
  const texto = valor ?? '';
  const seguro = /^[\s]*[=+@-]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
}
const celdaNumero = (v: number) => `"${String(Number(v)).replace('.', ',')}"`;

export function normalizarBomCsv(csv: string): string {
  return `\uFEFF${csv.replace(/^\uFEFF/, '')}`;
}

/** Excel en español: BOM, separador ;, CRLF y neutralización de fórmulas en texto libre. */
export function construirDashboardCsv(filas: readonly FilaDashboard[]): string {
  const cabecera = ['Fecha', 'Código', 'Nombre', 'Cliente', 'Comprador', 'País', 'Ciudad', 'Cotizado por', 'Estado', 'Total COP', 'Total USD'].map(celdaTexto).join(';');
  const lineas = filas.map(fila => [fila.fecha_local, fila.codigo, fila.nombre, fila.cliente_nombre, fila.comprador_nombre, fila.pais, fila.ciudad, fila.cotizador_por, fila.estado].map(celdaTexto).concat([celdaNumero(fila.total_cop), celdaNumero(fila.total_usd)]).join(';'));
  return normalizarBomCsv(`${[cabecera, ...lineas].join('\r\n')}\r\n`);
}
