'use client';
import { useMemo, useState } from 'react';
import { cotizarAction } from './actions';
import type { CotizarResult } from '@/lib/cotizar';
import GuideButton from '@/components/GuideButton';

type Tipo = { id: string; pref: string; nombre_es: string | null; categoria: string | null; margen_key: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number; incluye_herrajes: boolean };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null; precio_m2: number | null };

const fmtCOP = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const ROL_LABEL: Record<string, string> = { caja: 'caja', refuerzo: 'refuerzos', frente: 'frente', fondo: 'fondo' };

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

export default function CotizadorForm({ tipos, recargos, tableros, trmDefault, presetDefault, rolesByTipo }:
  { tipos: Tipo[]; recargos: Recargo[]; tableros: Tablero[]; trmDefault: number; presetDefault: Record<string, string>; rolesByTipo: Record<string, string[]> }) {

  const sbfd = tipos.find((t) => t.pref === 'SBFD');
  const [tipoId, setTipoId] = useState(sbfd?.id ?? tipos[0]?.id ?? '');
  const [unidad, setUnidad] = useState<'in' | 'cm' | 'mm'>('in');
  const [largo, setLargo] = useState(33);
  const [alto, setAlto] = useState(30);
  const [prof, setProf] = useState(24);
  const [preset, setPreset] = useState<Record<string, string>>(presetDefault);
  const [recargoId, setRecargoId] = useState('');
  const [conHerrajes, setConHerrajes] = useState(true);
  const [moneda, setMoneda] = useState<'COP' | 'USD'>('USD');
  const [trm, setTrm] = useState(trmDefault);
  const [npuertas, setNpuertas] = useState<string>('');
  const [ncajones, setNcajones] = useState<string>('');
  const [modoFrentes, setModoFrentes] = useState<'normal' | 'sin_frentes' | 'solo_frentes'>('normal');

  const [result, setResult] = useState<CotizarResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tableroLabel = (t: Tablero) => `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;
  const recargoSel = recargos.find((r) => r.id === recargoId);

  const roles = rolesByTipo[tipoId] ?? ['caja', 'frente', 'fondo'];
  const sortedTableros = useMemo(() => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)), [tableros]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const overrides: Record<string, number> = {};
    if (npuertas !== '') overrides.n_puertas = Number(npuertas);
    if (ncajones !== '') overrides.n_cajones = Number(ncajones);
    const res = await cotizarAction({
      tipoId, largo, alto, prof, unidad, preset, conHerrajes,
      recargoPct: recargoSel?.recargo_pct ?? 0,
      trm, modoFrentes,
      overrides: Object.keys(overrides).length ? overrides : undefined,
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
          <GuideButton steps={GUIA_SIMULADOR} label="Guía" />
        </div>

        <div data-tour="tipo">
          <Field label="Tipo de mueble">
            <select value={tipoId} onChange={(e) => setTipoId(e.target.value)} className="inp">
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.pref} — {t.nombre_es}</option>)}
            </select>
          </Field>
        </div>

        <div data-tour="dims" className="grid grid-cols-4 gap-2 items-end">
          <Field label="Largo"><input type="number" step="any" value={largo} onChange={(e) => setLargo(+e.target.value)} className="inp" /></Field>
          <Field label="Alto"><input type="number" step="any" value={alto} onChange={(e) => setAlto(+e.target.value)} className="inp" /></Field>
          <Field label="Prof"><input type="number" step="any" value={prof} onChange={(e) => setProf(+e.target.value)} className="inp" /></Field>
          <Field label="Unidad">
            <select value={unidad} onChange={(e) => setUnidad(e.target.value as 'in' | 'cm' | 'mm')} className="inp">
              <option value="in">in</option><option value="cm">cm</option><option value="mm">mm</option>
            </select>
          </Field>
        </div>

        <div data-tour="tableros" className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Tableros</p>
          {roles.map((rol) => (
            <Field key={rol} label={ROL_LABEL[rol] ?? rol}>
              <select value={preset[rol] ?? ''} onChange={(e) => setPreset((p) => ({ ...p, [rol]: e.target.value }))} className="inp">
                <option value="">— seleccionar —</option>
                {sortedTableros.map((t) => <option key={t.codigo} value={t.codigo}>{tableroLabel(t)}</option>)}
              </select>
            </Field>
          ))}
        </div>

        <div data-tour="cliente">
          <Field label="Cliente (recargo)">
            <select value={recargoId} onChange={(e) => setRecargoId(e.target.value)} className="inp">
              <option value="">Sin recargo</option>
              {recargos.map((r) => <option key={r.id} value={r.id}>{r.cliente_nombre} (+{(r.recargo_pct * 100).toFixed(0)}%)</option>)}
            </select>
          </Field>
        </div>

        <div data-tour="opciones" className="grid grid-cols-2 gap-2 items-end">
          <Field label="Nº puertas (override)"><input type="number" placeholder="auto" value={npuertas} onChange={(e) => setNpuertas(e.target.value)} className="inp" /></Field>
          <Field label="Nº cajones (override)"><input type="number" placeholder="auto" value={ncajones} onChange={(e) => setNcajones(e.target.value)} className="inp" /></Field>
          <Field label="Frentes">
            <select value={modoFrentes} onChange={(e) => setModoFrentes(e.target.value as 'normal' | 'sin_frentes' | 'solo_frentes')} className="inp">
              <option value="normal">Completo</option><option value="sin_frentes">Sin frentes (open)</option><option value="solo_frentes">Solo kit de frentes</option>
            </select>
          </Field>
          <Field label="TRM"><input type="number" step="any" value={trm} onChange={(e) => setTrm(+e.target.value)} className="inp" /></Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={conHerrajes} onChange={(e) => setConHerrajes(e.target.checked)} /> Incluir herrajes
        </label>

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
  return (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-1 capitalize">{label}</span>
      {children}
    </label>
  );
}

function ResultadoView({ result, moneda, setMoneda, conHerrajes }:
  { result: CotizarResult; moneda: 'COP' | 'USD'; setMoneda: (m: 'COP' | 'USD') => void; conHerrajes: boolean }) {
  const costoTotal = conHerrajes ? result.costoConHerrajes : result.costoSinHerrajes;
  const precioCop = result.precioCopConRecargo;
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
        <div className="text-4xl font-bold text-slate-900">{money(precioCop)}</div>
        <p className="text-sm text-slate-500 mt-1">
          Margen {(result.margen * 100).toFixed(0)}% · TRM {result.trm.toLocaleString('es-CO')}
          {moneda === 'COP' ? '' : ` · ${fmtCOP(precioCop)}`}
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
          <Stat label="Costo sin herrajes" value={money(result.costoSinHerrajes)} />
          <Stat label="Costo herrajes" value={money(result.costoHerrajes)} />
          <Stat label="Costo total" value={money(costoTotal)} highlight />
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
