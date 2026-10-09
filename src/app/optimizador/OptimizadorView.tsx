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
  const formatosCatalogo = useMemo(
    () => [...new Set(tableros.map((t) => normalizarFormato(t.formato)).filter(Boolean))].sort(),
    [tableros],
  );

  async function cargarCotizacion(id: string) {
    setCotizacionId(id);
    setProyecto(null);
    setErrorProyecto(null);
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
              <Kpi oscuro label="Días de producción"
                valor={lista.reparto.length ? fmt(lista.reparto.length) : '—'}
                detalle={lista.reparto.length ? `${fmt(cfg.piezasPorDia)} piezas/día` : 'Define las piezas por día'} />
            </div>

            {lista.reparto.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Reparto diario de piezas</p>
                <div className="flex flex-wrap gap-1.5">
                  {lista.reparto.map((n, i) => (
                    <span key={i} className={`rounded-lg px-2 py-1 text-xs ${n < cfg.piezasPorDia ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700'}`}>
                      Día {i + 1}: <b>{fmt(n)}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Módulos del proyecto</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead><tr>
                    <th className={th}>Código</th><th className={th}>Cocina</th>
                    <th className={`${th} text-right`}>Cantidad</th><th className={`${th} text-right`}>Piezas por módulo</th><th className={`${th} text-right`}>Piezas totales</th>
                  </tr></thead>
                  <tbody>
                    {proyecto.modulos.map((m) => (
                      <tr key={m.lineaId}>
                        <td className={`${td} font-medium`}>{m.codigo}</td><td className={td}>{m.cocina}</td>
                        <td className={tdNum}>{fmt(m.cantidad)}</td><td className={tdNum}>{fmt(m.piezasPorModulo, Number.isInteger(m.piezasPorModulo) ? 0 : 2)}</td>
                        <td className={tdNum}>{fmt(Math.round(m.piezasPorModulo * m.cantidad))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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

            <div className="flex items-center justify-end gap-3">
              <span className="text-xs text-slate-400">El cálculo del plan de corte (acomodo, secuencia y número de cortes) llega en la siguiente fase.</span>
              <button type="button" disabled className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium opacity-40 cursor-not-allowed">Optimizar corte</button>
            </div>
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
