'use client';
import { useMemo, useState } from 'react';
import Combobox from '@/components/Combobox';
import Campo from '@/components/Campo';
import { TIPS_DISENO } from '@/lib/tooltips';
import {
  getDisenoAction, guardarPiezaAction, eliminarPiezaAction,
  guardarReglaAction, eliminarReglaAction, guardarHerrajeAction, eliminarHerrajeAction, previewAction,
} from './actions';

type Tipo = { id: string; pref: string; nombre_es: string | null };
type Row = Record<string, any> & { id?: string };
type Diseno = {
  piezas: Row[]; reglas: Row[]; herrajes: Row[];
  tableros: string[]; cantos: string[]; herrajeCat: { codigo: string; nombre: string; categoria: string | null }[];
};
const ROLES = ['caja', 'refuerzo', 'frente', 'fondo', 'fondo_shaker', 'zocalo', 'panel', 'filler', 'lateral_cajon', 'cajon_madera', 'canto'];
const fmt = (n: number) => Number(n).toLocaleString('es-CO', { maximumFractionDigits: 0 });

export default function DisenoEditor({ tipos, presetDefault }: { tipos: Tipo[]; presetDefault: Record<string, string> }) {
  const [tipoId, setTipoId] = useState('');
  const [d, setD] = useState<Diseno | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(id: string) {
    setTipoId(id); if (!id) { setD(null); return; }
    setLoading(true);
    setD(await getDisenoAction(id) as Diseno);
    setLoading(false);
  }
  const reload = () => tipoId && load(tipoId);
  const tipoOptions = useMemo(() => tipos.map((t) => ({ value: t.id, label: `${t.pref} — ${t.nombre_es ?? ''}` })), [tipos]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <label className="block text-sm text-slate-600 mb-1">Tipo de mueble</label>
        <div className="max-w-md">
          <Combobox value={tipoId} options={tipoOptions} onChange={load} placeholder="Buscar tipo de mueble…" allowEmpty emptyLabel="— seleccionar —" />
        </div>
      </div>

      {loading && <p className="text-slate-400 text-sm">Cargando…</p>}
      {d && tipoId && (
        <>
          <PiezasEditor tipoId={tipoId} piezas={d.piezas} cantos={d.cantos} onChange={reload} />
          <ReglasEditor tipoId={tipoId} reglas={d.reglas} onChange={reload} />
          <HerrajesEditor tipoId={tipoId} herrajes={d.herrajes} herrajeCat={d.herrajeCat} onChange={reload} />
          <Preview tipoId={tipoId} presetDefault={presetDefault} tableros={d.tableros} />
        </>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mb-2">{subtitle}</p>}
      {children}
    </div>
  );
}
const inp = 'w-full border border-slate-300 rounded px-2 py-1 text-sm';

// ---------- Piezas ----------
function PiezasEditor({ tipoId, piezas, cantos, onChange }: { tipoId: string; piezas: Row[]; cantos: string[]; onChange: () => void }) {
  const [edit, setEdit] = useState<Row | null>(null);
  const blank = () => ({ nombre: '', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: '', formula_ancho: '', tarugos: 0, soportes: 0, orden: (piezas.length + 1) * 10, _cal: '', _l: 0, _a: 0, _de: '' });
  const start = (p?: Row) => setEdit(p ? {
    ...p, _cal: p.cantos?.calibre ?? '', _l: p.cantos?.largos ?? 0, _a: p.cantos?.anchos ?? 0, _de: p.cantos?.despEdges ?? '',
  } : blank());

  async function save() {
    const e = edit!;
    const cantos = e._cal ? { calibre: e._cal, largos: Number(e._l) || 0, anchos: Number(e._a) || 0, ...(e._de !== '' && e._de != null ? { despEdges: Number(e._de) } : {}) } : {};
    const row = {
      tipo_mueble_id: tipoId, nombre: e.nombre, rol_tablero: (!e.rol_tablero || e.rol_tablero === 'canto') ? null : String(e.rol_tablero).trim().toLowerCase().replace(/\s+/g, '_'),
      formula_cantidad: e.formula_cantidad, formula_largo: e.formula_largo, formula_ancho: e.formula_ancho,
      cantos, tarugos: Number(e.tarugos) || 0, soportes: Number(e.soportes) || 0, orden: Number(e.orden) || 0,
    };
    const r = await guardarPiezaAction(e.id ?? null, row);
    if (!r.ok) { alert(r.error); return; }
    setEdit(null); onChange();
  }
  async function del(id: string) { if (confirm('¿Eliminar pieza?')) { await eliminarPiezaAction(id); onChange(); } }

  return (
    <Section title="Piezas (despiece)" subtitle="Cada pieza aporta área (según su rol de tablero) y/o canto. Variables en fórmulas: L, A, P y derivadas (n_puertas, n_entrepanos…).">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400"><th className="py-1">Pieza</th><th>Rol</th><th>Cant</th><th>Largo</th><th>Ancho</th><th>Canto</th><th>Tarugos</th><th></th></tr></thead>
          <tbody>
            {piezas.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="py-1">{p.nombre}</td><td className="text-slate-500">{p.rol_tablero ?? '(canto)'}</td>
                <td>{p.formula_cantidad}</td><td className="text-slate-500">{p.formula_largo}</td><td className="text-slate-500">{p.formula_ancho}</td>
                <td className="text-slate-500">{p.cantos?.calibre ? `${p.cantos.calibre} ${p.cantos.largos ?? 0}/${p.cantos.anchos ?? 0}` : '—'}</td>
                <td>{p.tarugos}</td>
                <td className="text-right whitespace-nowrap"><button onClick={() => start(p)} className="text-slate-500 hover:text-slate-900 mr-2">Editar</button><button onClick={() => del(p.id!)} className="text-slate-400 hover:text-red-600">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => start()} className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">+ Pieza</button>

      {edit && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl grid sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <F l="Nombre"><input className={inp} value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} /></F>
          <F l="Rol tablero"><input className={inp} list="roles-diseno" value={edit.rol_tablero ?? 'canto'} placeholder="caja, frente, zocalo…" onChange={(e) => setEdit({ ...edit, rol_tablero: e.target.value })} /><datalist id="roles-diseno">{ROLES.map((r) => <option key={r} value={r}>{r === 'canto' ? '(solo canto)' : r}</option>)}</datalist></F>
          <F l="Cantidad"><input className={inp} value={edit.formula_cantidad} onChange={(e) => setEdit({ ...edit, formula_cantidad: e.target.value })} /></F>
          <F l="Orden"><input type="number" className={inp} value={edit.orden} onChange={(e) => setEdit({ ...edit, orden: e.target.value })} /></F>
          <F l="Fórmula largo (in)"><input className={inp} value={edit.formula_largo ?? ''} onChange={(e) => setEdit({ ...edit, formula_largo: e.target.value })} /></F>
          <F l="Fórmula ancho (in)"><input className={inp} value={edit.formula_ancho ?? ''} onChange={(e) => setEdit({ ...edit, formula_ancho: e.target.value })} /></F>
          <F l="Canto calibre"><select className={inp} value={edit._cal} onChange={(e) => setEdit({ ...edit, _cal: e.target.value })}><option value="">(sin canto)</option>{cantos.map((c) => <option key={c}>{c}</option>)}</select></F>
          <F l="Aristas largo / ancho"><div className="flex gap-1"><input type="number" className={inp} value={edit._l} onChange={(e) => setEdit({ ...edit, _l: e.target.value })} /><input type="number" className={inp} value={edit._a} onChange={(e) => setEdit({ ...edit, _a: e.target.value })} /></div></F>
          <F l="Aristas desperdicio (opc)"><input type="number" className={inp} placeholder="auto" value={edit._de} onChange={(e) => setEdit({ ...edit, _de: e.target.value })} /></F>
          <F l="Tarugos"><input type="number" className={inp} value={edit.tarugos} onChange={(e) => setEdit({ ...edit, tarugos: e.target.value })} /></F>
          <F l="Soportes"><input type="number" className={inp} value={edit.soportes} onChange={(e) => setEdit({ ...edit, soportes: e.target.value })} /></F>
          <div className="col-span-full flex gap-2"><button onClick={save} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm">Guardar</button><button onClick={() => setEdit(null)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm">Cancelar</button></div>
        </div>
      )}
    </Section>
  );
}

