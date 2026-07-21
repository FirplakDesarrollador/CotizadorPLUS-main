'use client';
import { useMemo, useState, useEffect } from 'react';
import { cotizarAction } from './actions';
import { useSimuladorStore } from '@/store/simuladorStore';
import type { CotizarResult } from '@/lib/cotizar';
import GuideButton from '@/components/GuideButton';
import TooltipToggle from '@/components/TooltipToggle';
import Campo from '@/components/Campo';
import Combobox from '@/components/Combobox';
import { TIPS_COTIZADOR } from '@/lib/tooltips';
import { DB_TIPOLOGIAS, DB_RIELES } from '@/lib/muebles';

// Conversión exacta entre unidades vía milímetros.
const TO_MM: Record<'in' | 'cm' | 'mm', number> = { in: 25.4, cm: 10, mm: 1 };
const convertir = (v: number, de: 'in' | 'cm' | 'mm', a: 'in' | 'cm' | 'mm') =>
  Math.round((v * TO_MM[de]) / TO_MM[a] * 1e6) / 1e6;

type Tipo = { id: string; pref: string; nombre_es: string | null; categoria: string | null; margen_key: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number; incluye_herrajes: boolean };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null; precio_m2: number | null };
type Perfil = { id: string; nombre: string; descripcion: string | null; valores: Record<string, string> };
type HerrajeTipo = { rol: string; codigo: string | null };

const fmtCOP = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const ROL_LABEL: Record<string, string> = { caja: 'caja', refuerzo: 'refuerzos', frente: 'frente', fondo: 'fondo' }

const getCantoMatch = (cantos: string[], target: string) =>
  cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ??
  cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ??
  target;

const GUIA_SIMULADOR = [
  { title: 'Simulador de muebles', description: 'Calcula el precio de un mueble individual a partir de sus dimensiones y materiales. Sigue estos pasos.' },
  { selector: '[data-tour="tipo"]', title: '1. Tipo de mueble', description: 'Elige el tipo (base, superior, vanity, torre…). Cada tipo tiene su despiece propio validado.' },
  { selector: '[data-tour="dims"]', title: '2. Dimensiones', description: 'Ingresa Largo, Alto y Profundidad, y elige la unidad (pulgadas, cm o mm).' },
  { selector: '[data-tour="tableros"]', title: '3. Tableros', description: 'Elige el material por rol: caja, refuerzos, frente y fondo. Define el costo de la madera.' },
  { selector: '[data-tour="cliente"]', title: '4. Cliente (recargo)', description: 'Opcional: aplica el recargo del cliente (ej. CEMA +10%).' },
  { selector: '[data-tour="opciones"]', title: '5. Opciones', description: 'Ajusta nº de puertas/cajones, el modo de frentes (completo / sin frentes / kit) y la TRM.' },
  { selector: '[data-tour="calcular"]', title: '6. Calcular', description: 'Presiona para calcular el precio con el motor (validado contra el Excel CEMA).' },
  { selector: '[data-tour="resultado"]', title: '7. Resultado', description: 'Verás el precio (COP/USD conmutable) y el desglose: materiales, piezas, canto y herrajes.' },
];

