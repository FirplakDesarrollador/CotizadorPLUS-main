'use client';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarFilaAction, eliminarFilaAction, guardarParametrosAction, guardarPerfilAction, eliminarPerfilAction } from './actions';
import type { CatalogoTabla, PresetPerfil } from '@/lib/admin';
import Campo from '@/components/Campo';
import Combobox from '@/components/Combobox';
import { TIPS_MATERIALES } from '@/lib/tooltips';
import { calcAreaM2, calcPrecio, calcPrecioM2 } from '@/lib/catalogo-tableros-calculos';

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
  /* cot_recargos_cliente: [
    { key: 'cliente_nombre', label: 'Cliente', type: 'text', required: true },
    { key: 'recargo_pct', label: 'Recargo (0–1)', type: 'number' },
    { key: 'incluye_herrajes', label: 'Incluye herrajes', type: 'bool' },
    { key: 'notas', label: 'Notas', type: 'text' },
    { key: 'activo', label: 'Activo', type: 'bool' },
  ], */
};

type TabKey = CatalogoTabla | 'parametros' | 'perfiles';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'cot_tableros', label: 'Tableros' },
  { key: 'cot_cantos', label: 'Cantos' },
  { key: 'cot_herrajes', label: 'Herrajes' },
  // { key: 'cot_recargos_cliente', label: 'Clientes' },
  { key: 'perfiles', label: 'Perfiles de material' },
  { key: 'parametros', label: 'Parámetros' },
];

export default function AdminCatalogos({ tableros, cantos, herrajes, recargos, parametros, perfiles }:
  { tableros: Row[]; cantos: Row[]; herrajes: Row[]; recargos: Row[]; parametros: Record<string, unknown>; perfiles: PresetPerfil[] }) {
  const [tab, setTab] = useState<TabKey>('cot_tableros');
  const rowsByTab: Partial<Record<CatalogoTabla, Row[]>> = {
    cot_tableros: tableros, cot_cantos: cantos, cot_herrajes: herrajes, /* cot_recargos_cliente: recargos, */
  };
  const countByTab: Partial<Record<TabKey, number>> = { ...Object.fromEntries(Object.entries(rowsByTab).map(([k, v]) => [k, v.length])), perfiles: perfiles.length };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            {t.label}{countByTab[t.key] !== undefined && <span className="opacity-60"> ({countByTab[t.key]})</span>}
          </button>
        ))}
      </div>
      {tab === 'parametros'
        ? <ParametrosEditor parametros={parametros} />
        : tab === 'perfiles'
        ? <PerfilesEditor perfiles={perfiles} tableros={tableros} />
        : <CatalogManager key={tab} tabla={tab as CatalogoTabla} fields={FIELDS[tab as CatalogoTabla]} rows={rowsByTab[tab as CatalogoTabla] ?? []} />}
    </div>
  );
}

function emptyRow(fields: Field[]): Row {
  const r: Row = {};
  for (const f of fields) r[f.key] = f.type === 'bool' ? true : '';
  return r;
}