// ---------- Reglas ----------
function ReglasEditor({ tipoId, reglas, onChange }: { tipoId: string; reglas: Row[]; onChange: () => void }) {
  const [edit, setEdit] = useState<Row | null>(null);
  const start = (r?: Row) => setEdit(r ? { ...r } : { variable: 'n_puertas', condicion: 'true', valor: '1', prioridad: 100, activo: true });
  async function save() {
    const e = edit!;
    const r = await guardarReglaAction(e.id ?? null, { tipo_mueble_id: tipoId, variable: e.variable, condicion: e.condicion, valor: e.valor, prioridad: Number(e.prioridad) || 100, activo: e.activo !== false });
    if (!r.ok) { alert(r.error); return; } setEdit(null); onChange();
  }
  async function del(id: string) { if (confirm('¿Eliminar regla?')) { await eliminarReglaAction(id); onChange(); } }
  return (
    <Section title="Reglas paramétricas (de este tipo)" subtitle="Derivan variables (n_puertas, n_entrepanos…) según L/A/P. Gana la 1ª condición verdadera por prioridad. (Las reglas globales se gestionan aparte.)">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-slate-400"><th className="py-1">Variable</th><th>Condición</th><th>Valor</th><th>Prioridad</th><th></th></tr></thead>
        <tbody>
          {reglas.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="py-1">{r.variable}</td><td className="text-slate-500">{r.condicion}</td><td>{r.valor}</td><td>{r.prioridad}</td>
              <td className="text-right whitespace-nowrap"><button onClick={() => start(r)} className="text-slate-500 hover:text-slate-900 mr-2">Editar</button><button onClick={() => del(r.id!)} className="text-slate-400 hover:text-red-600">✕</button></td>
            </tr>
          ))}
          {reglas.length === 0 && <tr><td colSpan={5} className="py-2 text-slate-400">Sin reglas propias (usa las globales).</td></tr>}
        </tbody>
      </table>
      <button onClick={() => start()} className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">+ Regla</button>
      {edit && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl grid sm:grid-cols-4 gap-2">
          <F l="Variable"><input className={inp} value={edit.variable} onChange={(e) => setEdit({ ...edit, variable: e.target.value })} /></F>
          <F l="Condición (en L,A,P)"><input className={inp} value={edit.condicion} onChange={(e) => setEdit({ ...edit, condicion: e.target.value })} /></F>
          <F l="Valor"><input className={inp} value={edit.valor} onChange={(e) => setEdit({ ...edit, valor: e.target.value })} /></F>
          <F l="Prioridad"><input type="number" className={inp} value={edit.prioridad} onChange={(e) => setEdit({ ...edit, prioridad: e.target.value })} /></F>
          <div className="col-span-full flex gap-2"><button onClick={save} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm">Guardar</button><button onClick={() => setEdit(null)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm">Cancelar</button></div>
        </div>
      )}
    </Section>
  );
}

