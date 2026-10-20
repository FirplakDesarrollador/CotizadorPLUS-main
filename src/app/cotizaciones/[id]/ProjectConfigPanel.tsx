'use client';
import Combobox from '@/components/Combobox';
import { useMemo, useState } from 'react';
import { CLAVE_CONFIG_FAMILIA, ETIQUETA_FAMILIA, FAMILIAS_MATERIAL, type FamiliaMaterial } from '@/lib/muebles';
import { precioTableroCotizacion, type PreciosTablerosCotizacion } from '@/lib/precios-tableros';

type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null; precio_m2: number };
type Perfil = { id: string; nombre: string; valores: Record<string, string> };
export type MaterialDefaults = { preset: Record<string, string>; cantoFrentes: string; cantoCaja: string; perfilId?: string; herrajesExcl?: string[] };

export type ProjectDefaults = {
  preset: Record<string, string>;
  cantoFrentes: string;
  cantoCaja: string;
  margen: string;
  conFondo?: boolean;
  familiasMaterialesActivas?: FamiliaMaterial[];
  materialesInferiores?: MaterialDefaults;
  materialesSuperiores?: MaterialDefaults;
  materialesCloset?: MaterialDefaults;
  materialesBanos?: MaterialDefaults;
  preciosTableros?: PreciosTablerosCotizacion;
  tipoId?: string;
  largo?: string;
  alto?: string;
  prof?: string;
  unidad?: 'in' | 'cm' | 'mm';
  perfilId?: string;
  modoFrentes?: 'normal' | 'sin_frentes' | 'solo_frentes';
  conHerrajes?: boolean;
  herrajesExcl?: string[];
  npuertas?: string;
  ncajones?: string;
  nentrepanos?: string;
};

interface ProjectConfigPanelProps {
  tableros: Tablero[];
  cantos: string[];
  perfiles: Perfil[];
  defaults: ProjectDefaults;
  onChange: (next: ProjectDefaults) => void;
}

