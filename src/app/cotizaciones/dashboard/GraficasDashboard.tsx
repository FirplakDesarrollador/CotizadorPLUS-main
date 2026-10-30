'use client';
import { puntosSerie, escalaLineal, type DistribucionDashboard, type ResumenDashboard } from '@/lib/dashboard-cotizaciones';

const compacto = (v: number) => new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
const cantidad = (v: number) => v.toLocaleString('es-CO');

function TrazoMensual({ datos, movil = false }: { datos: ResumenDashboard['mensual']; movil?: boolean }) {
  const ancho = movil ? 360 : 720, alto = movil ? 200 : 220, margen = movil ? 64 : 48;
  const puntos = puntosSerie(datos.map(m => Number(m.valor)), ancho, alto, margen);
  const min = Math.min(0, ...datos.map(m => Number(m.valor)));
  const max = Math.max(1, ...datos.map(m => Number(m.valor)));
  const y = escalaLineal([min, max], [alto - 32, 16]);
  return <svg viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Valor total COP por mes" className={`w-full text-slate-500 ${movil ? 'sm:hidden' : 'hidden sm:block'}`}>
    <title>Valor total COP por mes, con los filtros seleccionados</title>
    {[0, 1, 2, 3, 4].map(i => { const valor = min + (max - min) * i / 4; return <g key={i}><line x1={margen} x2={ancho - 20} y1={y(valor)} y2={y(valor)} stroke="#e2e8f0"/><text x={margen - 8} y={y(valor) + 3} textAnchor="end" fontSize="10" fill="currentColor">{compacto(valor)}</text></g>; })}
    <polyline points={puntos.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#334155" strokeWidth="2.5" strokeLinejoin="round"/>
    {puntos.map((p, i) => <g key={datos[i].mes}><circle cx={p.x} cy={p.y} r="4" fill="#334155"><title>{`${datos[i].mes}: ${cantidad(p.valor)} COP · ${datos[i].cantidad} cotizaciones`}</title></circle>{(!movil || i % 2 === 1) && <text x={p.x} y={alto - 9} textAnchor="middle" fontSize={movil ? 10 : 9} fill="currentColor">{new Date(`${datos[i].mes}-15T12:00:00Z`).toLocaleDateString('es-CO', { month: 'short', year: '2-digit', timeZone: 'UTC' })}</text>}</g>)}
  </svg>;
}

export function LineaMensual({ datos }: { datos: ResumenDashboard['mensual'] }) {
  return <><TrazoMensual datos={datos}/><TrazoMensual datos={datos} movil/></>;
}

export function BarrasDashboard({ datos, titulo }: { datos: DistribucionDashboard[]; titulo: string }) {
  if (!datos.length) return <p className="py-12 text-center text-sm text-slate-400">Sin cotizaciones para los filtros seleccionados.</p>;
  const alto = Math.max(120, datos.length * 34);
  const escala = escalaLineal([0, Math.max(1, ...datos.map(d => Number(d.cantidad)))], [0, 250]);
  return <svg viewBox={`0 0 440 ${alto}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={titulo} className="w-full">
    <title>{titulo}</title>
    {datos.map((d, i) => <g key={d.etiqueta} transform={`translate(0,${i * 34 + 10})`}><title>{`${d.etiqueta}: ${cantidad(Number(d.cantidad))} cotizaciones`}</title><text x="0" y="15" fontSize="11" fill="#475569">{d.etiqueta.length > 20 ? `${d.etiqueta.slice(0, 19)}…` : d.etiqueta}</text><rect x="145" y="1" width="250" height="20" rx="4" fill="#f1f5f9"/><rect x="145" y="1" width={escala(Number(d.cantidad))} height="20" rx="4" fill={i === 0 ? '#334155' : '#94a3b8'}/><text x="435" y="15" textAnchor="end" fontSize="11" fill="#334155">{cantidad(Number(d.cantidad))}</text></g>)}
  </svg>;
}

export function DistribucionEmpresas({ datos }: { datos: DistribucionDashboard[] }) {
  const total = datos.reduce((s, d) => s + Number(d.cantidad), 0);
  if (!total) return <p className="py-12 text-center text-sm text-slate-400">Sin cotizaciones para los filtros seleccionados.</p>;
  const colores = ['#334155', '#94a3b8'];
  return <div><svg viewBox="0 0 440 56" role="img" aria-label="Distribución FIRPLAK y CEMA" className="w-full"><title>Cotizaciones FIRPLAK y CEMA</title>{datos.map((d, i) => {
    const ancho = Number(d.cantidad) / total * 440;
    const x = datos.slice(0, i).reduce((suma, fila) => suma + Number(fila.cantidad), 0) / total * 440;
    return <g key={d.etiqueta}><title>{`${d.etiqueta}: ${cantidad(Number(d.cantidad))} (${(ancho / 440 * 100).toFixed(1)}%)`}</title><rect x={x} y="8" width={ancho} height="32" fill={colores[i % 2]}/>{ancho > 40 && <text x={x + ancho / 2} y="29" textAnchor="middle" fontSize="12" fill="white">{cantidad(Number(d.cantidad))}</text>}</g>;
  })}</svg><div className="mt-2 flex flex-wrap gap-5 text-xs text-slate-600">{datos.map((d, i) => <span key={d.etiqueta} className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colores[i % 2] }}/>{d.etiqueta} · {(Number(d.cantidad) / total * 100).toFixed(1)}%</span>)}</div></div>;
}