// ---------- Herrajes ----------
function HerrajesEditor({ tipoId, herrajes, herrajeCat, onChange }: { tipoId: string; herrajes: Row[]; herrajeCat: { codigo: string; nombre: string }[]; onChange: () => void }) {
  const [edit, setEdit] = useState<Row | null>(null);
  const start = (h?: Row) => setEdit(h ? { ...h } : { rol: '', herraje_codigo: '', formula_cantidad: '1', orden: (herrajes.length + 1) * 10 });
  async function save() {
    const e = edit!;
    const r = await guardarHerrajeAction(e.id ?? null, { tipo_mueble_id: tipoId, rol: e.rol, herraje_codigo: e.herraje_codigo, formula_cantidad: e.formula_cantidad, orden: Number(e.orden) || 0 });
    if (!r.ok) { alert(r.error); return; } setEdit(null); onChange();
  }
  async function del(id: string) { if (confirm('¿Eliminar herraje?')) { await eliminarHerrajeAction(id); onChange(); } }
  return (
    <Section title="Herrajes del módulo" subtitle="Cantidad por mueble (fórmula en L,A,P y derivadas como n_puertas, n_patas, n_cajones).">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-slate-400"><th className="py-1">Rol</th><th>Herraje</th><th>Cantidad</th><th></th></tr></thead>
        <tbody>
          {herrajes.map((h) => (
            <tr key={h.id} className="border-t border-slate-100">
              <td className="py-1">{h.rol}</td><td className="text-slate-500">{h.herraje_codigo}</td><td>{h.formula_cantidad}</td>
              <td className="text-right whitespace-nowrap"><button onClick={() => start(h)} className="text-slate-500 hover:text-slate-900 mr-2">Editar</button><button onClick={() => del(h.id!)} className="text-slate-400 hover:text-red-600">✕</button></td>
            </tr>
          ))}
          {herrajes.length === 0 && <tr><td colSpan={4} className="py-2 text-slate-400">Sin herrajes.</td></tr>}
        </tbody>
      </table>
      <button onClick={() => start()} className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">+ Herraje</button>
      {edit && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl grid sm:grid-cols-4 gap-2">
          <F l="Rol"><input className={inp} value={edit.rol} onChange={(e) => setEdit({ ...edit, rol: e.target.value })} placeholder="pata/bisagra/manija…" /></F>
          <F l="Herraje"><select className={inp} value={edit.herraje_codigo ?? ''} onChange={(e) => setEdit({ ...edit, herraje_codigo: e.target.value })}><option value="">—</option>{herrajeCat.map((h) => <option key={h.codigo} value={h.codigo}>{h.codigo} · {h.nombre}</option>)}</select></F>
          <F l="Cantidad"><input className={inp} value={edit.formula_cantidad} onChange={(e) => setEdit({ ...edit, formula_cantidad: e.target.value })} /></F>
          <F l="Orden"><input type="number" className={inp} value={edit.orden} onChange={(e) => setEdit({ ...edit, orden: e.target.value })} /></F>
          <div className="col-span-full flex gap-2"><button onClick={save} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm">Guardar</button><button onClick={() => setEdit(null)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm">Cancelar</button></div>
        </div>
      )}
    </Section>
  );
}

