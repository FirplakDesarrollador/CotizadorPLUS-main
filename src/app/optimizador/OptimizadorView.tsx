'use client';
import { useMemo, useState, type ReactNode } from 'react';
import Combobox from '@/components/Combobox';
import Campo from '@/components/Campo';
import type { CotizacionHeader } from '@/lib/cotizaciones';
import {
  CRITERIOS, dimsDesdeCodigoFormato, normalizarConfig, normalizarFormato,
  type ConfigOptimizador, type CriterioOptimizacion,
} from '@/lib/corte/config';
import { construirListaCorte, type TableroInfo } from '@/lib/corte/lista';
import { planDiarioDeCorte, type PlanDiario } from '@/lib/corte/plan-diario';
import { planDeCorte, type PlanCorte } from '@/lib/corte/plan-corte';
import EsquemasCorte from './EsquemasCorte';
import { guardarConfigOptimizadorAction, proyectoDesdeCotizacionAction, type ProyectoOptimizador } from './actions';

const fmt = (n: number | null | undefined, d = 0) =>
  n == null || !Number.isFinite(n) ? '—' : n.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

function Seccion({ titulo, nota, children, accion }: { titulo: string; nota?: string; children: ReactNode; accion?: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">{titulo}</h2>
          {nota && <p className="text-xs text-slate-500 mt-0.5">{nota}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, valor, detalle, oscuro }: { label: string; valor: string; detalle?: string; oscuro?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${oscuro ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <p className={`text-xs ${oscuro ? 'text-slate-300' : 'text-slate-500'}`}>{label}</p>
      <p className="text-xl font-semibold">{valor}</p>
      {detalle && <p className={`text-[11px] mt-0.5 ${oscuro ? 'text-slate-300' : 'text-slate-500'}`}>{detalle}</p>}
    </div>
  );
}

const th = 'px-2 py-1.5 text-left text-xs font-medium text-slate-500 border-b border-slate-200 whitespace-nowrap';
const td = 'px-2 py-1.5 text-sm text-slate-800 border-b border-slate-100';
const tdNum = `${td} text-right tabular-nums`;

// Qué se corta cada día: módulos y unidades, agrupados por tablero para cambiar de
// material lo menos posible en la seccionadora. El día se reparte en cuanto deja de
// caber una unidad más, así que ninguna jornada pasa del ritmo.
type ModuloProyectoFila = { lineaId: string; codigo: string; cocina: string; cantidad: number; piezasPorModulo: number };

/**
 * Los muebles de la cotización, agrupados por cocina y por referencia.
 *
 * Una cotización repite la misma referencia en varias líneas —dos W3642, dos
 * TK4— y la lista plana obligaba a sumarlas a ojo. Se juntan las que tienen el
 * mismo código **y el mismo despiece**: si dos líneas con el mismo código dan
 * distintas piezas por módulo es que su configuración difiere, y mezclarlas
 * escondería esa diferencia.
 */
function ModulosProyecto({ modulos }: { modulos: ModuloProyectoFila[] }) {
  const [abierto, setAbierto] = useState(false);
  const [cocinasAbiertas, setCocinasAbiertas] = useState<Set<string>>(new Set());

  const porCocina = useMemo(() => {
    const cocinas = new Map<string, Map<string, { codigo: string; piezasPorModulo: number; cantidad: number; lineas: number }>>();
    for (const m of modulos) {
      const refs = cocinas.get(m.cocina) ?? new Map();
      const clave = `${m.codigo}|${m.piezasPorModulo}`;
      const ya = refs.get(clave);
      if (ya) { ya.cantidad += m.cantidad; ya.lineas += 1; }
      else refs.set(clave, { codigo: m.codigo, piezasPorModulo: m.piezasPorModulo, cantidad: m.cantidad, lineas: 1 });
      cocinas.set(m.cocina, refs);
    }
    return [...cocinas.entries()]
      .map(([cocina, refs]) => {
        const filas = [...refs.values()].sort((a, b) => b.cantidad * b.piezasPorModulo - a.cantidad * a.piezasPorModulo || a.codigo.localeCompare(b.codigo));
        return {
          cocina,
          filas,
          unidades: filas.reduce((n, f) => n + f.cantidad, 0),
          piezas: filas.reduce((n, f) => n + f.cantidad * f.piezasPorModulo, 0),
        };
      })
      .sort((a, b) => b.piezas - a.piezas || a.cocina.localeCompare(b.cocina));
  }, [modulos]);

  const unidades = porCocina.reduce((n, c) => n + c.unidades, 0);
  const piezas = porCocina.reduce((n, c) => n + c.piezas, 0);
  const referencias = porCocina.reduce((n, c) => n + c.filas.length, 0);
  const alternarCocina = (cocina: string) => setCocinasAbiertas((s) => {
    const n = new Set(s);
    if (!n.delete(cocina)) n.add(cocina);
    return n;
  });

  return (
    <div className="rounded-xl border border-slate-200">
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}
        className="flex w-full flex-wrap items-baseline gap-x-3 px-3 py-2 text-left hover:bg-slate-50">
        <span className="w-4 text-slate-400">{abierto ? '▾' : '▸'}</span>
        <h3 className="text-sm font-semibold text-slate-800">Módulos del proyecto</h3>
        <span className="text-xs text-slate-500">
          {fmt(porCocina.length)} cocina(s) · {fmt(referencias)} referencia(s) · {fmt(modulos.length)} línea(s) ·{' '}
          {fmt(unidades)} unidades · {fmt(piezas)} piezas
        </span>
      </button>

      {abierto && (
        <div className="divide-y divide-slate-100 border-t border-slate-200">
          {porCocina.map((c) => {
            const abiertaCocina = cocinasAbiertas.has(c.cocina);
            return (
              <div key={c.cocina}>
                <button type="button" onClick={() => alternarCocina(c.cocina)} aria-expanded={abiertaCocina}
                  className="flex w-full flex-wrap items-baseline gap-x-3 px-3 py-1.5 text-left hover:bg-slate-50">
                  <span className="w-4 text-slate-400">{abiertaCocina ? '▾' : '▸'}</span>
                  <span className="font-medium text-slate-800">{c.cocina}</span>
                  <span className="text-xs text-slate-500">
                    {fmt(c.filas.length)} referencia(s) · {fmt(c.unidades)} unidades · {fmt(c.piezas)} piezas
                  </span>
                </button>

                {abiertaCocina && (
                  <div className="overflow-x-auto px-3 pb-3">
                    <table className="w-full border-collapse">
                      <thead><tr>
                        <th className={th}>Código</th><th className={`${th} text-right`}>Cantidad</th>
                        <th className={`${th} text-right`}>Piezas por módulo</th><th className={`${th} text-right`}>Piezas totales</th>
                      </tr></thead>
                      <tbody>
                        {c.filas.map((f) => (
                          <tr key={`${f.codigo}-${f.piezasPorModulo}`}>
                            <td className={`${td} font-medium`}>
                              {f.codigo}
                              {f.lineas > 1 && <span className="ml-1 text-xs font-normal text-slate-400">{f.lineas} líneas</span>}
                            </td>
                            <td className={tdNum}>{fmt(f.cantidad)}</td>
                            <td className={tdNum}>{fmt(f.piezasPorModulo, Number.isInteger(f.piezasPorModulo) ? 0 : 2)}</td>
                            <td className={tdNum}>{fmt(Math.round(f.piezasPorModulo * f.cantidad))}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-semibold">
                          <td className={td}>{c.cocina}</td>
                          <td className={tdNum}>{fmt(c.unidades)}</td>
                          <td className={td} />
                          <td className={tdNum}>{fmt(Math.round(c.piezas))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlanDias({ plan, totalLista }: { plan: PlanDiario; totalLista: number }) {
  // Con diez dias y varios modulos cada uno la tabla plana no se podia leer: cada
  // dia se pliega y solo se abre el que se quiere mirar.
  const [abiertos, setAbiertos] = useState<Set<number>>(new Set());
  const alternar = (dia: number) => setAbiertos((s) => {
    const n = new Set(s);
    if (!n.delete(dia)) n.add(dia);
    return n;
  });

  const alertas = [...new Set(plan.dias.flatMap((d) => d.alertas))];
  // El plan suma el despiece por modulo; la lista de corte redondea una sola vez por
  // medida, asi que en proyectos con modulos agrupados los totales pueden diferir.
  const difiere = Math.round(plan.totalPiezas) !== totalLista;
  const todosAbiertos = abiertos.size === plan.dias.length;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-1">
        <h3 className="text-sm font-semibold text-slate-800">Plan de corte por día</h3>
        <p className="text-xs text-slate-500">
          {fmt(plan.dias.length)} día(s) a {fmt(plan.ritmo)} piezas/día. Los módulos se agrupan por
          tablero —primero el material con más volumen— y un módulo se puede partir entre dos días.
        </p>
      </div>

      {alertas.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 mb-2">
          {alertas.join(' ')}
        </div>
      )}

      <div className="mb-1 flex justify-end">
        <button type="button"
          onClick={() => setAbiertos(todosAbiertos ? new Set() : new Set(plan.dias.map((d) => d.dia)))}
          className="text-xs text-slate-500 hover:text-slate-800 hover:underline">
          {todosAbiertos ? 'Plegar todos los días' : 'Desplegar todos los días'}
        </button>
      </div>

      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
        {plan.dias.map((d) => {
          const abierto = abiertos.has(d.dia);
          const materiales = [...new Set(d.items.map((i) => i.material))];
          return (
            <div key={d.dia}>
              <button type="button" onClick={() => alternar(d.dia)}
                aria-expanded={abierto}
                className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-0.5 px-3 py-2 text-left hover:bg-slate-50">
                <span className="w-5 text-slate-400">{abierto ? '▾' : '▸'}</span>
                <span className="font-semibold text-slate-900">Día {d.dia}</span>
                <span className="text-sm text-slate-600">
                  {fmt(d.piezas)} piezas
                  {d.libre > 0 && <span className="text-slate-400"> · libre {fmt(d.libre)}</span>}
                </span>
                <span className="text-sm text-slate-600">
                  {fmt(d.items.length)} módulo(s) · {fmt(d.items.reduce((n, i) => n + i.unidades, 0))} unidades
                </span>
                <span className="text-xs text-slate-400">{materiales.join(' + ')}</span>
                {d.items.some((i) => i.partido) && <span className="text-xs text-amber-700">tiene módulos partidos</span>}
              </button>

              {abierto && (
                <div className="overflow-x-auto px-3 pb-3">
                  <table className="w-full border-collapse">
                    <thead><tr>
                      <th className={th}>Tablero principal</th><th className={th}>Cocina</th><th className={th}>Módulo</th>
                      <th className={`${th} text-right`}>Unidades</th><th className={`${th} text-right`}>Piezas</th>
                    </tr></thead>
                    <tbody>
                      {d.items.map((it, i) => (
                        <tr key={`${d.dia}-${it.lineaId}-${i}`}>
                          <td className={`${td} text-xs`}>{it.material}</td>
                          <td className={`${td} text-xs text-slate-500`}>{it.cocina}</td>
                          <td className={`${td} font-medium`}>
                            {it.codigo}
                            {it.partido && <span className="ml-1 text-xs font-normal text-amber-700">(parte)</span>}
                          </td>
                          <td className={tdNum}>{fmt(it.unidades)}</td>
                          <td className={tdNum}>{fmt(it.piezas, Number.isInteger(it.piezas) ? 0 : 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 mt-1">
        {'(parte)'} = el módulo se corta en más de un día.
        {difiere && ` El plan suma ${fmt(plan.totalPiezas)} piezas del despiece por módulo; la lista de corte cuenta ${fmt(totalLista)} porque las piezas compartidas de los módulos agrupados se redondean una sola vez por medida.`}
      </p>
    </div>
  );
}


export default function OptimizadorView({ configInicial, configGuardada, tableros, cotizaciones }:
  { configInicial: ConfigOptimizador; configGuardada: boolean; tableros: TableroInfo[]; cotizaciones: CotizacionHeader[] }) {
  const [cfg, setCfg] = useState<ConfigOptimizador>(configInicial);
  const [guardado, setGuardado] = useState<ConfigOptimizador>(configInicial);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(
    configGuardada ? null : { tipo: 'error', texto: 'Los parámetros aún no existen en la base (migración 0180). Se muestran los valores por defecto.' },
  );

  const [cotizacionId, setCotizacionId] = useState('');
  const [proyecto, setProyecto] = useState<ProyectoOptimizador | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorProyecto, setErrorProyecto] = useState<string | null>(null);
  const [texturaPorMaterial, setTexturaPorMaterial] = useState<Record<string, string>>({});
  const [esquemas, setEsquemas] = useState<{ plan: PlanCorte; clave: string } | null>(null);
  const [optimizando, setOptimizando] = useState(false);

  const sucio = JSON.stringify(cfg) !== JSON.stringify(guardado);
  const set = <K extends keyof ConfigOptimizador>(k: K, v: ConfigOptimizador[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const num = (v: string) => (v === '' ? 0 : Number(v.replace(',', '.')));

  const cotizacionOptions = useMemo(
    () => cotizaciones.map((c) => ({
      value: c.id,
      label: `${c.codigo ?? '—'} · ${c.nombre ?? 'sin nombre'}${c.cliente_nombre ? ` (${c.cliente_nombre})` : ''}`,
    })),
    [cotizaciones],
  );

  // El cálculo se rehace en el cliente con la configuración en edición: cambiar el
  // disco, el refilado o las piezas por día actualiza los indicadores sin guardar.
  const lista = useMemo(
    () => (proyecto ? construirListaCorte(proyecto.modulos, tableros, normalizarConfig(cfg)) : null),
    [proyecto, tableros, cfg],
  );
  // Dias de corte y reparto de modulos: solo depende del ritmo, no de toda la config.
  const plan = useMemo(
    () => (proyecto ? planDiarioDeCorte(proyecto.modulos, cfg.piezasPorDia) : null),
    [proyecto, cfg.piezasPorDia],
  );
  const formatosCatalogo = useMemo(
    () => [...new Set(tableros.map((t) => normalizarFormato(t.formato)).filter(Boolean))].sort(),
    [tableros],
  );

  async function cargarCotizacion(id: string) {
    setCotizacionId(id);
    setProyecto(null);
    setErrorProyecto(null);
    setEsquemas(null);
    if (!id) return;
    setCargando(true);
    try {
      setProyecto(await proyectoDesdeCotizacionAction(id));
    } catch (e) {
      setErrorProyecto(e instanceof Error ? e.message : 'No se pudo cargar la cotización.');
    } finally {
      setCargando(false);
    }
  }

  const claveEsquemas = JSON.stringify([cotizacionId, cfg, texturaPorMaterial]);
  const esquemasAlDia = esquemas?.clave === claveEsquemas;

  function optimizarCorte() {
    if (!proyecto) return;
    setOptimizando(true);
    // Sincrono: acomodar un proyecto grande toma decimas de segundo.
    const plan = planDeCorte(proyecto.modulos, tableros, normalizarConfig(cfg), (m) => texturaPorMaterial[m] ?? texturaDefault);
    setEsquemas({ plan, clave: claveEsquemas });
    setOptimizando(false);
  }

  async function guardar() {
    setGuardando(true);
    setMsg(null);
    const r = await guardarConfigOptimizadorAction(cfg);
    setGuardando(false);
    if (!r.ok) { setMsg({ tipo: 'error', texto: r.error }); return; }
    setCfg(r.config);
    setGuardado(r.config);
    setMsg({ tipo: 'ok', texto: 'Parámetros guardados.' });
  }

  const moverCriterio = (i: number, d: -1 | 1) => {
    const arr = [...cfg.criterio];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set('criterio', arr);
  };
  const labelCriterio = (k: CriterioOptimizacion) => CRITERIOS.find((c) => c.key === k)?.label ?? k;
  const texturaDefault = cfg.texturas[0]?.nombre ?? '';

  return (
    <div className="space-y-5">
      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.35rem .5rem;font-size:.8rem;background:white}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}.inp-sm{width:6rem}`}</style>

      {/* ---------------- 1. Proyecto ---------------- */}
      <Seccion titulo="1. Proyecto a optimizar" nota="Las piezas salen del despiece actual del motor para cada módulo de la cotización (con su cantidad y agrupación).">
        <Campo label="Cotización">
          <Combobox value={cotizacionId} options={cotizacionOptions} onChange={cargarCotizacion} placeholder="Buscar cotización por código, nombre o cliente…" />
        </Campo>
        {cargando && <p className="text-slate-400 text-sm">Calculando despiece…</p>}
        {errorProyecto && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorProyecto}</div>}
        {proyecto && proyecto.errores.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {proyecto.errores.length} módulo(s) no se pudieron calcular y quedan fuera: {proyecto.errores.map((e) => `${e.codigo} (${e.error})`).join('; ')}
          </div>
        )}
        {proyecto && proyecto.modulos.length === 0 && proyecto.errores.length === 0 && (
          <p className="text-slate-400 text-sm">Esta cotización no tiene módulos.</p>
        )}

        {lista && proyecto && proyecto.modulos.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Kpi label="Módulos" valor={fmt(proyecto.modulos.reduce((s, m) => s + m.cantidad, 0))} detalle={`${proyecto.modulos.length} líneas`} />
              <Kpi label="Materiales" valor={fmt(lista.materiales.length)} />
              <Kpi label="Piezas a cortar" valor={fmt(lista.totalPiezas)} />
              <div className="rounded-xl p-3 bg-slate-50">
                <Campo label="Piezas por día">
                  <input type="number" min={0} step={1} value={cfg.piezasPorDia || ''} placeholder="definir"
                    onChange={(e) => set('piezasPorDia', Math.max(0, Math.round(num(e.target.value))))} className="inp" />
                </Campo>
              </div>
              <Kpi oscuro label="Días de corte"
                valor={plan?.dias.length ? fmt(plan.dias.length) : '—'}
                detalle={plan?.dias.length
                  ? `${fmt(plan.ritmo)} piezas/día${plan.dias.length > plan.diasMinimos ? ` · mínimo teórico ${fmt(plan.diasMinimos)}` : ''}`
                  : 'Define las piezas por día'} />
            </div>

            {plan && plan.dias.length > 0 && <PlanDias plan={plan} totalLista={lista.totalPiezas} />}

            <ModulosProyecto modulos={proyecto.modulos} />

            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Resumen por material</h3>
              <p className="text-xs text-slate-500 mb-2">
                Láminas mínimas = área de piezas (con {fmt(cfg.discoMm, 1)} mm de sierra) ÷ área útil de la lámina (con {fmt(cfg.refiladoMm, 1)} mm de refilado).
                Máx. láminas = cuántas se pueden usar sin pasar del {fmt(cfg.desperdicioMaxPct)} % de desperdicio.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead><tr>
                    <th className={th}>Material</th><th className={th}>Proveedor</th><th className={`${th} text-right`}>Espesor</th>
                    <th className={th}>Lámina</th><th className={`${th} text-right`}>Pila</th><th className={th}>Textura / veta</th>
                    <th className={`${th} text-right`}>Piezas</th><th className={`${th} text-right`}>m² netos</th>
                    <th className={`${th} text-right`}>Láminas mín.</th><th className={`${th} text-right`}>Máx. ≤ {fmt(cfg.desperdicioMaxPct)} %</th>
                    <th className={`${th} text-right`}>Desperdicio mín.</th><th className={th}>Alertas</th>
                  </tr></thead>
                  <tbody>
                    {lista.materiales.map((m) => {
                      const textura = texturaPorMaterial[m.material] ?? texturaDefault;
                      const rota = cfg.texturas.find((t) => t.nombre === textura)?.rotaVeta;
                      return (
                        <tr key={m.material}>
                          <td className={`${td} font-medium`}>{m.material}<div className="text-[11px] text-slate-400">{m.roles.join(', ')}</div></td>
                          <td className={td}>{m.proveedor || '—'}</td>
                          <td className={tdNum}>{m.espesorMm != null ? `${fmt(m.espesorMm, m.espesorMm % 1 ? 1 : 0)} mm` : '—'}</td>
                          <td className={td}>{m.formato ? `${fmt(m.formato.largoMm)} × ${fmt(m.formato.anchoMm)}` : (m.formatoCodigo || '—')}</td>
                          <td className={tdNum}>{m.laminasPorPila ?? '—'}</td>
                          <td className={td}>
                            <select value={textura} onChange={(e) => setTexturaPorMaterial((s) => ({ ...s, [m.material]: e.target.value }))} className="inp">
                              {cfg.texturas.map((t) => <option key={t.nombre} value={t.nombre}>{t.nombre}</option>)}
                            </select>
                            <div className="text-[11px] text-slate-400 mt-0.5">{rota == null ? '' : rota ? 'Rota veta' : 'No rota veta'}</div>
                          </td>
                          <td className={tdNum}>{fmt(m.piezas)}</td>
                          <td className={tdNum}>{fmt(m.areaNetaM2, 2)}</td>
                          <td className={tdNum}>{fmt(m.laminasMinimas)}</td>
                          <td className={tdNum}>{fmt(m.laminasMaxDesperdicio)}</td>
                          <td className={tdNum}>{m.desperdicioMinimoPct == null ? '—' : `${fmt(m.desperdicioMinimoPct, 1)} %`}</td>
                          <td className={`${td} text-xs`}>
                            {m.alertas.length === 0
                              ? <span className="text-emerald-700">OK</span>
                              : <ul className="text-amber-700 space-y-0.5">{m.alertas.map((a) => <li key={a}>• {a}</li>)}</ul>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">La textura por material todavía no se guarda: se elige aquí para la corrida. Pendiente decidir si vive en el tablero o en la cotización.</p>
            </div>

            <details className="rounded-xl border border-slate-200">
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-800">Lista de corte ({fmt(lista.filas.length)} medidas distintas, {fmt(lista.totalPiezas)} piezas)</summary>
              <div className="overflow-x-auto px-3 pb-3">
                <table className="w-full border-collapse">
                  <thead><tr>
                    <th className={th}>Material</th><th className={th}>Pieza</th>
                    <th className={`${th} text-right`}>Largo (mm)</th><th className={`${th} text-right`}>Ancho (mm)</th><th className={`${th} text-right`}>Cantidad</th>
                    <th className={th}>Enchape (L + C)</th><th className={th}>Canto</th><th className={th}>Módulos</th>
                  </tr></thead>
                  <tbody>
                    {lista.filas.map((f, i) => (
                      <tr key={i}>
                        <td className={td}>{f.material}</td><td className={td}>{f.pieza}</td>
                        <td className={tdNum}>{fmt(f.largoMm, 1)}</td><td className={tdNum}>{fmt(f.anchoMm, 1)}</td><td className={tdNum}>{fmt(f.cantidad)}</td>
                        <td className={td}>{f.cantoLargos} + {f.cantoAnchos}</td><td className={td}>{f.calibre || '—'}</td>
                        <td className={`${td} text-xs text-slate-500`}>{f.modulos.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="text-xs text-slate-400">
                {esquemas && !esquemasAlDia
                  ? 'Cambiaron los parámetros: vuelve a optimizar para ver el acomodo actualizado.'
                  : 'Acomodo por día con disco, refilado, veta y conteo de cortes.'}
              </span>
              <button type="button" onClick={optimizarCorte} disabled={optimizando}
                className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-40">
                {optimizando ? 'Optimizando…' : esquemas ? 'Volver a optimizar' : 'Optimizar corte'}
              </button>
            </div>

            {esquemas && (
              <div className={esquemasAlDia ? undefined : 'opacity-60'}>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Esquemas de corte por día</h3>
                <EsquemasCorte plan={esquemas.plan} meta={cfg.desperdicioMaxPct} />
              </div>
            )}
          </>
        )}
      </Seccion>

      {/* ---------------- Guardar ---------------- */}
      <div className="sticky top-[52px] z-30 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-2">
        <p className="text-sm text-slate-600">
          {sucio ? 'Hay cambios sin guardar en los parámetros de planta.' : 'Parámetros de planta (se aplican a todos los proyectos).'}
          {msg && <span className={`ml-2 ${msg.tipo === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>{msg.texto}</span>}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setCfg(guardado)} disabled={!sucio || guardando} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40">Descartar</button>
          <button type="button" onClick={guardar} disabled={!sucio || guardando} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm font-medium disabled:opacity-40">{guardando ? 'Guardando…' : 'Guardar parámetros'}</button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------------- 2. Seccionadora ---------------- */}
        <Seccion titulo="2. Seccionadora y lámina" nota="Condiciones confirmadas por producción el 07-10-2026. Los niveles de corte son provisionales.">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Máquina" className="col-span-2"><input value={cfg.maquina} onChange={(e) => set('maquina', e.target.value)} className="inp" /></Campo>
            <Campo label="Espesor del disco (mm)"><input type="number" step="0.1" min={0} value={cfg.discoMm} onChange={(e) => set('discoMm', num(e.target.value))} className="inp" /></Campo>
            <Campo label="Niveles de corte (guillotina)"><input type="number" step={1} min={1} max={6} value={cfg.nivelesCorte} onChange={(e) => set('nivelesCorte', Math.round(num(e.target.value)))} className="inp" /></Campo>
            <Campo label="Refilado por lado (mm)"><input type="number" step="0.5" min={0} value={cfg.refiladoMm} onChange={(e) => set('refiladoMm', num(e.target.value))} className="inp" /></Campo>
            <Campo label="Refilado máximo (mm)"><input type="number" step="0.5" min={0} value={cfg.refiladoMaxMm} onChange={(e) => set('refiladoMaxMm', num(e.target.value))} className="inp" /></Campo>
            <label className="flex items-center gap-2 text-sm text-slate-700 col-span-2">
              <input type="checkbox" checked={cfg.giraLamina} onChange={(e) => set('giraLamina', e.target.checked)} /> La lámina gira entre cortes
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 col-span-2">
              <input type="checkbox" checked={cfg.refilarSoloZonaUsada} onChange={(e) => set('refilarSoloZonaUsada', e.target.checked)} /> Refilar solo los bordes de la zona usada (la zona libre no se refila)
            </label>
          </div>
        </Seccion>

        {/* ---------------- 3. Sobrantes y criterio ---------------- */}
        <Seccion titulo="3. Sobrantes y criterio de optimización" nota="El orden de la lista define la prioridad: el primero manda.">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Sobrante útil mínimo: largo (mm)"><input type="number" min={0} value={cfg.sobranteMinLargoMm} onChange={(e) => set('sobranteMinLargoMm', num(e.target.value))} className="inp" /></Campo>
            <Campo label="Sobrante útil mínimo: ancho (mm)"><input type="number" min={0} value={cfg.sobranteMinAnchoMm} onChange={(e) => set('sobranteMinAnchoMm', num(e.target.value))} className="inp" /></Campo>
            <Campo label="Desperdicio máximo por material (%)"><input type="number" min={0} max={100} step="0.5" value={cfg.desperdicioMaxPct} onChange={(e) => set('desperdicioMaxPct', num(e.target.value))} className="inp" /></Campo>
            <Campo label="Piezas por día"><input type="number" min={0} step={1} value={cfg.piezasPorDia || ''} placeholder="definir" onChange={(e) => set('piezasPorDia', Math.max(0, Math.round(num(e.target.value))))} className="inp" /></Campo>
            <Campo label="Combinaciones a probar"><input type="number" min={0} step={100} value={cfg.iteraciones} onChange={(e) => set('iteraciones', Math.max(0, Math.round(num(e.target.value))))} className="inp" /></Campo>
            <Campo label="Tope por material (ms)"><input type="number" min={0} step={50} value={cfg.tiempoMaxMs} onChange={(e) => set('tiempoMaxMs', Math.max(0, Math.round(num(e.target.value))))} className="inp" /></Campo>
            <label className="flex items-center gap-2 text-sm text-slate-700 col-span-2">
              <input type="checkbox" checked={cfg.sobranteEnUltimaLamina} onChange={(e) => set('sobranteEnUltimaLamina', e.target.checked)} /> Si queda sobrante, dejarlo en la última lámina de cada material
            </label>
          </div>
          <ol className="space-y-1.5">
            {cfg.criterio.map((c, i) => (
              <li key={c} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
                <span className="w-5 text-center font-semibold text-slate-500">{i + 1}</span>
                <span className="flex-1 text-slate-800">{labelCriterio(c)}</span>
                <button type="button" onClick={() => moverCriterio(i, -1)} disabled={i === 0} className="rounded border border-slate-200 px-1.5 text-xs disabled:opacity-30" aria-label="Subir">↑</button>
                <button type="button" onClick={() => moverCriterio(i, 1)} disabled={i === cfg.criterio.length - 1} className="rounded border border-slate-200 px-1.5 text-xs disabled:opacity-30" aria-label="Bajar">↓</button>
              </li>
            ))}
          </ol>
        </Seccion>

        {/* ---------------- 4. Pila por espesor ---------------- */}
        <Seccion titulo="4. Láminas por pila según espesor" nota="Cuántas láminas corta la seccionadora a la vez."
          accion={<button type="button" onClick={() => set('pilas', [...cfg.pilas, { espesorMm: 0, laminas: 1 }])} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">+ Agregar</button>}>
          <table className="w-full border-collapse">
            <thead><tr><th className={th}>Espesor (mm)</th><th className={th}>Láminas por pila</th><th className={th}></th></tr></thead>
            <tbody>
              {cfg.pilas.map((p, i) => (
                <tr key={i}>
                  <td className={td}><input type="number" step="0.5" min={0} value={p.espesorMm} onChange={(e) => set('pilas', cfg.pilas.map((x, j) => j === i ? { ...x, espesorMm: num(e.target.value) } : x))} className="inp inp-sm" /></td>
                  <td className={td}><input type="number" step={1} min={1} value={p.laminas} onChange={(e) => set('pilas', cfg.pilas.map((x, j) => j === i ? { ...x, laminas: Math.round(num(e.target.value)) } : x))} className="inp inp-sm" /></td>
                  <td className={`${td} text-right`}><button type="button" onClick={() => set('pilas', cfg.pilas.filter((_, j) => j !== i))} className="text-xs text-red-600">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Seccion>

        {/* ---------------- 5. Texturas ---------------- */}
        <Seccion titulo="5. Texturas y veta" nota="Si la textura no rota veta, las piezas no se pueden girar al acomodarlas. Rustick y Amazonas: pendiente de confirmar."
          accion={<button type="button" onClick={() => set('texturas', [...cfg.texturas, { nombre: '', rotaVeta: true }])} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">+ Agregar</button>}>
          <table className="w-full border-collapse">
            <thead><tr><th className={th}>Textura</th><th className={th}>¿Rota veta?</th><th className={th}></th></tr></thead>
            <tbody>
              {cfg.texturas.map((t, i) => (
                <tr key={i}>
                  <td className={td}><input value={t.nombre} onChange={(e) => set('texturas', cfg.texturas.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} className="inp" /></td>
                  <td className={td}>
                    <select value={t.rotaVeta ? 'si' : 'no'} onChange={(e) => set('texturas', cfg.texturas.map((x, j) => j === i ? { ...x, rotaVeta: e.target.value === 'si' } : x))} className="inp">
                      <option value="si">Sí, se puede girar</option><option value="no">No, respetar veta</option>
                    </select>
                  </td>
                  <td className={`${td} text-right`}><button type="button" onClick={() => set('texturas', cfg.texturas.filter((_, j) => j !== i))} className="text-xs text-red-600">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Seccion>

        {/* ---------------- 6. Formatos ---------------- */}
        <Seccion titulo="6. Formatos de lámina" nota={`Se cruzan con el formato de cada tablero del catálogo. Formatos en el catálogo: ${formatosCatalogo.join(', ') || '—'}.`}
          accion={<button type="button" onClick={() => set('formatos', [...cfg.formatos, { codigo: '', largoMm: 0, anchoMm: 0, activo: true }])} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">+ Agregar</button>}>
          <table className="w-full border-collapse">
            <thead><tr>
              <th className={th}>Código (catálogo)</th><th className={th}>Largo (mm)</th><th className={th}>Ancho (mm)</th>
              <th className={th}>Confirmado por planta</th><th className={th}>Tableros que lo usan</th><th className={th}></th>
            </tr></thead>
            <tbody>
              {cfg.formatos.map((f, i) => {
                const usados = tableros.filter((t) => normalizarFormato(t.formato) === normalizarFormato(f.codigo)).length;
                return (
                  <tr key={i}>
                    <td className={td}>
                      <input value={f.codigo} onChange={(e) => {
                        const codigo = normalizarFormato(e.target.value);
                        const dims = dimsDesdeCodigoFormato(codigo);
                        set('formatos', cfg.formatos.map((x, j) => j === i ? { ...x, codigo, ...(x.largoMm || x.anchoMm ? {} : dims ?? {}) } : x));
                      }} className="inp inp-sm" placeholder="183X244" />
                    </td>
                    <td className={td}><input type="number" min={0} value={f.largoMm} onChange={(e) => set('formatos', cfg.formatos.map((x, j) => j === i ? { ...x, largoMm: num(e.target.value) } : x))} className="inp inp-sm" /></td>
                    <td className={td}><input type="number" min={0} value={f.anchoMm} onChange={(e) => set('formatos', cfg.formatos.map((x, j) => j === i ? { ...x, anchoMm: num(e.target.value) } : x))} className="inp inp-sm" /></td>
                    <td className={td}><input type="checkbox" checked={f.activo} onChange={(e) => set('formatos', cfg.formatos.map((x, j) => j === i ? { ...x, activo: e.target.checked } : x))} /></td>
                    <td className={tdNum}>{usados}</td>
                    <td className={`${td} text-right`}><button type="button" onClick={() => set('formatos', cfg.formatos.filter((_, j) => j !== i))} className="text-xs text-red-600">Quitar</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {formatosCatalogo.filter((c) => !cfg.formatos.some((f) => normalizarFormato(f.codigo) === c)).length > 0 && (
            <p className="text-xs text-amber-700">
              Formatos del catálogo sin configurar: {formatosCatalogo.filter((c) => !cfg.formatos.some((f) => normalizarFormato(f.codigo) === c)).join(', ')}.
            </p>
          )}
        </Seccion>
      </div>
    </div>
  );
}