const tableroLabel = (t: Tablero) =>
  `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;

const ROLE_FIELDS = [
  ['caja', 'Tablero caja / refuerzos'],
  ['frente', 'Tablero frente (también Filler, Panel y Zócalo)'],
  ['fondo', 'Tablero fondo'],
] as const;

export default function ProjectConfigPanel({ tableros, cantos, defaults, onChange }: ProjectConfigPanelProps) {
  const legacyMaterials: MaterialDefaults = {
    preset: defaults.preset,
    cantoFrentes: defaults.cantoFrentes,
    cantoCaja: defaults.cantoCaja,
    perfilId: defaults.perfilId,
    herrajesExcl: defaults.herrajesExcl,
  };
  const inferidas = FAMILIAS_MATERIAL.filter((familia) => {
    const key = CLAVE_CONFIG_FAMILIA[familia] as keyof ProjectDefaults;
    return Boolean(defaults[key]);
  });
  const activas = defaults.familiasMaterialesActivas ?? (inferidas.length ? inferidas : ['inferior', 'superior']);

  const tableroOptions = useMemo(
    () => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({
      value: t.codigo,
      label: tableroLabel(t),
      searchText: t.color_nombre ?? '',
    })),
    [tableros],
  );

  function materialesDe(familia: FamiliaMaterial): MaterialDefaults {
    const key = CLAVE_CONFIG_FAMILIA[familia] as keyof ProjectDefaults;
    return (defaults[key] as MaterialDefaults | undefined) ?? legacyMaterials;
  }

  function setMaterial(familia: FamiliaMaterial, patch: Partial<MaterialDefaults>) {
    const key = CLAVE_CONFIG_FAMILIA[familia];
    const next = { ...materialesDe(familia), ...patch };
    onChange({
      ...defaults,
      [key]: next,
      familiasMaterialesActivas: activas.includes(familia) ? activas : [...activas, familia],
      ...(familia === 'inferior' ? { ...next } : {}),
    });
  }

  function toggleFamilia(familia: FamiliaMaterial) {
    if (activas.includes(familia)) {
      if (activas.length === 1) return;
      const next = { ...defaults, familiasMaterialesActivas: activas.filter((item) => item !== familia) };
      delete (next as Record<string, unknown>)[CLAVE_CONFIG_FAMILIA[familia]];
      onChange(next);
      return;
    }
    setMaterial(familia, materialesDe(familia));
  }

  function setPresetRol(familia: FamiliaMaterial, rol: string, value: string) {
    const actual = materialesDe(familia);
    const board = tableros.find((t) => t.codigo === value);
    const nextPreset = { ...actual.preset, [rol]: value };
    if (rol === 'caja') nextPreset.refuerzo = value;
    let cantoFrentes = actual.cantoFrentes;
    let cantoCaja = actual.cantoCaja;
    const getMatch = (target: string) => cantos.find((c) => c.toLowerCase() === target.toLowerCase())
      ?? cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase())
      ?? target;
    if (rol === 'frente' && board?.espesor_mm === 18) cantoFrentes = getMatch('22x1');
    if (rol === 'frente' && board?.espesor_mm === 15) cantoFrentes = getMatch('19x0,45');
    if (rol === 'caja' && board?.espesor_mm === 18) cantoCaja = getMatch('22x1');
    if (rol === 'caja' && board?.espesor_mm === 15) cantoCaja = getMatch('19x0,45');
    setMaterial(familia, { preset: nextPreset, cantoFrentes, cantoCaja });
  }

  function setPrecioTablero(codigo: string, precio: number) {
    if (!codigo || !Number.isFinite(precio) || precio < 0) return;
    onChange({ ...defaults, preciosTableros: { ...defaults.preciosTableros, [codigo]: precio } });
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Materiales globales</h3>
        <p className="text-xs text-slate-500">Incluye únicamente las familias que forman parte de esta cotización.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {FAMILIAS_MATERIAL.map((familia) => {
          const incluida = activas.includes(familia);
          const materiales = materialesDe(familia);
          return (
            <section key={familia} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className={incluida ? 'text-sm font-semibold text-slate-800' : 'text-sm font-semibold text-slate-400'}>{ETIQUETA_FAMILIA[familia]}</h4>
                <button type="button" aria-pressed={incluida} onClick={() => toggleFamilia(familia)} className={`rounded-lg border px-2 py-1 text-xs font-medium ${incluida ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-500'}`}>
                  {incluida ? 'Incluido' : 'Incluir'}
                </button>
              </div>
              {incluida ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {ROLE_FIELDS.map(([rol, label]) => {
                      const codigo = materiales.preset[rol] ?? '';
                      const precio = precioTableroCotizacion(codigo, tableros, defaults.preciosTableros);
                      return (
                        <F key={rol} label={label}>
                          <Combobox value={codigo} options={tableroOptions} onChange={(value) => setPresetRol(familia, rol, value)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
                          <PrecioTableroInput key={`${codigo}:${precio ?? ''}`} codigo={codigo} precio={precio} onCommit={setPrecioTablero} />
                        </F>
                      );
                    })}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <F label="Canto frentes"><select value={materiales.cantoFrentes} onChange={(e) => setMaterial(familia, { cantoFrentes: e.target.value })} className="inp"><option value="">Por defecto</option>{cantos.map((c) => <option key={c} value={c}>{c}</option>)}</select></F>
                    <F label="Canto caja"><select value={materiales.cantoCaja} onChange={(e) => setMaterial(familia, { cantoCaja: e.target.value })} className="inp"><option value="">Por defecto</option>{cantos.map((c) => <option key={c} value={c}>{c}</option>)}</select></F>
                  </div>
                </>
              ) : null}
            </section>
          );
        })}
      </div>
      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.4rem .6rem;font-size:.8rem;background:white}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}`}</style>
    </div>
  );
}

function PrecioTableroInput({ codigo, precio, onCommit }: { codigo: string; precio: number | null; onCommit: (codigo: string, precio: number) => void }) {
  const [draft, setDraft] = useState(precio == null ? '' : String(precio));
  return <span className="mt-1 block"><span className="mb-0.5 block text-[11px] text-slate-500">Valor tablero (COP/m²)</span><input type="number" min="0" step="1" inputMode="decimal" value={draft} disabled={!codigo} onChange={(event) => setDraft(event.target.value)} onBlur={() => { const value = Number(draft); if (draft !== '' && Number.isFinite(value) && value >= 0) onCommit(codigo, value); else setDraft(precio == null ? '' : String(precio)); }} className="inp" aria-label={`Valor del tablero ${codigo || 'sin seleccionar'} en pesos por metro cuadrado`} /></span>;
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>{children}</label>;
}