// ---------- Preview ----------
function Preview({ tipoId, presetDefault, tableros }: { tipoId: string; presetDefault: Record<string, string>; tableros: string[] }) {
  const [L, setL] = useState(33); const [A, setA] = useState(30); const [P, setP] = useState(24);
  const [conH, setConH] = useState(false);
  const [res, setRes] = useState<any>(null); const [err, setErr] = useState<string | null>(null);
  async function run() {
    setErr(null);
    const r = await previewAction({ tipoId, largo: L, alto: A, prof: P, unidad: 'in', preset: presetDefault, conHerrajes: conH });
    if (!r.ok) { setErr(r.error); setRes(null); return; } setRes(r.result);
  }
  return (
    <Section title="Previsualizar costo" subtitle="Calcula con el preset por defecto y dimensiones dadas (pulgadas).">
      <div className="flex flex-wrap items-end gap-2">
        <F l="Largo"><input type="number" className={inp + ' w-20'} value={L} onChange={(e) => setL(+e.target.value)} /></F>
        <F l="Alto"><input type="number" className={inp + ' w-20'} value={A} onChange={(e) => setA(+e.target.value)} /></F>
        <F l="Prof"><input type="number" className={inp + ' w-20'} value={P} onChange={(e) => setP(+e.target.value)} /></F>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={conH} onChange={(e) => setConH(e.target.checked)} />herrajes</label>
        <button onClick={run} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm">Calcular</button>
      </div>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
      {res && (
        <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Madera por rol</p>
            {res.maderaPorRol.map((m: any) => <div key={m.rol} className="flex justify-between"><span className="capitalize">{m.rol} ({m.codigo})</span><span>{fmt(m.costo)}</span></div>)}
            {res.cantoPorCalibre.map((c: any) => <div key={c.calibre} className="flex justify-between text-slate-500"><span>canto {c.calibre}</span><span>{fmt(c.costo)}</span></div>)}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">Madera</span><span>{fmt(res.costoMadera)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Canto</span><span>{fmt(res.costoCanto)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Consumibles</span><span>{fmt(res.costoConsumibles)}</span></div>
            <div className="flex justify-between font-semibold border-t border-slate-200 pt-1"><span>Sin herrajes</span><span>{fmt(res.costoSinHerrajes)} COP</span></div>
            {conH && <div className="flex justify-between font-semibold"><span>Con herrajes</span><span>{fmt(res.costoConHerrajes)} COP</span></div>}
            <div className="flex justify-between text-slate-500">vars: <span>{JSON.stringify(res.vars)}</span></div>
          </div>
        </div>
      )}
    </Section>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <Campo label={l} info={TIPS_DISENO[l]}>{children}</Campo>;
}
