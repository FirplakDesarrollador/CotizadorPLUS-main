'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarFilaAction, eliminarFilaAction, guardarParametrosAction } from './actions';
import type { CatalogoTabla } from '@/lib/admin';

type Field = { key: string; label: string; type: 'text' | 'number' | 'bool'; required?: boolean };
type Row = Record<string, unknown> & { id?: string };

const FIELDS: Record<CatalogoTabla, Field[]> = {
  cot_tableros: [
    { key: 'codigo', label: 'Código', type: 'text', required: true },
    { key: 'proveedor', label: 'Proveedor', type: 'text' },
    { key: 'sustrato', label: 'Sustrato', type: 'text' },
    { key: 'espesor_mm', label: 'Espesor (mm)', type: 'number' },
    { key: 'color_nombre', label: 'Color', type: 'text' },
    { key: 'formato', label: 'Formato', type: 'text' },
    { key: 'area_m2', label: 'Área (m²)', type: 'number' },
    { key: 'precio', label: 'Precio', type: 'number' },
    { key: 'descuento', label: 'Descuento', type: 'number' },
    { key: 'precio_real', label: 'Precio real', type: 'number' },
    { key: 'precio_m2', label: 'Precio/m²', type: 'number' },
    { key: 'activo', label: 'Activo', type: 'bool' },
  ],
  cot_cantos: [
    { key: 'referencia', label: 'Referencia', type: 'text' },
    { key: 'codigo', label: 'Código', type: 'text', required: true },
    { key: 'calibre', label: 'Calibre', type: 'text' },
    { key: 'precio', label: 'Precio (COP/m)', type: 'number' },
    { key: 'activo', label: 'Activo', type: 'bool' },
  ],
  cot_herrajes: [
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'nombre', label: 'Nombre', type: 'text', required: true },
    { key: 'categoria', label: 'Categoría', type: 'text' },
    { key: 'selector_key', label: 'Selector', type: 'text' },
    { key: 'precio', label: 'Precio', type: 'number' },
    { key: 'unidad', label: 'Unidad', type: 'text' },
    { key: 'activo', label: 'Activo', type: 'bool' },
  ],
  cot_recargos_cliente: [
    { key: 'cliente_nombre', label: 'Cliente', type: 'text', required: true },
    { key: 'recargo_pct', label: 'Recargo (0–1)', type: 'number' },
    { key: 'incluye_herrajes', label: 'Incluye herrajes', type: 'bool' },
    { key: 'notas', label: 'Notas', type: 'text' },
    { key: 'activo', label: 'Activo', type: 'bool' },
  ],
};

type TabKey = CatalogoTabla | 'parametros';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'cot_tableros', label: 'Tableros' },
  { key: 'cot_cantos', label: 'Cantos' },
  { key: 'cot_herrajes', label: 'Herrajes' },
  { key: 'cot_recargos_cliente', label: 'Clientes' },
  { key: 'parametros', label: 'Parámetros' },
];

export default function AdminCatalogos({ tableros, cantos, herrajes, recargos, parametros }:
  { tableros: Row[]; cantos: Row[]; herrajes: Row[]; recargos: Row[]; parametros: Record<string, unknown> }) {
  const [tab, setTab] = useState<TabKey>('cot_tableros');
  const rowsByTab: Record<CatalogoTabla, Row[]> = {
    cot_tableros: tableros, cot_cantos: cantos, cot_herrajes: herrajes, cot_recargos_cliente: recargos,
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            {t.label}{t.key !== 'parametros' && <span className="opacity-60"> ({rowsByTab[t.key as CatalogoTabla].length})</span>}
          </button>
        ))}
      </div>
      {tab === 'parametros'
        ? <ParametrosEditor parametros={parametros} />
        : <CatalogManager key={tab} tabla={tab} fields={FIELDS[tab]} rows={rowsByTab[tab]} />}
    </div>
  );
}

