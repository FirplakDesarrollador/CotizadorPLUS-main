'use client';
import { useActionState, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { crearCotizacionAction } from './actions';
import Combobox from '@/components/Combobox';
import UbicacionCotizacion from '@/components/UbicacionCotizacion';
import { familiaMaterialPorPrefijo, type FamiliaMaterial } from '@/lib/muebles';

type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Perfil = { id: string; nombre: string; valores: Record<string, string> };
type Tipo = { id: string; pref: string; categoria?: string | null };
type HerrajeOpcion = { rol: string; codigo: string | null };

interface Props {
  tableros: Tablero[];
  cantos: string[];
  presetDefault: Record<string, string>;
  trmDefault: number;
  perfiles: Perfil[];
  perfilDefaultId: string;
  tipos: Tipo[];
  herrajesByTipo: Record<string, HerrajeOpcion[]>;
}

const tableroLabel = (t: Tablero) =>
  `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;

const getCantoMatch = (cantos: string[], target: string) =>
  cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ??
  cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ??
  target;

export default function NuevoCotizacionForm({
  tableros, cantos, presetDefault, trmDefault, tipos, herrajesByTipo,
}: Props) {
  const router = useRouter();
  const [pais, setPais] = useState('Colombia');
  const [ciudad, setCiudad] = useState('');

  const [moneda, setMoneda] = useState<'USD' | 'COP'>('USD');
  const [conFondo, setConFondo] = useState(true);
  const [preset, setPreset] = useState<Record<string, string>>({ ...presetDefault });
  const [presetSuperior, setPresetSuperior] = useState<Record<string, string>>({ ...presetDefault });

  const [cantoFrentes, setCantoFrentes] = useState(() => {
    const b = tableros.find((t) => t.codigo === presetDefault['frente']);
    if (b?.espesor_mm === 18) return getCantoMatch(cantos, '22x1');
    if (b?.espesor_mm === 15) return getCantoMatch(cantos, '19x0,45');
    return '';
  });
  const [cantoCaja, setCantoCaja] = useState(() => {
    const b = tableros.find((t) => t.codigo === presetDefault['caja']);
    if (b?.espesor_mm === 18) return getCantoMatch(cantos, '22x1');
    if (b?.espesor_mm === 15) return getCantoMatch(cantos, '19x0,45');
    return '';
  });
  const [cantoFrentesSuperior, setCantoFrentesSuperior] = useState(cantoFrentes);
  const [cantoCajaSuperior, setCantoCajaSuperior] = useState(cantoCaja);

  const [herrajesExclInferiores, setHerrajesExclInferiores] = useState<string[]>([]);
  const [herrajesExclSuperiores, setHerrajesExclSuperiores] = useState<string[]>([]);

  // Closet y banos arrancan con los mismos tableros que inferiores: lo normal es
  // que cambie uno o dos, no los cuatro bloques desde cero.
  const [presetCloset, setPresetCloset] = useState<Record<string, string>>({ ...presetDefault });
  const [presetBanos, setPresetBanos] = useState<Record<string, string>>({ ...presetDefault });
  const [cantoFrentesCloset, setCantoFrentesCloset] = useState(cantoFrentes);
  const [cantoCajaCloset, setCantoCajaCloset] = useState(cantoCaja);
  const [cantoFrentesBanos, setCantoFrentesBanos] = useState(cantoFrentes);
  const [cantoCajaBanos, setCantoCajaBanos] = useState(cantoCaja);
  // Closet no lleva herrajes aqui: se cargan desde la cotizacion.
  const [herrajesExclBanos, setHerrajesExclBanos] = useState<string[]>([]);
  // Los dos bloques arrancan apagados: la mayoria de los proyectos son de cocina y
  // no llevan closet ni banos. Apagado no se guarda en la configuracion, asi que
  // esos modulos siguen cotizandose con el material de inferiores.
  const [closetActivo, setClosetActivo] = useState(false);
  const [banosActivo, setBanosActivo] = useState(false);
  const [inferioresActivo, setInferioresActivo] = useState(true);
  const [superioresActivo, setSuperioresActivo] = useState(true);
  const algunaFamiliaActiva = inferioresActivo || superioresActivo || closetActivo || banosActivo;

  function handleTablero(rol: string, value: string) {
    const board = tableros.find((t) => t.codigo === value);
    setPreset((p) => ({ ...p, [rol]: value, ...(rol === 'caja' ? { refuerzo: value } : {}) }));
    if (rol === 'caja') {
      if (board?.espesor_mm === 18) setCantoCaja(getCantoMatch(cantos, '22x1'));
      else if (board?.espesor_mm === 15) setCantoCaja(getCantoMatch(cantos, '19x0,45'));
    } else if (rol === 'frente') {
      if (board?.espesor_mm === 18) setCantoFrentes(getCantoMatch(cantos, '22x1'));
      else if (board?.espesor_mm === 15) setCantoFrentes(getCantoMatch(cantos, '19x0,45'));
    }
  }

  function handleTableroSuperior(rol: string, value: string) {
    const board = tableros.find((t) => t.codigo === value);
    setPresetSuperior((p) => ({ ...p, [rol]: value, ...(rol === 'caja' ? { refuerzo: value } : {}) }));
    if (rol === 'caja') {
      if (board?.espesor_mm === 18) setCantoCajaSuperior(getCantoMatch(cantos, '22x1'));
      else if (board?.espesor_mm === 15) setCantoCajaSuperior(getCantoMatch(cantos, '19x0,45'));
    } else if (rol === 'frente') {
      if (board?.espesor_mm === 18) setCantoFrentesSuperior(getCantoMatch(cantos, '22x1'));
      else if (board?.espesor_mm === 15) setCantoFrentesSuperior(getCantoMatch(cantos, '19x0,45'));
    }
  }

  function handleTableroCloset(rol: string, value: string) {
    const board = tableros.find((t) => t.codigo === value);
    setPresetCloset((p) => ({ ...p, [rol]: value, ...(rol === 'caja' ? { refuerzo: value } : {}) }));
    if (rol === 'caja') {
      if (board?.espesor_mm === 18) setCantoCajaCloset(getCantoMatch(cantos, '22x1'));
      else if (board?.espesor_mm === 15) setCantoCajaCloset(getCantoMatch(cantos, '19x0,45'));
    } else if (rol === 'frente') {
      if (board?.espesor_mm === 18) setCantoFrentesCloset(getCantoMatch(cantos, '22x1'));
      else if (board?.espesor_mm === 15) setCantoFrentesCloset(getCantoMatch(cantos, '19x0,45'));
    }
  }

  function handleTableroBanos(rol: string, value: string) {
    const board = tableros.find((t) => t.codigo === value);
    setPresetBanos((p) => ({ ...p, [rol]: value, ...(rol === 'caja' ? { refuerzo: value } : {}) }));
    if (rol === 'caja') {
      if (board?.espesor_mm === 18) setCantoCajaBanos(getCantoMatch(cantos, '22x1'));
      else if (board?.espesor_mm === 15) setCantoCajaBanos(getCantoMatch(cantos, '19x0,45'));
    } else if (rol === 'frente') {
      if (board?.espesor_mm === 18) setCantoFrentesBanos(getCantoMatch(cantos, '22x1'));
      else if (board?.espesor_mm === 15) setCantoFrentesBanos(getCantoMatch(cantos, '19x0,45'));
    }
  }

  const tableroOptions = useMemo(
    () => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({
      value: t.codigo,
      label: tableroLabel(t),
      searchText: t.color_nombre ?? '',
    })),
    [tableros]
  );

  const herrajesPorFamilia = useMemo(() => {
    const obtener = (familia: FamiliaMaterial) => {
      const porRol = new Map<string, HerrajeOpcion>();
      for (const tipo of tipos) {
        if (familiaMaterialPorPrefijo(tipo.pref) !== familia) continue;
        for (const herraje of herrajesByTipo[tipo.id] ?? []) {
          if (!porRol.has(herraje.rol)) porRol.set(herraje.rol, herraje);
        }
      }
      return [...porRol.values()].sort((a, b) => a.rol.localeCompare(b.rol));
    };
    return { inferior: obtener('inferior'), superior: obtener('superior'), banos: obtener('banos') };
  }, [tipos, herrajesByTipo]);

  function toggleHerraje(rol: string, familia: 'inferior' | 'superior' | 'banos') {
    const setter = familia === 'inferior' ? setHerrajesExclInferiores
      : familia === 'banos' ? setHerrajesExclBanos
      : setHerrajesExclSuperiores;
    setter((actual) => actual.includes(rol) ? actual.filter((item) => item !== rol) : [...actual, rol]);
  }

  const configObj = useMemo(() => ({
    preset: { ...preset, refuerzo: preset['caja'] ?? '' },
    cantoFrentes, cantoCaja, conFondo,
    familiasMaterialesActivas: ([
      inferioresActivo && 'inferior', superioresActivo && 'superior',
      closetActivo && 'closet', banosActivo && 'banos',
    ].filter(Boolean)),
    ...(inferioresActivo ? { materialesInferiores: {
      preset: { ...preset, refuerzo: preset['caja'] ?? '' },
      cantoFrentes, cantoCaja, herrajesExcl: herrajesExclInferiores,
    } } : {}),
    ...(superioresActivo ? { materialesSuperiores: {
      preset: { ...presetSuperior, refuerzo: presetSuperior['caja'] ?? '' },
      cantoFrentes: cantoFrentesSuperior, cantoCaja: cantoCajaSuperior, herrajesExcl: herrajesExclSuperiores,
    } } : {}),
    // Un bloque apagado no se guarda: sus modulos caen en inferiores, como antes de
    // que estas familias existieran.
    ...(closetActivo ? {
      materialesCloset: {
        preset: { ...presetCloset, refuerzo: presetCloset['caja'] ?? '' },
        cantoFrentes: cantoFrentesCloset, cantoCaja: cantoCajaCloset,
        // Sin herrajes: los de closet se cargan desde la cotizacion.
        herrajesExcl: [],
      },
    } : {}),
    ...(banosActivo ? {
      materialesBanos: {
        preset: { ...presetBanos, refuerzo: presetBanos['caja'] ?? '' },
        cantoFrentes: cantoFrentesBanos, cantoCaja: cantoCajaBanos, herrajesExcl: herrajesExclBanos,
      },
    } : {}),
  }), [preset, cantoFrentes, cantoCaja, conFondo, presetSuperior, cantoFrentesSuperior, cantoCajaSuperior, herrajesExclInferiores, herrajesExclSuperiores,
    presetCloset, cantoFrentesCloset, cantoCajaCloset,
    presetBanos, cantoFrentesBanos, cantoCajaBanos, herrajesExclBanos,
    inferioresActivo, superioresActivo, closetActivo, banosActivo]);

  const configEncoded = useMemo(
    () => btoa(encodeURIComponent(JSON.stringify(configObj))),
    [configObj]
  );

  const [state, formAction, pending] = useActionState(crearCotizacionAction, null);

  useEffect(() => {
    if (state?.ok && state.id) {
      router.push(`/cotizaciones/${state.id}?cfg=${configEncoded}`);
    }
  }, [state, configEncoded, router]);

  return (
    <form action={formAction} data-tour="nuevo" className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <input type="hidden" name="config_default" value={JSON.stringify(configObj)} />
      <h2 className="font-semibold text-slate-900">Nuevo proyecto / cotización</h2>

      {/* ── Datos del proyecto ── */}
      <section className="grid gap-3 md:grid-cols-2 md:items-start">
      <UbicacionCotizacion pais={pais} ciudad={ciudad} onPaisChange={setPais} onCiudadChange={setCiudad}/>
      <F label="Nombre del proyecto *">
        <input name="nombre" required placeholder="Ej. Cocina Torre A — Apto 502" className="inp" />
      </F>
      <F label="Constructora">
        <input name="cliente_nombre" placeholder="Constructora" className="inp" />
      </F>
      <F label="Comprador">
        <input name="comprador_nombre" placeholder="Comprador" className="inp" />
      </F>
      <F label="Cotizado">
        <select name="cotizador_por" defaultValue="FIRPLAK" className="inp">
          <option value="FIRPLAK">FIRPLAK</option>
          <option value="CEMA">CEMA</option>
        </select>
      </F>

      <label className="block">
        <span className="block text-xs text-slate-500 mb-1">Sistema de medidas y nomenclatura</span>
        <select name="sistema_medida" defaultValue="imperial"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="imperial">Pulgadas · nomenclatura imperial</option>
          <option value="metrico">Centímetros · nomenclatura métrica</option>
        </select>
        <span className="mt-1 block text-[11px] text-slate-400">Se fija para todo el proyecto y evita mezclar nomenclaturas.</span>
      </label>

      <fieldset>
        <legend className="block text-xs text-slate-500 mb-1">Configuración de fondo</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Configuración de fondo">
          {[
            { value: true, label: 'Con fondo' },
            { value: false, label: 'Sin fondo' },
          ].map((option) => (
            <label key={option.label} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${conFondo === option.value ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-slate-300 text-slate-600'}`}>
              <input type="radio" name="con_fondo" value={option.value ? 'true' : 'false'} checked={conFondo === option.value} onChange={() => setConFondo(option.value)} />
              {option.label}
            </label>
          ))}
        </div>
        <span className="mt-1 block text-[11px] text-slate-400">Aplica solo a los módulos inferiores: elimina esa pieza y deja la profundidad de la base en Profundidad menos un espesor de caja. Los muebles superiores siempre llevan fondo.</span>
      </fieldset>

      <div className="grid grid-cols-2 gap-2 md:col-start-2">
        <F label="Moneda">
          <select name="moneda" value={moneda} onChange={(e) => setMoneda(e.target.value as 'USD' | 'COP')} className="inp">
            <option value="USD">USD</option>
            <option value="COP">COP</option>
          </select>
        </F>
        {/* En COP la TRM no se edita, pero NO se deshabilita: un input deshabilitado
            no se envía con el formulario y `crearCotizacionAction` caería a su
            valor por omisión (4200), cambiando los totales USD. `readOnly` lo
            bloquea y conserva el dato, que el motor sigue necesitando: calcula en
            COP y divide por la TRM para la columna USD del listado. */}
        <F label="TRM" disabled={moneda === 'COP'}>
          <input
            name="trm" type="number" step="any" defaultValue={trmDefault}
            readOnly={moneda === 'COP'}
            aria-disabled={moneda === 'COP'}
            title={moneda === 'COP' ? 'Solo se edita con moneda USD' : undefined}
            className={`inp ${moneda === 'COP' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
          />
        </F>
      </div>
      {moneda === 'COP' && (
        <span className="mt-1 block text-[11px] text-slate-400 md:col-start-2">
          La TRM solo se edita con moneda USD. Se conserva porque el total en USD del listado se calcula con ella.
        </span>
      )}
      </section>

      {/* ── Materiales globales ── */}
      <div
        className="border-t border-slate-200 pt-4"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400" style={{ gridColumn: '1 / -1' }}>Materiales globales</p>

        <section className="space-y-2 rounded-xl border border-slate-200 p-4">
        <CabeceraFamilia titulo="Módulos inferiores (B)" activo={inferioresActivo} onToggle={() => setInferioresActivo((v) => !v)} />
        {inferioresActivo ? <>

        <F label="Tablero caja / refuerzos">
          <Combobox value={preset['caja'] ?? ''} options={tableroOptions}
            onChange={(v) => handleTablero('caja', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
        </F>
        <F label="Tablero frente (también Filler, Panel y Zócalo)">
          <Combobox value={preset['frente'] ?? ''} options={tableroOptions}
            onChange={(v) => handleTablero('frente', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
        </F>
        <F label="Tablero fondo" disabled={!conFondo}>
          <Combobox value={preset['fondo'] ?? ''} options={tableroOptions} disabled={!conFondo}
            onChange={(v) => handleTablero('fondo', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
        </F>

        <div className="grid grid-cols-2 gap-2">
          <F label="Canto frentes">
            <select value={cantoFrentes} onChange={(e) => setCantoFrentes(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
          <F label="Canto caja">
            <select value={cantoCaja} onChange={(e) => setCantoCaja(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
        </div>

        <SelectorHerrajes
          titulo="Herrajes inferiores (B/V)"
          opciones={herrajesPorFamilia.inferior}
          excluidos={herrajesExclInferiores}
          onToggle={(rol) => toggleHerraje(rol, 'inferior')}
        />
        </> : null}
        </section>

        <section className="space-y-2 rounded-xl border border-slate-200 p-4">
          <CabeceraFamilia titulo="Muebles superiores (W y TW)" activo={superioresActivo} onToggle={() => setSuperioresActivo((v) => !v)} />
          {superioresActivo ? <>

          <F label="Tablero caja / refuerzos">
            <Combobox value={presetSuperior['caja'] ?? ''} options={tableroOptions}
              onChange={(v) => handleTableroSuperior('caja', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
          </F>
          <F label="Tablero frente (también Filler, Panel y Zócalo)">
            <Combobox value={presetSuperior['frente'] ?? ''} options={tableroOptions}
              onChange={(v) => handleTableroSuperior('frente', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
          </F>
          <F label="Tablero fondo">
            <Combobox value={presetSuperior['fondo'] ?? ''} options={tableroOptions}
              onChange={(v) => handleTableroSuperior('fondo', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
          </F>

          <div className="grid grid-cols-2 gap-2">
            <F label="Canto frentes">
              <select value={cantoFrentesSuperior} onChange={(e) => setCantoFrentesSuperior(e.target.value)} className="inp">
                <option value="">Por defecto</option>
                {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Canto caja">
              <select value={cantoCajaSuperior} onChange={(e) => setCantoCajaSuperior(e.target.value)} className="inp">
                <option value="">Por defecto</option>
                {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
          </div>

          <SelectorHerrajes
            titulo="Herrajes superiores (W/TW)"
            opciones={herrajesPorFamilia.superior}
            excluidos={herrajesExclSuperiores}
            onToggle={(rol) => toggleHerraje(rol, 'superior')}
          />
          </> : null}
        </section>

        <section className="space-y-2 rounded-xl border border-slate-200 p-4">
          <CabeceraFamilia titulo="Closet/Walk in Closet" activo={closetActivo} onToggle={() => setClosetActivo((v) => !v)} />
          {closetActivo ? <>
          <F label="Tablero caja / refuerzos">
            <Combobox value={presetCloset['caja'] ?? ''} options={tableroOptions}
              onChange={(v) => handleTableroCloset('caja', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
          </F>
          <F label="Tablero frente (también Filler, Panel y Zócalo)">
            <Combobox value={presetCloset['frente'] ?? ''} options={tableroOptions}
              onChange={(v) => handleTableroCloset('frente', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
          </F>
          <F label="Tablero fondo">
            <Combobox value={presetCloset['fondo'] ?? ''} options={tableroOptions}
              onChange={(v) => handleTableroCloset('fondo', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
          </F>

          <div className="grid grid-cols-2 gap-2">
            <F label="Canto frentes">
              <select value={cantoFrentesCloset} onChange={(e) => setCantoFrentesCloset(e.target.value)} className="inp">
                <option value="">Por defecto</option>
                {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Canto caja">
              <select value={cantoCajaCloset} onChange={(e) => setCantoCajaCloset(e.target.value)} className="inp">
                <option value="">Por defecto</option>
                {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
          </div>

          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">Sin herrajes por defecto: los de closet y walk in closet se cargan desde la cotización, módulo por módulo.</p>
          </> : null}
        </section>

        <section className="space-y-2 rounded-xl border border-slate-200 p-4">
          <CabeceraFamilia titulo="Baños/Auxiliares" activo={banosActivo} onToggle={() => setBanosActivo((v) => !v)} />
          {banosActivo ? <>
          <F label="Tablero caja / refuerzos">
            <Combobox value={presetBanos['caja'] ?? ''} options={tableroOptions}
              onChange={(v) => handleTableroBanos('caja', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
          </F>
          <F label="Tablero frente (también Filler, Panel y Zócalo)">
            <Combobox value={presetBanos['frente'] ?? ''} options={tableroOptions}
              onChange={(v) => handleTableroBanos('frente', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
          </F>
          <F label="Tablero fondo" disabled={!conFondo}>
            <Combobox value={presetBanos['fondo'] ?? ''} options={tableroOptions} disabled={!conFondo}
              onChange={(v) => handleTableroBanos('fondo', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
          </F>

          <div className="grid grid-cols-2 gap-2">
            <F label="Canto frentes">
              <select value={cantoFrentesBanos} onChange={(e) => setCantoFrentesBanos(e.target.value)} className="inp">
                <option value="">Por defecto</option>
                {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Canto caja">
              <select value={cantoCajaBanos} onChange={(e) => setCantoCajaBanos(e.target.value)} className="inp">
                <option value="">Por defecto</option>
                {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
          </div>

          <SelectorHerrajes
              titulo="Herrajes de baños/auxiliares"
              opciones={herrajesPorFamilia.banos}
              excluidos={herrajesExclBanos}
              onToggle={(rol) => toggleHerraje(rol, 'banos')}
            />
          </> : null}
        </section>
      </div>

      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error ?? 'Error al crear el proyecto'}</p>
      )}

      {!algunaFamiliaActiva ? <p className="text-sm text-red-600">Incluye al menos una familia de muebles.</p> : null}
      <button disabled={pending || !algunaFamiliaActiva}
        className="w-full rounded-lg bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
        {pending ? 'Creando…' : 'Crear y agregar muebles'}
      </button>

      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.35rem .5rem;font-size:.8rem}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}`}</style>
    </form>
  );
}

