'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agregarLineaAction, editarLineaAction } from '../actions';
import Combobox from '@/components/Combobox';
import Campo from '@/components/Campo';
import { TIPS_COTIZADOR } from '@/lib/tooltips';
import { DB_TIPOLOGIAS } from '@/lib/muebles';

type Tipo = { id: string; pref: string; pref_imperial?: string | null; pref_metrico?: string | null; nombre_es: string | null };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Perfil = { id: string; nombre: string; descripcion: string | null; valores: Record<string, string> };
type HerrajeTipo = { rol: string; codigo: string | null };

export type ProjectDefaults = {
  preset: Record<string, string>;
  cantoFrentes: string;
  cantoCaja: string;
  // recargoId: string;
  margen: string;
};

export type LineaInicial = {
  lineaId: string;
  tipoId: string;
  largo: string | number;
  alto: string | number;
  prof: string | number;
  unidad: 'in' | 'cm' | 'mm';
  preset: Record<string, string>;
  conHerrajes: boolean;
  recargoPct: number;
  cantidad: number;
  modoFrentes: 'normal' | 'sin_frentes' | 'solo_frentes';
  overrides: Record<string, number> | null;
  herrajesExcluidos: string[] | null;
  margenOverride?: number;
  cantoFrentes?: string;
  cantoCaja?: string;
};

const ROL_LABEL: Record<string, string> = { caja: 'Tablero caja', refuerzo: 'Tablero refuerzos', frente: 'Tablero frente', fondo: 'Tablero fondo' };

// Conversión exacta entre unidades vía milímetros.
const TO_MM: Record<'in' | 'cm' | 'mm', number> = { in: 25.4, cm: 10, mm: 1 };
const convertir = (v: number, de: 'in' | 'cm' | 'mm', a: 'in' | 'cm' | 'mm') =>
  (v * TO_MM[de]) / TO_MM[a];

const getCantoMatch = (cantos: string[], target: string) =>
  cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ??
  cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ??
  target;