function emptyRow(fields: Field[]): Row {
  const r: Row = {};
  for (const f of fields) r[f.key] = f.type === 'bool' ? true : '';
  return r;
}

function CatalogManager({ tabla, fields, rows }: { tabla: CatalogoTabla; fields: Field[]; rows: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');

  function startAdd() { setEditing(emptyRow(fields)); setDraft(emptyRow(fields)); setError(null); }
  function startEdit(r: Row) { setEditing(r); setDraft({ ...r }); setError(null); }
  function cancel() { setEditing(null); setError(null); }

  async function save() {
    setSaving(true); setError(null);
    const res = await guardarFilaAction(tabla, (editing?.id as string) ?? null, draft);
    setSaving(false);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    setEditing(null); router.refresh();
  }
  async function remove(r: Row) {
    if (!r.id || !confirm('¿Eliminar este registro?')) return;
    const res = await eliminarFilaAction(tabla, r.id as string);
    if (!res.ok) { alert(res.error); return; }
    router.refresh();
  }

  const filtered = q ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) : rows;

  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-64" />
        <button onClick={startAdd} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm font-medium hover:bg-slate-800">+ Agregar</button>
      </div>

      {editing && (
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-medium text-slate-900 mb-3">{editing.id ? 'Editar' : 'Nuevo'} registro</h3>
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {fields.map((f) => (
              <label key={f.key} className="block">
                <span className="block text-xs text-slate-500 mb-1">{f.label}{f.required && ' *'}</span>
                {f.type === 'bool' ? (
                  <input type="checkbox" checked={!!draft[f.key]} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.checked }))} className="h-4 w-4" />
                ) : (
                  <input type={f.type === 'number' ? 'number' : 'text'} step="any"
                    value={(draft[f.key] ?? '') as string | number}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                )}
              </label>
            ))}
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={save} disabled={saving} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar'}</button>
            <button onClick={cancel} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm hover:bg-slate-100">Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-slate-100">
            {fields.map((f) => <th key={f.key} className="px-3 py-2 whitespace-nowrap">{f.label}</th>)}
            <th className="px-3"></th>
          </tr></thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={(r.id as string) ?? i} className="border-b border-slate-50 hover:bg-slate-50">
                {fields.map((f) => (
                  <td key={f.key} className="px-3 py-2 whitespace-nowrap">
                    {f.type === 'bool' ? (r[f.key] ? '✓' : '—')
                      : f.type === 'number' && r[f.key] != null ? Number(r[f.key]).toLocaleString('es-CO')
                      : ((r[f.key] as string) ?? '—')}
                  </td>
                ))}
                <td className="px-3 py-2 whitespace-nowrap text-right">
                  <button onClick={() => startEdit(r)} className="text-slate-500 hover:text-slate-900 mr-3">Editar</button>
                  <button onClick={() => remove(r)} className="text-slate-400 hover:text-red-600">✕</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={fields.length + 1} className="px-3 py-8 text-center text-slate-400">Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Editor de parámetros globales ----
