export type ParametrosDashboard = Record<string, string | string[] | undefined>;
export const ORDEN_DASHBOARD = { fecha: 'created_at', nombre: 'nombre', cliente: 'cliente_nombre', pais: 'pais', cotizado: 'cotizador_por', estado: 'estado', cop: 'total_cop', usd: 'total_usd' } as const;
export type FiltrosDashboard = {
  rango: '7' | '30' | 'anio' | 'personalizado'; desde: string; hasta: string;
  pais: string; mes: string; anio: string; cotizador: string; estado: string; q: string;
  orden: keyof typeof ORDEN_DASHBOARD; direccion: 'asc' | 'desc'; pagina: number; tamano: 25 | 50 | 100;
};
const valor = (p: ParametrosDashboard, key: string) => (Array.isArray(p[key]) ? p[key]![0] : p[key] ?? '') as string;
export function fechaBogota(fecha = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(fecha);
  const parte = (tipo: string) => partes.find(p => p.type === tipo)!.value;
  return `${parte('year')}-${parte('month')}-${parte('day')}`;
}
export function desplazarDia(fecha: string, dias: number) {
  const d = new Date(`${fecha}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString().slice(0, 10);
}
function fechaValida(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  if (Number(s.slice(0, 4)) < 1900 || Number(s.slice(0, 4)) > 9998) return false;
  const n = Date.parse(`${s}T00:00:00Z`);
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === s;
}
export function normalizarFiltrosDashboard(params: ParametrosDashboard, ahora = new Date()): FiltrosDashboard {
  const hoy = fechaBogota(ahora);
  const raw = valor(params, 'rango');
  const rango = (['7', '30', 'anio', 'personalizado'].includes(raw) ? raw : '30') as FiltrosDashboard['rango'];
  let desde = rango === 'anio' ? `${hoy.slice(0, 4)}-01-01` : desplazarDia(hoy, rango === '7' ? -6 : -29);
  let hasta = hoy;
  if (rango === 'personalizado') {
    if (fechaValida(valor(params, 'desde'))) desde = valor(params, 'desde');
    if (fechaValida(valor(params, 'hasta'))) hasta = valor(params, 'hasta');
    if (desde > hasta) [desde, hasta] = [hasta, desde];
  }
  const mes = valor(params, 'mes'), anio = valor(params, 'anio'), orden = valor(params, 'orden');
  const tamano = Number(valor(params, 'tamano'));
  return { rango, desde, hasta, pais: valor(params, 'pais').trim().slice(0, 100),
    mes: /^(?:[1-9]|1[0-2])$/.test(mes) ? mes : '', anio: /^\d{4}$/.test(anio) && Number(anio) >= 1900 ? anio : '',
    cotizador: ['FIRPLAK', 'CEMA'].includes(valor(params, 'cotizador')) ? valor(params, 'cotizador') : '',
    estado: valor(params, 'estado').trim().slice(0, 60), q: valor(params, 'q').trim().slice(0, 120),
    orden: Object.hasOwn(ORDEN_DASHBOARD, orden) ? orden as FiltrosDashboard['orden'] : 'fecha', direccion: valor(params, 'direccion') === 'asc' ? 'asc' : 'desc',
    pagina: Math.max(1, Math.min(1000000, Math.floor(Number(valor(params, 'pagina'))) || 1)), tamano: [25, 50, 100].includes(tamano) ? tamano as FiltrosDashboard['tamano'] : 25 };
}
export function argumentosDashboard(f: FiltrosDashboard) {
  return { p_desde: `${f.desde}T00:00:00-05:00`, p_hasta: `${desplazarDia(f.hasta, 1)}T00:00:00-05:00`, p_pais: f.pais || null,
    p_mes: f.mes ? Number(f.mes) : null, p_anio: f.anio ? Number(f.anio) : null, p_empresa: f.cotizador || null, p_estado: f.estado || null, p_busqueda: f.q || null };
}
/** Congela la ventana que el usuario está viendo, incluso si descarga después de medianoche. */
export function filtrosDashboardExportacion(params: ParametrosDashboard, ahora = new Date()) {
  return normalizarFiltrosDashboard({ ...params, rango: 'personalizado' }, ahora);
}
/** Conserva visible un filtro compartido aunque su último registro ya no exista. */
export function opcionesFiltro(opciones: readonly string[], seleccion: string): readonly string[] {
  return seleccion && !opciones.includes(seleccion) ? [...opciones, seleccion] : opciones;
}
export function enlaceDashboard(f: FiltrosDashboard, patch: Partial<FiltrosDashboard> = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...f, ...patch })) if (v !== '') params.set(k, String(v));
  return `/cotizaciones/dashboard?${params}`;
}
export function variacionPorcentual(actual: number, anterior: number): number | null {
  return anterior === 0 ? (actual === 0 ? 0 : null) : (actual - anterior) / anterior * 100;
}
export function escalaLineal(dominio: readonly [number, number], rango: readonly [number, number]) {
  const [min, max] = dominio;
  return (valor: number) => max === min ? (rango[0] + rango[1]) / 2 : rango[0] + (valor - min) / (max - min) * (rango[1] - rango[0]);
}
export function puntosSerie(valores: readonly number[], ancho = 720, alto = 220, margenIzquierdo = 48) {
  const x = escalaLineal([0, Math.max(1, valores.length - 1)], [margenIzquierdo, ancho - 20]);
  const y = escalaLineal([Math.min(0, ...valores), Math.max(1, ...valores)], [alto - 32, 16]);
  return valores.map((valor, i) => ({ x: x(i), y: y(valor), valor }));
}
export type FilaDashboard = { id: string; codigo: string | null; nombre: string | null; cliente_nombre: string | null; comprador_nombre: string | null; pais: string; ciudad: string | null; cotizador_por: 'FIRPLAK' | 'CEMA'; estado: string; total_cop: number; total_usd: number; created_at: string; fecha_local: string };
export type DistribucionDashboard = { etiqueta: string; cantidad: number };
export type ResumenDashboard = { total: number; cop: number; usd: number; ticketCop: number; ticketUsd: number; borradores: number; enviadasCerradas: number; mesActual: number; mesAnterior: number; mensual: { mes: string; valor: number; cantidad: number }[]; paises: DistribucionDashboard[]; empresas: DistribucionDashboard[]; estados: DistribucionDashboard[] };