export default function CotizadorForm({ tipos, recargos = [], tableros, trmDefault, presetDefault, rolesByTipo, perfiles, perfilDefaultId, herrajesByTipo, cantos }:
  { tipos: Tipo[]; recargos?: Recargo[]; tableros: Tablero[]; trmDefault: number; presetDefault: Record<string, string>; rolesByTipo: Record<string, string[]>; perfiles: Perfil[]; perfilDefaultId: string; herrajesByTipo: Record<string, HerrajeTipo[]>; cantos: string[] }) {

  const sbfd = tipos.find((t) => t.pref === 'SBFD');
  
  const store = useSimuladorStore();
  const setStore = store.setSimuladorState;

  const [isMounted, setIsMounted] = useState(false);
  const [cantoFrentes, setCantoFrentes] = useState('');
  const [cantoCaja, setCantoCaja] = useState('');

  useEffect(() => {
    setIsMounted(true);
    const frenteBoard = tableros.find((t) => t.codigo === preset['frente']);
    const cajaBoard = tableros.find((t) => t.codigo === preset['caja']);
    if (frenteBoard?.espesor_mm === 18) setCantoFrentes(getCantoMatch(cantos, '22x1'));
    else if (frenteBoard?.espesor_mm === 15) setCantoFrentes(getCantoMatch(cantos, '19x0,45'));
    if (cajaBoard?.espesor_mm === 18) setCantoCaja(getCantoMatch(cantos, '22x1'));
    else if (cajaBoard?.espesor_mm === 15) setCantoCaja(getCantoMatch(cantos, '19x0,45'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tipoId = store.tipoId || (sbfd?.id ?? tipos[0]?.id ?? '');
  const setTipoId = (v: string) => setStore({ tipoId: v });
  
  const unidad = store.unidad;
  const setUnidad = (v: 'in' | 'cm' | 'mm') => setStore({ unidad: v });
  
  const largo = store.largo;
  const setLargo = (v: number | ((prev: number) => number)) => setStore({ largo: typeof v === 'function' ? v(largo) : v });
  
  const alto = store.alto;
  const setAlto = (v: number | ((prev: number) => number)) => setStore({ alto: typeof v === 'function' ? v(alto) : v });
  
  const prof = store.prof;
  const setProf = (v: number | ((prev: number) => number)) => setStore({ prof: typeof v === 'function' ? v(prof) : v });
  
  const perfilId = store.perfilId || perfilDefaultId;
  // Validar que los códigos del store persisten contra los tableros disponibles.
  // Si un código fue eliminado del catálogo, usar el preset por defecto.
  const validCodes = useMemo(() => new Set(tableros.map((t) => t.codigo)), [tableros]);
  const preset = useMemo(() => {
    const stored = store.preset;
    if (!Object.keys(stored).length) return presetDefault;
    return Object.fromEntries(
      Object.entries(stored).map(([rol, cod]) => [rol, validCodes.has(cod) ? cod : (presetDefault[rol] ?? '')])
    );
  }, [store.preset, validCodes, presetDefault]);
  const setPreset = (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => setStore({ preset: typeof v === 'function' ? v(preset) : v });

  function aplicarPerfil(id: string) {
    setStore({ perfilId: id });
    const p = perfiles.find((x) => x.id === id);
    if (p) setStore({ preset: { ...p.valores } });
  }

  // const recargoId = store.recargoId;
  // const setRecargoId = (v: string) => setStore({ recargoId: v });
  const conHerrajes = store.conHerrajes;
  const setConHerrajes = (v: boolean) => setStore({ conHerrajes: v });
  
  const herrajesExcl = store.herrajesExcl;
  const setHerrajesExcl = (v: string[] | ((prev: string[]) => string[])) => setStore({ herrajesExcl: typeof v === 'function' ? v(herrajesExcl) : v });
  
  const moneda = store.moneda;
  const setMoneda = (v: 'COP' | 'USD') => setStore({ moneda: v });
  
  const trm = store.trm ?? trmDefault;
  const setTrm = (v: number) => setStore({ trm: v });
  
  const npuertas = store.npuertas;
  const setNpuertas = (v: string) => setStore({ npuertas: v });
  
  const ncajones = store.ncajones;
  const setNcajones = (v: string) => setStore({ ncajones: v });
  
  const nentrepanos = store.nentrepanos;
  const setNentrepanos = (v: string) => setStore({ nentrepanos: v });
  
  const nbarras = store.nbarras;
  const setNbarras = (v: string) => setStore({ nbarras: v });
  
  const dbTipo = store.dbTipo;
  const setDbTipo = (v: string) => setStore({ dbTipo: v });

  const rielCodigo = store.rielCodigo ?? 'RIELTANDEM';
  const setRielCodigo = (v: string) => setStore({ rielCodigo: v });
  
  const modoFrentes = store.modoFrentes;
  const setModoFrentes = (v: 'normal' | 'sin_frentes' | 'solo_frentes') => setStore({ modoFrentes: v });

  const result = store.result;
  const setResult = (v: CotizarResult | null) => setStore({ result: v });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tableroLabel = (t: Tablero) => `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;

  const sortedTableros = useMemo(() => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)), [tableros]);
  const tipoOptions = useMemo(() => tipos.map((t) => ({ value: t.id, label: `${t.pref} — ${t.nombre_es ?? ''}` })), [tipos]);
  const tableroOptions = useMemo(() => sortedTableros.map((t) => ({ value: t.codigo, label: tableroLabel(t) })), [sortedTableros]);

  if (!isMounted) return null;

  // const recargoSel = recargos.find((r) => r.id === recargoId);

  const roles = rolesByTipo[tipoId] ?? ['caja', 'frente', 'fondo'];
  const tipoPref = tipos.find((t) => t.id === tipoId)?.pref ?? '';
  const esDB = tipoPref.startsWith('DB');
  function aplicarDbTipo(k: string) {
    setDbTipo(k);
    const t = DB_TIPOLOGIAS.find((x) => x.key === k);
    if (t) { setNcajones(String(t.nc)); setNbarras(String(t.nb)); }
  }
  const herrajesTipo = herrajesByTipo[tipoId] ?? [];
  const toggleHerraje = (rol: string) => setStore({ herrajesExcl: herrajesExcl.includes(rol) ? herrajesExcl.filter((x) => x !== rol) : [...herrajesExcl, rol] });

  function changeUnidad(nu: 'in' | 'cm' | 'mm') {
    if (nu === unidad) return;
    setLargo((v) => convertir(v, unidad, nu));
    setAlto((v) => convertir(v, unidad, nu));
    setProf((v) => convertir(v, unidad, nu));
    setUnidad(nu);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const overrides: Record<string, number> = {};
    if (npuertas !== '') overrides.n_puertas = Number(npuertas);
    if (ncajones !== '') overrides.n_cajones = Number(ncajones);
    if (nentrepanos !== '') overrides.n_entrepanos = Number(nentrepanos);
    if (nbarras !== '') overrides.n_barras = Number(nbarras);
    const res = await cotizarAction({
      // El simulador SIEMPRE calcula herrajes para poder mostrar ambos precios
      // (con y sin). El checkbox "Incluir herrajes" solo elige cuál se muestra.
      tipoId, largo, alto, prof, unidad, preset, conHerrajes: true,
      // recargoPct: recargoSel?.recargo_pct ?? 0,
      trm, modoFrentes,
      overrides: Object.keys(overrides).length ? overrides : undefined,
      herrajesExcluidos: herrajesExcl.length ? herrajesExcl : undefined,
      cantoFrentes: cantoFrentes || undefined,
      cantoCaja: cantoCaja || undefined,
      rielCodigo: esDB && rielCodigo ? rielCodigo : undefined,
    });
    setLoading(false);
    if (!res.ok) { setError(res.error); setResult(null); return; }
    setResult(res.result);
  }

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-6">
      {/* ---- Formulario ---- */}
      <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Simular mueble</h2>
          <div className="flex gap-2">
            <GuideButton steps={GUIA_SIMULADOR} label="Guía" />
            <TooltipToggle />
          </div>
        </div>

        <div data-tour="tipo">
          <Field label="Tipo de mueble">
            <Combobox value={tipoId} options={tipoOptions} onChange={setTipoId} placeholder="Buscar tipo…" />
          </Field>
        </div>

        <div data-tour="dims" className="grid grid-cols-4 gap-2 items-end">
          <Field label="Largo"><input type="number" step="any" value={largo} onChange={(e) => setLargo(+e.target.value)} className="inp" /></Field>
          <Field label="Alto"><input type="number" step="any" value={alto} onChange={(e) => setAlto(+e.target.value)} className="inp" /></Field>
          <Field label="Prof"><input type="number" step="any" value={prof} onChange={(e) => setProf(+e.target.value)} className="inp" /></Field>
          <Field label="Unidad">
            <select value={unidad} onChange={(e) => changeUnidad(e.target.value as 'in' | 'cm' | 'mm')} className="inp">
              <option value="in">in</option><option value="cm">cm</option><option value="mm">mm</option>
            </select>
          </Field>
        </div>

        <div data-tour="tableros" className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Tableros</p>
          {perfiles.length > 0 && (
            <Field label="Perfil de material">
              <Combobox value={perfilId} options={perfiles.map((p) => ({ value: p.id, label: p.nombre }))} onChange={aplicarPerfil} placeholder="Elegir perfil…" />
            </Field>
          )}
          {(() => {
            const rendered: React.ReactNode[] = [];
            let cajaRendered = false;
            for (const rol of roles) {
              if (rol === 'caja' || rol === 'refuerzo') {
                if (cajaRendered) continue;
                cajaRendered = true;
                rendered.push(
                  <Field key="caja-refuerzo" label="caja / refuerzos">
                    <Combobox value={preset.caja ?? ''} options={tableroOptions}
                      onChange={(v) => {
                        setPreset((p) => ({ ...p, caja: v, refuerzo: v }));
                        const b = tableros.find((t) => t.codigo === v);
                        if (b?.espesor_mm === 18) setCantoCaja(getCantoMatch(cantos, '22x1'));
                        else if (b?.espesor_mm === 15) setCantoCaja(getCantoMatch(cantos, '19x0,45'));
                      }}
                      placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
                  </Field>
                );
              } else {
                rendered.push(
                  <Field key={rol} label={ROL_LABEL[rol] ?? rol}>
                    <Combobox value={preset[rol] ?? ''} options={tableroOptions}
                      onChange={(v) => {
                        setPreset((p) => ({ ...p, [rol]: v }));
                        if (rol === 'frente') {
                          const b = tableros.find((t) => t.codigo === v);
                          if (b?.espesor_mm === 18) setCantoFrentes(getCantoMatch(cantos, '22x1'));
                          else if (b?.espesor_mm === 15) setCantoFrentes(getCantoMatch(cantos, '19x0,45'));
                        }
                      }}
                      placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
                  </Field>
                );
              }
            }
            return rendered;
          })()}
        </div>

<<<<<<< HEAD
        {/* <div data-tour="cliente">
          <Field label="Cliente (recargo)">
            <select value={recargoId} onChange={(e) => setRecargoId(e.target.value)} className="inp">
              <option value="">Sin recargo</option>
              {recargos.map((r) => <option key={r.id} value={r.id}>{r.cliente_nombre} (+{(r.recargo_pct * 100).toFixed(0)}%)</option>)}
            </select>
          </Field>
        </div> */}
=======
>>>>>>> DEV

        <div data-tour="opciones" className="grid grid-cols-2 gap-2 items-end">
          <Field label="Nº puertas (override)"><input type="number" placeholder="auto" value={npuertas} onChange={(e) => setNpuertas(e.target.value)} className="inp" /></Field>
          <Field label="Nº cajones (override)"><input type="number" placeholder="auto" value={ncajones} onChange={(e) => setNcajones(e.target.value)} className="inp" /></Field>
          <Field label="Nº entrepaños (override)"><input type="number" placeholder="auto" value={nentrepanos} onChange={(e) => setNentrepanos(e.target.value)} className="inp" /></Field>
          {esDB && (
            <Field label="Tipología DB">
              <select value={dbTipo} onChange={(e) => aplicarDbTipo(e.target.value)} className="inp">
                <option value="">— manual —</option>
                {DB_TIPOLOGIAS.map((t) => <option key={t.key} value={t.key} title={t.desc}>{t.key} · {t.desc}</option>)}
              </select>
            </Field>
          )}
          {esDB && <Field label="Nº barras (pares)"><input type="number" placeholder="0" value={nbarras} onChange={(e) => setNbarras(e.target.value)} className="inp" /></Field>}
          {esDB && (
            <Field label="Tipo de riel">
              <select value={rielCodigo} onChange={(e) => setRielCodigo(e.target.value)} className="inp">
                {DB_RIELES.map((r) => (
                  <option key={r.codigo} value={r.codigo}>{r.nombre}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Frentes">
            <select value={modoFrentes} onChange={(e) => setModoFrentes(e.target.value as 'normal' | 'sin_frentes' | 'solo_frentes')} className="inp">
              <option value="normal">Completo</option><option value="sin_frentes">Sin frentes (open)</option><option value="solo_frentes">Solo kit de frentes</option>
            </select>
          </Field>
          <Field label="TRM"><input type="number" step="any" value={trm} onChange={(e) => setTrm(+e.target.value)} className="inp" /></Field>
          <Field label="Canto frentes">
            <select value={cantoFrentes} onChange={(e) => setCantoFrentes(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Canto caja">
            <select value={cantoCaja} onChange={(e) => setCantoCaja(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={conHerrajes} onChange={(e) => setConHerrajes(e.target.checked)} /> Incluir herrajes
        </label>
        {conHerrajes && herrajesTipo.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-2.5">
            <p className="text-[11px] font-medium text-slate-500 uppercase mb-1.5">Herrajes incluidos (destilda para excluir)</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {herrajesTipo.map((h) => (
                <label key={h.rol} className="flex items-center gap-1.5 text-sm text-slate-700 capitalize">
                  <input type="checkbox" checked={!herrajesExcl.includes(h.rol)} onChange={() => toggleHerraje(h.rol)} />
                  {h.rol}{h.codigo ? <span className="text-slate-400 normal-case">· {h.codigo}</span> : null}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button data-tour="calcular" disabled={loading} className="w-full rounded-lg bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
          {loading ? 'Calculando…' : 'Calcular precio'}
        </button>
      </form>

      {/* ---- Resultado ---- */}
      <div data-tour="resultado" className="space-y-4">
        {!result && <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">Ingresa los datos y calcula para ver el precio y el desglose.</div>}
        {result && <ResultadoView result={result} moneda={moneda} setMoneda={setMoneda} conHerrajes={conHerrajes} />}
      </div>

      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.4rem .6rem;font-size:.875rem}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <Campo label={label} info={TIPS_COTIZADOR[label]}>{children}</Campo>;
}

function ResultadoView({ result, moneda, setMoneda, conHerrajes }:
  { result: CotizarResult; moneda: 'COP' | 'USD'; setMoneda: (m: 'COP' | 'USD') => void; conHerrajes: boolean }) {
  const precioSin = result.precioCop;
  const precioHerr = result.precioHerrajesCop;
  const precioCon = result.precioConHerrajesCop;
  const precioPrincipal = conHerrajes ? precioCon : precioSin;
  const money = (cop: number) => (moneda === 'COP' ? fmtCOP(cop) : fmtUSD(cop / result.trm));
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Precio estimado</h2>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
            {(['USD', 'COP'] as const).map((m) => (
              <button key={m} onClick={() => setMoneda(m)} className={`px-3 py-1 ${moneda === m ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>{m}</button>
            ))}
          </div>
        </div>
        <div className="text-4xl font-bold text-slate-900">{money(precioPrincipal)}</div>
        <p className="text-sm text-slate-500 mt-1">
          {conHerrajes ? 'Con herrajes' : 'Sin herrajes'} · Margen mueble {(result.margen * 100).toFixed(0)}% · Margen herraje {(result.margenHerraje * 100).toFixed(0)}% · TRM {result.trm.toLocaleString('es-CO')}
          {moneda === 'COP' ? '' : ` · ${fmtCOP(precioPrincipal)}`}
        </p>
        {/* El simulador muestra SIEMPRE ambas opciones (con y sin herrajes). */}
        <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
          <Stat label="Precio sin herrajes" value={money(precioSin)} highlight={!conHerrajes} />
          <Stat label="Precio herrajes" value={money(precioHerr)} />
          <Stat label="Precio con herrajes" value={money(precioCon)} highlight={conHerrajes} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
          <Stat label="Costo sin herrajes" value={money(result.costoSinHerrajes)} />
          <Stat label="Costo herrajes" value={money(result.costoHerrajes)} />
          <Stat label="Costo total" value={money(result.costoConHerrajes)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card title="Desglose de costo">
          <Row k="Tablero (madera)" v={money(result.costoMadera)} />
          <Row k="Canto" v={money(result.costoCanto)} />
          <Row k="Consumibles" v={money(result.costoConsumibles)} />
          {conHerrajes && <Row k="Herrajes" v={money(result.costoHerrajes)} />}
        </Card>
        <Card title="Configuración derivada">
          {Object.entries(result.vars).map(([k, v]) => <Row key={k} k={k} v={String(v)} />)}
        </Card>
      </div>

      <Card title="Materiales">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400"><th className="py-1">Material</th><th>Detalle</th><th className="text-right">Cantidad</th><th className="text-right">Costo</th></tr></thead>
          <tbody>
            {result.maderaPorRol.map((m, i) => (
              <tr key={`m${i}`} className="border-t border-slate-100">
                <td className="py-1">Tablero · <span className="capitalize">{m.rol}</span></td>
                <td className="text-slate-500">{m.codigo}</td>
                <td className="text-right">{m.cm2.toLocaleString('es-CO')} cm²</td>
                <td className="text-right font-medium">{money(m.costo)}</td>
              </tr>
            ))}
            {result.cantoPorCalibre.map((c, i) => (
              <tr key={`c${i}`} className="border-t border-slate-100">
                <td className="py-1">Canto</td>
                <td className="text-slate-500">calibre {c.calibre}</td>
                <td className="text-right">{c.longCm.toLocaleString('es-CO')} cm</td>
                <td className="text-right font-medium">{money(c.costo)}</td>
              </tr>
            ))}
            {Object.entries(result.consumibles).filter(([, v]) => v > 0).map(([k, v]) => (
              <tr key={`x${k}`} className="border-t border-slate-100">
                <td className="py-1 capitalize">{k}</td><td className="text-slate-500">consumible</td>
                <td className="text-right">—</td><td className="text-right font-medium">{money(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Piezas (despiece)">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400"><th className="py-1">Pieza</th><th>Rol</th><th className="text-right">Cant</th><th className="text-right">Largo&quot;</th><th className="text-right">Ancho&quot;</th><th className="text-right">cm²</th></tr></thead>
          <tbody>
            {result.piezas.map((p, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="py-1">{p.pieza}</td><td className="text-slate-500">{p.rol}</td>
                <td className="text-right">{p.cant}</td><td className="text-right">{p.largoIn}</td>
                <td className="text-right">{p.anchoIn}</td><td className="text-right">{p.areaCm2.toLocaleString('es-CO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {conHerrajes && result.herrajes.length > 0 && (
        <Card title="Herrajes">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400"><th className="py-1">Herraje</th><th>Código</th><th className="text-right">Cant</th><th className="text-right">Unit</th><th className="text-right">Costo</th></tr></thead>
            <tbody>
              {result.herrajes.map((h, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1 capitalize">{h.rol}</td><td className="text-slate-500">{h.codigo}</td>
                  <td className="text-right">{h.cant}</td><td className="text-right">{money(h.precio)}</td>
                  <td className="text-right font-medium">{money(h.costo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-medium text-slate-900 mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between text-sm"><span className="text-slate-500">{k}</span><span className="text-slate-900 font-medium">{v}</span></div>;
}
function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`text-xs ${highlight ? 'text-slate-300' : 'text-slate-500'}`}>{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}
