'use client';
import Combobox from '@/components/Combobox';
import { useMemo, useState } from 'react';

type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number };
type Perfil = { id: string; nombre: string; valores: Record<string, string> };

export type ProjectDefaults = {
  preset: Record<string, string>;
  cantoFrentes: string;
  cantoCaja: string;
  // recargoId: string;
  margen: string;
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
  const [perfilId, setPerfilId] = useState('');

  const tableroOptions = useMemo(
    () => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({ value: t.codigo, label: tableroLabel(t) })),
    [tableros]
  );

  function set(patch: Partial<ProjectDefaults>) {
    onChange({ ...defaults, ...patch });
  }

  function aplicarPerfil(id: string) {
    setPerfilId(id);
    const p = perfiles.find((x) => x.id === id);
    if (p) {
      onChange({
        ...defaults,
        preset: { ...defaults.preset, ...p.valores }
      });
    }
  }

  function setPresetRol(rol: string, value: string) {
    const board = tableros.find((t) => t.codigo === value);
    const nextPreset = { ...defaults.preset, [rol]: value };
    if (rol === 'caja') nextPreset.refuerzo = value;

    let nextCantoFrentes = defaults.cantoFrentes;
    let nextCantoCaja = defaults.cantoCaja;

    const getMatch = (target: string) => cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ?? cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ?? target;

    if (rol === 'frente') {
      if (board?.espesor_mm === 18) nextCantoFrentes = getMatch('22x1');
      if (board?.espesor_mm === 15) nextCantoFrentes = getMatch('19x0,45');
    }
    if (rol === 'caja') {
      if (board?.espesor_mm === 18) nextCantoCaja = getMatch('22x1');
      if (board?.espesor_mm === 15) nextCantoCaja = getMatch('19x0,45');
    }
    onChange({ ...defaults, preset: nextPreset, cantoFrentes: nextCantoFrentes, cantoCaja: nextCantoCaja });
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-blue-600 text-lg">⚙️</span>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Configuración global del proyecto</h3>
          <p className="text-xs text-slate-500">Estos materiales se asignan automáticamente a cada mueble que agregues. Puedes cambiarlos por mueble si es necesario.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* Selector de perfil preconfigurado de BD */}
        {perfiles.length > 0 && (
          <F label="Cargar perfil predefinido (Preset)">
            <select
              value={perfilId}
              onChange={(e) => aplicarPerfil(e.target.value)}
              className="inp"
            >
              <option value="">— seleccionar preset —</option>
              {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </F>
        )}

        {/* Tableros */}
        <F label="Tablero caja / refuerzos">
          <Combobox
            value={defaults.preset['caja'] ?? ''}
            options={tableroOptions}
            onChange={(v) => setPresetRol('caja', v)}
            placeholder="Buscar tablero…"
            allowEmpty
            emptyLabel="— seleccionar —"
          />
        </F>
        <F label="Tablero frente">
          <Combobox
            value={defaults.preset['frente'] ?? ''}
            options={tableroOptions}
            onChange={(v) => setPresetRol('frente', v)}
            placeholder="Buscar tablero…"
            allowEmpty
            emptyLabel="— seleccionar —"
          />
        </F>
        <F label="Tablero fondo">
          <Combobox
            value={defaults.preset['fondo'] ?? ''}
            options={tableroOptions}
            onChange={(v) => setPresetRol('fondo', v)}
            placeholder="Buscar tablero…"
            allowEmpty
            emptyLabel="— seleccionar —"
          />
        </F>

        {/* Cantos */}
        <F label="Canto frentes">
          <select
            value={defaults.cantoFrentes}
            onChange={(e) => set({ cantoFrentes: e.target.value })}
            className="inp"
          >
            <option value="">Por defecto</option>
            {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </F>
        <F label="Canto caja">
          <select
            value={defaults.cantoCaja}
            onChange={(e) => set({ cantoCaja: e.target.value })}
            className="inp"
          >
            <option value="">Por defecto</option>
            {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </F>

        {/* <F label="Cliente (recargo)">
          <select
            value={defaults.recargoId}
            onChange={(e) => set({ recargoId: e.target.value })}
            className="inp"
          >
            <option value="">Sin recargo</option>
            {recargos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.cliente_nombre} (+{(r.recargo_pct * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
        </F> */}

        {/* Margen */}
        <F label="Margen (%)">
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            placeholder="auto (sistema)"
            value={defaults.margen}
            onChange={(e) => set({ margen: e.target.value })}
            className="inp"
          />
        </F>
      </div>

      <style>{`.inp{width:100%;border:1px solid #bfdbfe;border-radius:.5rem;padding:.4rem .6rem;font-size:.8rem;background:white}.inp:focus{outline:2px solid #93c5fd;outline-offset:0}`}</style>
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