function CatalogEditForm({ title, tabla, fields, draft, setDraft, error, saving, save, cancel }: {
  title: string;
  tabla: CatalogoTabla;
  fields: Field[];
  draft: Row;
  setDraft: React.Dispatch<React.SetStateAction<Row>>;
  error: string | null;
  saving: boolean;
  save: () => void;
  cancel: () => void;
}) {
  function updateField(field: Field, rawValue: string) {
    const value = field.type === 'number' ? (rawValue === '' ? '' : Number(rawValue)) : rawValue;
    setDraft((current) => {
      const next = { ...current, [field.key]: value };
      if (tabla !== 'cot_tableros') return next;

      if (field.key === 'formato') {
        const areaM2 = calcAreaM2(rawValue);
        if (areaM2 !== null) next.area_m2 = areaM2;
      } else if (field.key === 'precio') {
        const precioM2 = calcPrecioM2(value, current.area_m2);
        if (precioM2 !== null) next.precio_m2 = precioM2;
      } else if (field.key === 'precio_m2') {
        const precio = calcPrecio(value, current.area_m2);
        if (precio !== null) next.precio = precio;
      }

      return next;
    });
  }

  return (
    <div className="bg-slate-50 p-4 border-b border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{tabla.replace('cot_', '')}</span>
      </div>
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {fields.map((f) => (
          <Campo key={f.key} label={`${f.label}${f.required ? ' *' : ''}`} info={TIPS_MATERIALES[f.key]}>
            {f.type === 'bool' ? (
              <div className="flex items-center gap-2 h-[34px] px-2.5 rounded-lg border border-slate-300 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={!!draft[f.key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-medium select-none">{draft[f.key] ? 'Activo' : 'Inactivo'}</span>
              </div>
            ) : (
              <input
                type={f.type === 'number' ? 'number' : 'text'}
                step="any"
                value={(draft[f.key] ?? '') as string | number}
                onChange={(e) => updateField(f, e.target.value)}
                className={`w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                  f.type === 'number' ? 'text-right font-mono tabular-nums' : ''
                }`}
              />
            )}
          </Campo>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>}
      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200/60">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function CatalogManager({ tabla, fields, rows }: { tabla: CatalogoTabla; fields: Field[]; rows: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  function startAdd() {
    setEditing(emptyRow(fields));
    setDraft(emptyRow(fields));
    setError(null);
  }
  function startEdit(r: Row) {
    setEditing(r);
    setDraft({ ...r });
    setError(null);
    containerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }
  function cancel() {
    setEditing(null);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await guardarFilaAction(tabla, (editing?.id as string) ?? null, draft);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Error');
      return;
    }
    setEditing(null);
    router.refresh();
  }
  async function remove(r: Row) {
    if (!r.id || !confirm('¿Eliminar este registro?')) return;
    const res = await eliminarFilaAction(tabla, r.id as string);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  const filtered = q ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) : rows;

  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <input
          placeholder="Buscar…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
        />
        <button
          onClick={startAdd}
          className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          + Agregar
        </button>
      </div>

      {editing && !editing.id ? (
        <div className="border-b border-slate-200">
          <CatalogEditForm title="Nuevo registro" tabla={tabla} fields={fields} draft={draft} setDraft={setDraft} error={error} saving={saving} save={save} cancel={cancel} />
        </div>
      ) : null}

      <div
        ref={containerRef}
        className="overflow-auto max-h-[calc(100vh-260px)] min-h-[360px] relative rounded-b-2xl"
      >
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-sm">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              {fields.map((f, idx) => (
                <th
                  key={f.key}
                  className={`px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 ${
                    idx === 0
                      ? 'sticky left-0 z-30 border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] min-w-[280px]'
                      : f.type === 'number'
                      ? 'text-right'
                      : ''
                  }`}
                >
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const isEven = i % 2 === 1;
              return (
                <Fragment key={(r.id as string) ?? i}>
                  <tr
                    className={`group border-b border-slate-100 ${
                      isEven ? 'bg-slate-50/50' : 'bg-white'
                    } hover:bg-slate-100/70 transition-colors`}
                  >
                    {fields.map((f, idx) => {
                      if (idx === 0) {
                        return (
                          <td
                            key={f.key}
                            className={`sticky left-0 z-10 ${
                              isEven ? 'bg-slate-50' : 'bg-white'
                            } group-hover:bg-slate-100 border-r border-slate-200/80 border-b border-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] px-3 py-2.5 align-top transition-colors min-w-[280px]`}
                          >
                            <div
                              className="font-medium text-slate-900 text-sm whitespace-nowrap"
                              title={String(r[f.key] ?? '')}
                            >
                              {String(r[f.key] || '—')}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <button
                                type="button"
                                onClick={() => startEdit(r)}
                                className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded px-2 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => remove(r)}
                                aria-label="Eliminar"
                                title="Eliminar"
                                className="inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={f.key}
                          className={`px-3 py-2.5 whitespace-nowrap align-middle text-sm border-b border-slate-100 ${
                            f.type === 'number'
                              ? 'text-right font-mono tabular-nums text-slate-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {f.type === 'bool' ? (
                            r[f.key] ? (
                              <span
                                className="inline-flex items-center justify-center font-semibold text-emerald-600"
                                title="Activo"
                              >
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300" title="Inactivo">
                                —
                              </span>
                            )
                          ) : f.type === 'number' && r[f.key] != null && r[f.key] !== '' ? (
                            Number(r[f.key]).toLocaleString('es-CO')
                          ) : (
                            <div
                              className="max-w-[180px] truncate"
                              title={String(r[f.key] ?? '')}
                            >
                              {(r[f.key] as string) || '—'}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {editing?.id === r.id ? (
                    <tr className="border-b border-slate-200">
                      <td colSpan={fields.length} className="p-0 bg-slate-50">
                        <div
                          className="sticky left-0"
                          style={{
                            width: containerWidth ? `${containerWidth}px` : '100%',
                            maxWidth: '100%',
                          }}
                        >
                          <CatalogEditForm title="Editar registro" tabla={tabla} fields={fields} draft={draft} setDraft={setDraft} error={error} saving={saving} save={save} cancel={cancel} />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={fields.length}
                  className="px-3 py-10 text-center text-slate-400"
                >
                  Sin registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Editor de perfiles de material (sets de rol -> tablero) ----
const ROLES_COMUNES = ['caja', 'refuerzo', 'frente', 'fondo', 'fondo_shaker', 'zocalo', 'panel', 'filler', 'lateral_cajon', 'cajon_madera'];

function PerfilesEditor({ perfiles, tableros }: { perfiles: PresetPerfil[]; tableros: Row[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<PresetPerfil | null>(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tableroOptions = useMemo(() => [...tableros]
    .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
    .map((t) => ({
      value: String(t.codigo),
      label: `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`,
      searchText: String(t.color_nombre ?? ''),
    })), [tableros]);

  function blank(): PresetPerfil {
    return { id: '', nombre: '', descripcion: '', valores: { caja: '', refuerzo: '', frente: '', fondo: '' }, es_default: false, activo: true, orden: (perfiles.length + 1) * 10 };
  }
  function startDup(p: PresetPerfil) {
    setEdit({ ...p, id: '', nombre: `${p.nombre} (copia)`, es_default: false, valores: { ...p.valores } });
    setError(null);
  }

  async function save() {
    if (!edit) return;
    setSaving(true); setError(null);
    const res = await guardarPerfilAction(edit.id || null, {
      nombre: edit.nombre, descripcion: edit.descripcion, valores: edit.valores,
      es_default: edit.es_default, activo: edit.activo, orden: edit.orden,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    setEdit(null); router.refresh();
  }
  async function del(id: string) {
    if (!confirm('¿Eliminar este perfil?')) return;
    const res = await eliminarPerfilAction(id);
    if (!res.ok) { alert(res.error); return; }
    router.refresh();
  }
  function setRol(rol: string, codigo: string) { setEdit((e) => e && ({ ...e, valores: { ...e.valores, [rol]: codigo } })); }
  function delRol(rol: string) { setEdit((e) => { if (!e) return e; const v = { ...e.valores }; delete v[rol]; return { ...e, valores: v }; }); }
  function addRol() {
    const r = nuevoRol.trim().toLowerCase().replace(/\s+/g, '_');
    if (!r || !edit) return;
    setEdit({ ...edit, valores: { ...edit.valores, [r]: edit.valores[r] ?? '' } });
    setNuevoRol('');
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <p className="text-sm text-slate-500">Cada perfil define qué tablero usar por rol (ej. zona Colombia 15mm, internacional 18mm, shaker, Salguero). El simulador y las cotizaciones permiten elegir el perfil.</p>
        <button onClick={() => { setEdit(blank()); setError(null); }} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm font-medium hover:bg-slate-800 whitespace-nowrap">+ Perfil</button>
      </div>

      {edit && (
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <h3 className="text-sm font-medium text-slate-900">{edit.id ? 'Editar' : 'Nuevo'} perfil</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <Campo label="Nombre"><input value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" /></Campo>
            <Campo label="Descripción"><input value={edit.descripcion ?? ''} onChange={(e) => setEdit({ ...edit, descripcion: e.target.value })} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" /></Campo>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={edit.es_default} onChange={(e) => setEdit({ ...edit, es_default: e.target.checked })} /> Predeterminado</label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={edit.activo} onChange={(e) => setEdit({ ...edit, activo: e.target.checked })} /> Activo</label>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase">Tableros por rol</p>
            {Object.keys(edit.valores).map((rol) => (
              <div key={rol} className="flex items-center gap-2">
                <span className="w-32 shrink-0 text-sm text-slate-600 capitalize">{rol.replace(/_/g, ' ')}</span>
                <div className="flex-1"><Combobox value={edit.valores[rol] ?? ''} options={tableroOptions} onChange={(v) => setRol(rol, v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— sin asignar —" /></div>
                <button onClick={() => delRol(rol)} className="text-slate-400 hover:text-red-600 px-1">✕</button>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <input list="roles-comunes" value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} placeholder="agregar rol (ej. zocalo)" className="w-48 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
              <datalist id="roles-comunes">{ROLES_COMUNES.map((r) => <option key={r} value={r} />)}</datalist>
              <button onClick={addRol} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">+ rol</button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar'}</button>
            <button onClick={() => setEdit(null)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm hover:bg-slate-100">Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-slate-100">
            <th className="px-3 py-2">Perfil</th><th className="px-3 py-2">Roles</th><th className="px-3 py-2">Default</th><th className="px-3 py-2">Activo</th><th className="px-3"></th>
          </tr></thead>
          <tbody>
            {perfiles.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-3 py-2"><div className="font-medium text-slate-900">{p.nombre}</div>{p.descripcion && <div className="text-xs text-slate-400">{p.descripcion}</div>}</td>
                <td className="px-3 py-2 text-slate-500">{Object.entries(p.valores).map(([r, c]) => `${r}: ${c}`).join(' · ') || '—'}</td>
                <td className="px-3 py-2">{p.es_default ? '✓' : '—'}</td>
                <td className="px-3 py-2">{p.activo ? '✓' : '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-right">
                  <button onClick={() => { setEdit({ ...p, valores: { ...p.valores } }); setError(null); }} className="text-slate-500 hover:text-slate-900 mr-3">Editar</button>
                  <button onClick={() => startDup(p)} className="text-slate-500 hover:text-slate-900 mr-3">Duplicar</button>
                  <button onClick={() => del(p.id)} className="text-slate-400 hover:text-red-600">✕</button>
                </td>
              </tr>
            ))}
            {perfiles.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">Sin perfiles. Crea el primero.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Input numérico con edición local en string: evita que el input controlado
// pierda el cursor al escribir (ver WikiLLM log 2026-08-04). Debe vivir fuera
// de ParametrosEditor para no recrearse (y perder su estado) en cada render.
function NumInput({ label, value, set, hint }: { label: string; value: number; set: (n: number) => void; hint?: string }) {
  const [localVal, setLocalVal] = useState(String(value));
  return (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-1">{label}{hint && <span className="text-slate-400"> · {hint}</span>}</span>
      <input
        type="number"
        step="any"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={(e) => {
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) set(n);
          else setLocalVal(String(value));
        }}
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
      />
    </label>
  );
}

// ---- Editor de parámetros globales ----
function ParametrosEditor({ parametros }: { parametros: Record<string, unknown> }) {
  const router = useRouter();
  const trm0 = (parametros.trm ?? {}) as { valor?: number; modo?: string };
  const marg0 = (parametros.margenes ?? {}) as Record<string, number>;
  const [trmValor, setTrmValor] = useState<number>(Number(trm0.valor ?? 4200));
  const [trmModo, setTrmModo] = useState<string>(String(trm0.modo ?? 'manual'));
  const [despMadera, setDespMadera] = useState<number>(Number(parametros.desperdicio_madera ?? 0.15) * 100);
  const [recargo, setRecargo] = useState<number>(Number(parametros.recargo_extra ?? 0.1) * 100);
  const [margenHerraje, setMargenHerraje] = useState<number>(Number(parametros.margen_herraje ?? 0.35) * 100);
  const [mMuebles, setMMuebles] = useState<number>(Number(marg0.muebles ?? 0.57) * 100);
  const [mFillers, setMFillers] = useState<number>(Number(marg0.fillers ?? 0.52) * 100);
  const [mPnTk, setMPnTk] = useState<number>(Number(marg0.pn_tk ?? 0.44) * 100);
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
      { key: 'desperdicio_madera', value: despMadera / 100 },
      { key: 'recargo_extra', value: recargo / 100 },
      { key: 'margen_herraje', value: margenHerraje / 100 },
      { key: 'margenes', value: { muebles: mMuebles / 100, fillers: mFillers / 100, pn_tk: mPnTk / 100 } },
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
      <section>
        <h3 className="text-sm font-medium text-slate-900 mb-3">Tasa de cambio</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <NumInput label="TRM (COP por USD)" value={trmValor} set={setTrmValor} />
          <label className="block">
            <span className="block text-xs text-slate-500 mb-1">Modo</span>
            <select value={trmModo} onChange={(e) => setTrmModo(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="manual">manual</option><option value="auto">auto</option>
            </select>
          </label>
        </div>
      </section>
      <section>
        <h3 className="text-sm font-medium text-slate-900 mb-3">Márgenes y recargos (%)</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <NumInput label="Margen muebles" value={mMuebles} set={setMMuebles} />
          <NumInput label="Margen fillers" value={mFillers} set={setMFillers} />
          <NumInput label="Margen paneles/zócalos" value={mPnTk} set={setMPnTk} />
          <NumInput label="Margen herraje" value={margenHerraje} set={setMargenHerraje} />
          {/* <NumInput label="Recargo extra" value={recargo} set={setRecargo} /> */}
          <NumInput label="Desperdicio madera" value={despMadera} set={setDespMadera} />
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
