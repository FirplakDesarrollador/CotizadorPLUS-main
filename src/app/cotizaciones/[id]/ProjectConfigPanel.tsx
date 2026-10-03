'use client';
import Combobox from '@/components/Combobox';
import { useMemo, useState } from 'react';

type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number };
type Perfil = { id: string; nombre: string; valores: Record<string, string> };
export type MaterialDefaults = { preset: Record<string, string>; cantoFrentes: string; cantoCaja: string; perfilId?: string; herrajesExcl?: string[] };

export type ProjectDefaults = {
  preset: Record<string, string>;
  cantoFrentes: string;
  cantoCaja: string;
  // recargoId: string;
  margen: string;
  conFondo?: boolean;
  materialesInferiores?: MaterialDefaults;
  materialesSuperiores?: MaterialDefaults;
  // Defaults del primer mueble (vienen del formulario de creación)
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

export default function ProjectConfigPanel({ tableros, cantos, perfiles, defaults, onChange }: ProjectConfigPanelProps) {
  const [perfilId, setPerfilId] = useState(defaults.materialesInferiores?.perfilId ?? defaults.perfilId ?? '');
  const [perfilSuperiorId, setPerfilSuperiorId] = useState(defaults.materialesSuperiores?.perfilId ?? '');
  const legacyMaterials: MaterialDefaults = {
    preset: defaults.preset,
    cantoFrentes: defaults.cantoFrentes,
    cantoCaja: defaults.cantoCaja,
    perfilId: defaults.perfilId,
    herrajesExcl: defaults.herrajesExcl,
  };
  const materialesInferiores = defaults.materialesInferiores ?? legacyMaterials;
  const materialesSuperiores = defaults.materialesSuperiores ?? legacyMaterials;

  const tableroOptions = useMemo(
    () => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({
      value: t.codigo,
      label: tableroLabel(t),
      searchText: t.color_nombre ?? '',
    })),
    [tableros]
  );

  function aplicarPerfil(id: string, familia: 'inferior' | 'superior') {
    if (familia === 'superior') setPerfilSuperiorId(id);
    else setPerfilId(id);
    const p = perfiles.find((x) => x.id === id);
    if (p) {
      const key = familia === 'superior' ? 'materialesSuperiores' : 'materialesInferiores';
      const actual = familia === 'superior' ? materialesSuperiores : materialesInferiores;
      const next = { ...actual, preset: { ...actual.preset, ...p.valores }, perfilId: id };
      onChange({ ...defaults, [key]: next, ...(familia === 'inferior' ? { ...next } : {}) });
    }
  }

  function setPresetRol(rol: string, value: string, familia: 'inferior' | 'superior') {
    const board = tableros.find((t) => t.codigo === value);
    const actual = familia === 'superior' ? materialesSuperiores : materialesInferiores;
    const nextPreset = { ...actual.preset, [rol]: value };
    if (rol === 'caja') nextPreset.refuerzo = value;

    let nextCantoFrentes = actual.cantoFrentes;
    let nextCantoCaja = actual.cantoCaja;

    const getMatch = (target: string) => cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ?? cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ?? target;

    if (rol === 'frente') {
      if (board?.espesor_mm === 18) nextCantoFrentes = getMatch('22x1');
      if (board?.espesor_mm === 15) nextCantoFrentes = getMatch('19x0,45');
    }
    if (rol === 'caja') {
      if (board?.espesor_mm === 18) nextCantoCaja = getMatch('22x1');
      if (board?.espesor_mm === 15) nextCantoCaja = getMatch('19x0,45');
    }
    const key = familia === 'superior' ? 'materialesSuperiores' : 'materialesInferiores';
    const next = { ...actual, preset: nextPreset, cantoFrentes: nextCantoFrentes, cantoCaja: nextCantoCaja };
    onChange({ ...defaults, [key]: next, ...(familia === 'inferior' ? { ...next } : {}) });
  }

  function setMaterial(familia: 'inferior' | 'superior', patch: Partial<MaterialDefaults>) {
    const key = familia === 'superior' ? 'materialesSuperiores' : 'materialesInferiores';
    const actual = familia === 'superior' ? materialesSuperiores : materialesInferiores;
    const next = { ...actual, ...patch };
    onChange({ ...defaults, [key]: next, ...(familia === 'inferior' ? { ...next } : {}) });
  }

  return (
    <div className="border-t border-slate-200 pt-4 mt-4">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900 text-sm">Materiales globales</h3>
        <p className="text-xs text-slate-500">Estos materiales se asignan automáticamente a cada mueble que agregues. Puedes cambiarlos por mueble si es necesario.</p>
      </div>

      <div className="space-y-4">
        <section className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">Módulos inferiores (B)</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {perfiles.length > 0 && (
              <F label="Cargar perfil predefinido (Preset)">
                <select value={perfilId} onChange={(e) => aplicarPerfil(e.target.value, 'inferior')} className="inp">
                  <option value="">— seleccionar preset —</option>
                  {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </F>
            )}
            <F label="Tablero caja / refuerzos">
              <Combobox value={materialesInferiores.preset['caja'] ?? ''} options={tableroOptions} onChange={(v) => setPresetRol('caja', v, 'inferior')} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
            </F>
            <F label="Tablero frente">
              <Combobox value={materialesInferiores.preset['frente'] ?? ''} options={tableroOptions} onChange={(v) => setPresetRol('frente', v, 'inferior')} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
            </F>
            <F label="Tablero fondo">
              <Combobox value={materialesInferiores.preset['fondo'] ?? ''} options={tableroOptions} onChange={(v) => setPresetRol('fondo', v, 'inferior')} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
            </F>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <F label="Canto frentes">
              <select value={materialesInferiores.cantoFrentes} onChange={(e) => setMaterial('inferior', { cantoFrentes: e.target.value })} className="inp">
                <option value="">Por defecto</option>
                {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Canto caja">
              <select value={materialesInferiores.cantoCaja} onChange={(e) => setMaterial('inferior', { cantoCaja: e.target.value })} className="inp">
                <option value="">Por defecto</option>
                {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
          </div>
        </section>

        <section className="space-y-2 border-t border-blue-200 pt-3">
          <p className="text-xs font-semibold text-slate-700">Muebles superiores (W y TW)</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {perfiles.length > 0 && (
              <F label="Cargar perfil predefinido (Preset)">
                <select value={perfilSuperiorId} onChange={(e) => aplicarPerfil(e.target.value, 'superior')} className="inp">
                  <option value="">— seleccionar preset —</option>
                  {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </F>
            )}
            <F label="Tablero caja / refuerzos">
              <Combobox value={materialesSuperiores.preset['caja'] ?? ''} options={tableroOptions} onChange={(v) => setPresetRol('caja', v, 'superior')} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
            </F>
            <F label="Tablero frente">
              <Combobox value={materialesSuperiores.preset['frente'] ?? ''} options={tableroOptions} onChange={(v) => setPresetRol('frente', v, 'superior')} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
            </F>
            <F label="Tablero fondo">
              <Combobox value={materialesSuperiores.preset['fondo'] ?? ''} options={tableroOptions} onChange={(v) => setPresetRol('fondo', v, 'superior')} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
            </F>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <F label="Canto frentes">
              <select value={materialesSuperiores.cantoFrentes} onChange={(e) => setMaterial('superior', { cantoFrentes: e.target.value })} className="inp">
                <option value="">Por defecto</option>
                {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Canto caja">
              <select value={materialesSuperiores.cantoCaja} onChange={(e) => setMaterial('superior', { cantoCaja: e.target.value })} className="inp">
                <option value="">Por defecto</option>
                {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
          </div>
        </section>

      </div>

      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.4rem .6rem;font-size:.8rem;background:white}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}`}</style>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