function SelectorHerrajes({ titulo, opciones, excluidos, onToggle }: {
  titulo: string;
  opciones: HerrajeOpcion[];
  excluidos: string[];
  onToggle: (rol: string) => void;
}) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-xs font-semibold text-slate-700">{titulo}</legend>
      {opciones.length === 0 ? (
        <p className="text-xs text-slate-400">No hay herrajes configurados.</p>
      ) : (
        <div className="space-y-2">
          {opciones.map((herraje) => (
            <label key={herraje.rol} className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={!excluidos.includes(herraje.rol)}
                onChange={() => onToggle(herraje.rol)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium capitalize">{herraje.rol.replaceAll('_', ' ')}</span>
                {herraje.codigo ? <span className="block text-[11px] text-slate-400">{herraje.codigo}</span> : null}
              </span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

/**
 * Cabecera de un bloque de materiales que se puede apagar.
 *
 * La tarjeta solo muestra su nombre mientras esta apagada. Al incluirla despliega
 * los materiales y se persiste como una familia disponible del proyecto.
 */
function CabeceraFamilia({ titulo, activo, onToggle }: { titulo: string; activo: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <p className={`text-xs font-semibold ${activo ? 'text-slate-700' : 'text-slate-400'}`}>{titulo}</p>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={activo}
        className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
          activo
            ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700'
            : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-100'
        }`}
        title={activo ? `Quitar ${titulo} del proyecto` : `Incluir ${titulo} en el proyecto`}
      >
        {activo ? 'Incluido' : 'Incluir'}
      </button>
    </div>
  );
}

function F({ label, children, disabled = false }: { label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <label className="block">
      <span className={`block text-xs mb-0.5 ${disabled ? 'text-slate-300' : 'text-slate-500'}`}>{label}</span>
      {children}
    </label>
  );
}