function ParametrosEditor({ parametros }: { parametros: Record<string, unknown> }) {
  const router = useRouter();
  const trm0 = (parametros.trm ?? {}) as { valor?: number; modo?: string };
  const marg0 = (parametros.margenes ?? {}) as Record<string, number>;
  const [trmValor, setTrmValor] = useState<number>(Number(trm0.valor ?? 4200));
  const [trmModo, setTrmModo] = useState<string>(String(trm0.modo ?? 'manual'));
  const [despMadera, setDespMadera] = useState<number>(Number(parametros.desperdicio_madera ?? 0.15));
  const [recargo, setRecargo] = useState<number>(Number(parametros.recargo_extra ?? 0.1));
  const [margenHerraje, setMargenHerraje] = useState<number>(Number(parametros.margen_herraje ?? 0.57));
  const [mMuebles, setMMuebles] = useState<number>(Number(marg0.muebles ?? 0.57));
  const [mFillers, setMFillers] = useState<number>(Number(marg0.fillers ?? 0.52));
  const [mPnTk, setMPnTk] = useState<number>(Number(marg0.pn_tk ?? 0.44));
  const [avanzado, setAvanzado] = useState(false);
  const [jLamina, setJLamina] = useState(JSON.stringify(parametros.lamina ?? {}, null, 2));
  const [jCanto, setJCanto] = useState(JSON.stringify(parametros.desperdicio_canto ?? {}, null, 2));
  const [jSm, setJSm] = useState(JSON.stringify(parametros.factores_sm ?? {}, null, 2));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true); setError(null); setMsg(null);
    const updates: { key: string; value: unknown }[] = [
      { key: 'trm', value: { valor: trmValor, modo: trmModo } },
      { key: 'desperdicio_madera', value: despMadera },
      { key: 'recargo_extra', value: recargo },
      { key: 'margen_herraje', value: margenHerraje },
      { key: 'margenes', value: { muebles: mMuebles, fillers: mFillers, pn_tk: mPnTk } },
    ];
    try {
      if (avanzado) {
        updates.push({ key: 'lamina', value: JSON.parse(jLamina) });
        updates.push({ key: 'desperdicio_canto', value: JSON.parse(jCanto) });
        updates.push({ key: 'factores_sm', value: JSON.parse(jSm) });
      }
    } catch {
      setSaving(false); setError('JSON inválido en sección avanzada'); return;
    }
    const res = await guardarParametrosAction(updates);
    setSaving(false);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    setMsg('Parámetros guardados'); router.refresh();
  }

  const Num = ({ label, value, set, hint }: { label: string; value: number; set: (n: number) => void; hint?: string }) => (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-1">{label}{hint && <span className="text-slate-400"> · {hint}</span>}</span>
      <input type="number" step="any" value={value} onChange={(e) => set(Number(e.target.value))}
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
    </label>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
      <section>
        <h3 className="text-sm font-medium text-slate-900 mb-3">Tasa de cambio</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Num label="TRM (COP por USD)" value={trmValor} set={setTrmValor} />
          <label className="block">
            <span className="block text-xs text-slate-500 mb-1">Modo</span>
            <select value={trmModo} onChange={(e) => setTrmModo(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="manual">manual</option><option value="auto">auto</option>
            </select>
          </label>
        </div>
      </section>
      <section>
        <h3 className="text-sm font-medium text-slate-900 mb-3">Márgenes y recargos (0–1)</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Num label="Margen muebles" value={mMuebles} set={setMMuebles} hint="0.57 = 57%" />
          <Num label="Margen fillers" value={mFillers} set={setMFillers} />
          <Num label="Margen paneles/zócalos" value={mPnTk} set={setMPnTk} />
          <Num label="Margen herraje" value={margenHerraje} set={setMargenHerraje} />
          <Num label="Recargo extra" value={recargo} set={setRecargo} hint="CEMA +10% = 0.10" />
          <Num label="Desperdicio madera" value={despMadera} set={setDespMadera} hint="0.15 = 15%" />
        </div>
      </section>

      <section>
        <button onClick={() => setAvanzado((a) => !a)} className="text-sm text-slate-500 hover:text-slate-900">
          {avanzado ? '▾' : '▸'} Avanzado (lámina, desperdicio canto, factores SM)
        </button>
        {avanzado && (
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            {[['Lámina (m²/cm²)', jLamina, setJLamina], ['Desperdicio canto', jCanto, setJCanto], ['Factores SM', jSm, setJSm]].map(([lab, val, set], i) => (
              <label key={i} className="block">
                <span className="block text-xs text-slate-500 mb-1">{lab as string}</span>
                <textarea value={val as string} onChange={(e) => (set as (s: string) => void)(e.target.value)} rows={6}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-mono" />
              </label>
            ))}
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-600">{msg}</p>}
      <button onClick={save} disabled={saving} className="rounded-lg bg-slate-900 text-white px-5 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
        {saving ? 'Guardando…' : 'Guardar parámetros'}
      </button>
    </div>
  );
}