export default function AddLineForm({
  cocinaId, tipos, tableros, cantos, presetDefault, rolesByTipo, perfiles, perfilDefaultId, herrajesByTipo, trm, sistemaMedida, projectDefaults, initial, onDone
}: {
  cocinaId: string;
  tipos: Tipo[];
  tableros: Tablero[];
  cantos: string[];
  presetDefault: Record<string, string>;
  rolesByTipo: Record<string, string[]>;
  perfiles: Perfil[];
  perfilDefaultId: string;
  herrajesByTipo: Record<string, HerrajeTipo[]>;
  trm: number;
  sistemaMedida: 'imperial' | 'metrico';
  projectDefaults?: ProjectDefaults;
  initial?: LineaInicial;
  onDone?: () => void;
}) {
  const router = useRouter();
  const esEdicion = !!initial;
  const sbfd = tipos.find((t) => t.pref === 'SBFD');
  const ov = initial?.overrides ?? null;
  const projectUnit: 'in' | 'cm' = sistemaMedida === 'metrico' ? 'cm' : 'in';
  const initialUnit = initial?.unidad ?? projectUnit;

  // Estados
  const [tipoId, setTipoId] = useState(initial?.tipoId ?? sbfd?.id ?? tipos[0]?.id ?? '');
  const [unidad] = useState<'in' | 'cm' | 'mm'>(projectUnit);
  const [largo, setLargo] = useState(initial?.largo != null ? String(convertir(Number(initial.largo), initialUnit, projectUnit)) : (projectUnit === 'in' ? '33' : '83.82'));
  const [alto, setAlto] = useState(initial?.alto != null ? String(convertir(Number(initial.alto), initialUnit, projectUnit)) : (projectUnit === 'in' ? '30' : '76.2'));
  const [prof, setProf] = useState(initial?.prof != null ? String(convertir(Number(initial.prof), initialUnit, projectUnit)) : (projectUnit === 'in' ? '24' : '60.96'));
  const [perfilId, setPerfilId] = useState(initial ? '' : perfilDefaultId);
  const [preset, setPreset] = useState<Record<string, string>>(() => {
    if (initial?.preset) return initial.preset;
    if (projectDefaults?.preset) return projectDefaults.preset;
    return presetDefault;
  });

  const [cantoFrentesSel, setCantoFrentesSel] = useState(() => {
    if (initial?.cantoFrentes !== undefined) return initial.cantoFrentes;
    if (projectDefaults?.cantoFrentes !== undefined) return projectDefaults.cantoFrentes;
    const b = tableros.find((t) => t.codigo === (presetDefault['frente']));
    if (b?.espesor_mm === 18) return getCantoMatch(cantos, '22x1');
    if (b?.espesor_mm === 15) return getCantoMatch(cantos, '19x0,45');
    return '';
  });

  const [cantoCajaSel, setCantoCajaSel] = useState(() => {
    if (initial?.cantoCaja !== undefined) return initial.cantoCaja;
    if (projectDefaults?.cantoCaja !== undefined) return projectDefaults.cantoCaja;
    const b = tableros.find((t) => t.codigo === (presetDefault['caja']));
    if (b?.espesor_mm === 18) return getCantoMatch(cantos, '22x1');
    if (b?.espesor_mm === 15) return getCantoMatch(cantos, '19x0,45');
    return '';
  });

  /* const [recargoId, setRecargoId] = useState(() => {
    if (initial) {
      return recargos.find((r) => r.recargo_pct === initial.recargoPct)?.id ?? '';
    }
    return projectDefaults?.recargoId ?? '';
  }); */

  const [conHerrajes, setConHerrajes] = useState(initial?.conHerrajes ?? true);
  const [herrajesExcl, setHerrajesExcl] = useState<string[]>(initial?.herrajesExcluidos ?? []);
  const [cantidad, setCantidad] = useState(initial?.cantidad ?? 1);
  const [margenInput, setMargenInput] = useState(initial?.margenOverride != null ? String(initial.margenOverride * 100) : (projectDefaults?.margen ?? ''));

  const [npuertas, setNpuertas] = useState(ov?.n_puertas != null ? String(ov.n_puertas) : '');
  const [ncajones, setNcajones] = useState(ov?.n_cajones != null ? String(ov.n_cajones) : '');
  const [nentrepanos, setNentrepanos] = useState(ov?.n_entrepanos != null ? String(ov.n_entrepanos) : '');
  const [nbarras, setNbarras] = useState(ov?.n_barras != null ? String(ov.n_barras) : '');
  const [dbTipo, setDbTipo] = useState('');
  const [modoFrentes, setModoFrentes] = useState<'normal' | 'sin_frentes' | 'solo_frentes'>(initial?.modoFrentes ?? 'normal');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapeos y opciones
  const roles = rolesByTipo[tipoId] ?? ['caja', 'frente', 'fondo'];
  const esDB = (tipos.find((t) => t.id === tipoId)?.pref ?? '').startsWith('DB');
  const herrajesTipo = herrajesByTipo[tipoId] ?? [];
  const tipo = tipos.find((t) => t.id === tipoId);
  const prefProyecto = (t: Tipo | undefined) => sistemaMedida === 'metrico'
    ? (t?.pref_metrico || t?.pref || '')
    : (t?.pref_imperial || t?.pref || '');

  const tipoOptions = tipos.map((t) => ({ value: t.id, label: `${prefProyecto(t)} — ${t.nombre_es ?? ''}` }));
  const tableroOptions = useMemo(() => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({ value: t.codigo, label: `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}` })), [tableros]);

  function aplicarPerfil(id: string) {
    setPerfilId(id);
    const p = perfiles.find((x) => x.id === id);
    if (p) setPreset({ ...p.valores });
  }

  function aplicarDbTipo(k: string) {
    setDbTipo(k);
    const t = DB_TIPOLOGIAS.find((x) => x.key === k);
    if (t) {
      setNcajones(String(t.nc));
      setNbarras(String(t.nb));
    }
  }

  const toggleHerraje = (rol: string) =>
    setHerrajesExcl((xs) => xs.includes(rol) ? xs.filter((x) => x !== rol) : [...xs, rol]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const overrides: Record<string, number> = {};
    if (npuertas !== '') overrides.n_puertas = Number(npuertas);
    if (ncajones !== '') overrides.n_cajones = Number(ncajones);
    if (nentrepanos !== '') overrides.n_entrepanos = Number(nentrepanos);
    if (nbarras !== '') overrides.n_barras = Number(nbarras);

    const payload = {
      tipoId,
      largo: Number(largo),
      alto: Number(alto),
      prof: Number(prof),
      unidad,
      preset,
      conHerrajes,
      trm,
      // recargoPct: recargos.find((r) => r.id === recargoId)?.recargo_pct ?? 0,
      cantidad,
      prefLabel: prefProyecto(tipo),
      modoFrentes,
      overrides: Object.keys(overrides).length ? overrides : undefined,
      herrajesExcluidos: conHerrajes && herrajesExcl.length ? herrajesExcl : undefined,
      // Andrés overrides
      margenOverride: margenInput !== '' ? Number(margenInput) / 100 : undefined,
      cantoFrentes: cantoFrentesSel !== '' ? cantoFrentesSel : undefined,
      cantoCaja: cantoCajaSel !== '' ? cantoCajaSel : undefined,
    };

    const res = esEdicion
      ? await editarLineaAction(initial!.lineaId, payload)
      : await agregarLineaAction(cocinaId, payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Error al guardar');
      return;
    }
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-slate-900">{esEdicion ? 'Editar mueble' : 'Agregar mueble'}</h2>
        {projectDefaults && (
          <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
            ✓ Materiales globales aplicados
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <L label="Tipo">
          <Combobox value={tipoId} options={tipoOptions} onChange={setTipoId} placeholder="Buscar tipo…" />
        </L>

        <div className="grid grid-cols-4 gap-1">
          <L label="Largo">
            <input type="text" value={largo} onChange={(e) => setLargo(e.target.value)} className="inp" />
          </L>
          <L label="Alto">
            <input type="text" value={alto} onChange={(e) => setAlto(e.target.value)} className="inp" />
          </L>
          <L label="Prof">
            <input type="text" value={prof} onChange={(e) => setProf(e.target.value)} className="inp" />
          </L>
          <L label="Un">
            <select value={unidad} disabled className="inp bg-slate-100" title="La unidad se fija al crear el proyecto">
              <option>{projectUnit}</option>
            </select>
          </L>
        </div>

        {/* <L label="Cliente (recargo)">
          <select value={recargoId} onChange={(e) => setRecargoId(e.target.value)} className="inp">
            <option value="">Sin recargo</option>
            {recargos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.cliente_nombre} (+{(r.recargo_pct * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
        </L> */}

        <div className="grid grid-cols-2 gap-1">
          <L label="Cantidad">
            <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(+e.target.value)} className="inp" />
          </L>
          <L label="Margen (%)">
            <input
              type="number"
              min={0} max={100} step={0.5}
              placeholder="auto"
              value={margenInput}
              onChange={(e) => setMargenInput(e.target.value)}
              className="inp"
            />
          </L>
        </div>

        <div className="grid grid-cols-3 gap-1 md:col-span-2">
          <L label="Nº puertas">
            <input type="number" placeholder="auto" value={npuertas} onChange={(e) => setNpuertas(e.target.value)} className="inp" />
          </L>
          <L label="Nº cajones">
            <input type="number" placeholder="auto" value={ncajones} onChange={(e) => setNcajones(e.target.value)} className="inp" />
          </L>
          <L label="Nº entrepaños">
            <input type="number" placeholder="auto" value={nentrepanos} onChange={(e) => setNentrepanos(e.target.value)} className="inp" />
          </L>
        </div>

        {esDB && (
          <div className="grid grid-cols-2 gap-1">
            <L label="Tipología DB">
              <select value={dbTipo} onChange={(e) => aplicarDbTipo(e.target.value)} className="inp">
                <option value="">— manual —</option>
                {DB_TIPOLOGIAS.map((t) => <option key={t.key} value={t.key} title={t.desc}>{t.key}</option>)}
              </select>
            </L>
            <L label="Nº barras (pares)">
              <input type="number" placeholder="0" value={nbarras} onChange={(e) => setNbarras(e.target.value)} className="inp" />
            </L>
          </div>
        )}

        {perfiles.length > 0 && (
          <L label="Perfil de material">
            <Combobox value={perfilId} options={perfiles.map((p) => ({ value: p.id, label: p.nombre }))} onChange={aplicarPerfil} placeholder="Elegir perfil…" />
          </L>
        )}

        {roles.filter((r) => r !== 'refuerzo').map((rol) => (
          <L key={rol} label={ROL_LABEL[rol] ?? `Tablero ${rol}`}>
            <Combobox
              value={preset[rol] ?? ''}
              options={tableroOptions}
              onChange={(v) => {
                setPreset((p) => ({ ...p, [rol]: v, ...(rol === 'caja' ? { refuerzo: v } : {}) }));
                const board = tableros.find((t) => t.codigo === v);
                if (rol === 'frente') {
                  if (board?.espesor_mm === 18) setCantoFrentesSel(getCantoMatch(cantos, '22x1'));
                  if (board?.espesor_mm === 15) setCantoFrentesSel(getCantoMatch(cantos, '19x0,45'));
                } else if (rol === 'caja') {
                  if (board?.espesor_mm === 18) setCantoCajaSel(getCantoMatch(cantos, '22x1'));
                  if (board?.espesor_mm === 15) setCantoCajaSel(getCantoMatch(cantos, '19x0,45'));
                }
              }}
              placeholder="Buscar tablero…"
              allowEmpty
            />
          </L>
        ))}

        <L label="Frentes">
          <select value={modoFrentes} onChange={(e) => setModoFrentes(e.target.value as 'normal' | 'sin_frentes' | 'solo_frentes')} className="inp">
            <option value="normal">Completo</option>
            <option value="sin_frentes">Sin frentes (open)</option>
            <option value="solo_frentes">Solo kit de frentes</option>
          </select>
        </L>

        <div className="grid grid-cols-2 gap-1 md:col-span-2">
          <L label="Canto frentes">
            <select value={cantoFrentesSel} onChange={(e) => setCantoFrentesSel(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </L>
          <L label="Canto caja">
            <select value={cantoCajaSel} onChange={(e) => setCantoCajaSel(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </L>
        </div>

        <div className="flex items-center gap-4 py-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={conHerrajes} onChange={(e) => setConHerrajes(e.target.checked)} /> Con herrajes
          </label>
        </div>

        {conHerrajes && herrajesTipo.length > 0 && (
          <div className="col-span-full rounded-lg border border-slate-200 p-2.5">
            <p className="text-[11px] font-medium text-slate-500 uppercase mb-1.5">Herrajes incluidos (destilda para excluir)</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {herrajesTipo.map((h) => (
                <label key={h.rol} className="flex items-center gap-1.5 text-sm text-slate-700 capitalize">
                  <input type="checkbox" checked={!herrajesExcl.includes(h.rol)} onChange={() => toggleHerraje(h.rol)} />
                  {h.rol}
                  {h.codigo ? <span className="text-slate-400 normal-case">· {h.codigo}</span> : null}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button disabled={loading} className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
          {loading ? 'Guardando…' : esEdicion ? 'Guardar cambios' : '+ Agregar a la cotización'}
        </button>
        {esEdicion && (
          <button type="button" onClick={onDone} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
            Cancelar
          </button>
        )}
      </div>

      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.4rem .5rem;font-size:.8rem}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}`}</style>
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <Campo label={label} info={TIPS_COTIZADOR[label]}>{children}</Campo>;
}
