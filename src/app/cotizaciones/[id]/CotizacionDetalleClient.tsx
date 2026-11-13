'use client';
import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProyectoHeader from './ProyectoHeader';
import CocinaCard from './CocinaCard';
import AddCocina from './AddCocina';
import ProjectConfigPanel, { type ProjectDefaults } from './ProjectConfigPanel';
import { eliminarCotizacionAction, actualizarCotizacionAction, reordenarCocinasAction } from '../actions';
import VersionesCotizacion from './VersionesCotizacion';
import type { CotizacionVersion } from '@/lib/cotizaciones';
import { CLAVE_CONFIG_FAMILIA, type FamiliaMaterial } from '@/lib/muebles';
import { calcularMargenGlobalProyecto } from '@/lib/module-groups';
import { ALERTA_COMENTARIO, estadoRequiereAlertaComentario } from '@/lib/comentarios-cotizacion';
import { crearGuardadoSecuencial } from '@/lib/guardado-secuencial';
import UbicacionEditor from './UbicacionEditor';
import { calcularValoresCotizacion } from '@/lib/valores-cotizacion';

type LineaConfig = {
  preset?: Record<string, string>;
  conHerrajes?: boolean;
  // recargoPct?: number;
  overrides?: Record<string, number> | null;
  modoFrentes?: 'normal' | 'sin_frentes' | 'solo_frentes';
  herrajesExcluidos?: string[] | null;
  margenOverride?: number;
  cantoFrentes?: string;
  cantoCaja?: string;
  door?: number;
  doorHand?: 'L' | 'R';
  conFondo?: boolean;
};

type Linea = {
  id: string;
  pref: string | null;
  descripcion_es: string | null;
  anotaciones: string | null;
  cantidad: number;
  precio_unit_usd: number;
  precio_total_usd: number;
  precio_total_cop: number;
  tipo_mueble_id: string;
  largo: number;
  alto: number;
  prof: number;
  unidad_dim: string;
  config: LineaConfig | null;
  grupo_id: string | null;
  posicion_grupo: number;
  codigo_modulo: string | null;
  costo_sin_herrajes_cop?: number;
  costo_herrajes_cop?: number;
  costo_total_cop?: number;
  breakdown?: Record<string, unknown> | null;
  grupo?: { id: string; orden: number; etiqueta: string; codigo_grupo: string | null; total_cop: number; total_usd: number } | null;
};

type Cocina = { id: string; nombre: string; cantidad?: number; total_cop: number; total_usd: number; lineas: Linea[] };
type Tipo = { id: string; pref: string; pref_imperial?: string | null; pref_metrico?: string | null; nombre_es: string | null };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null; precio_m2: number };
type Perfil = { id: string; nombre: string; descripcion: string | null; valores: Record<string, string> };
type HerrajeTipo = { rol: string; codigo: string | null };
type Cab = { pais?: string; ciudad?: string | null; id: string; nombre: string | null; cliente_nombre: string | null; comprador_nombre?: string | null; cotizador_por: 'FIRPLAK' | 'CEMA'; moneda: string; trm: number; estado: string; notas?: string | null; total_cop: number; total_usd: number; sistema_medida: 'imperial' | 'metrico' };
export type ColumnasPrecio = { sinHerrajes: boolean; conHerrajes: boolean; usd: boolean; cop: boolean };
type UnidadProyecto = 'in' | 'cm' | 'mm';

const FACTOR_MM: Record<UnidadProyecto, number> = { in: 25.4, cm: 10, mm: 1 };

function convertirMedidaProyecto(valor: string | undefined, origen: UnidadProyecto, destino: UnidadProyecto) {
  if (valor == null || valor.trim() === '') return valor;
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return valor;
  return String(Math.round((numero * FACTOR_MM[origen] / FACTOR_MM[destino]) * 1e6) / 1e6);
}

interface Props {
  cabecera: Cab;
  cocinas: Cocina[];
  cotizacionId: string;
  lineasSinCocina: Linea[];
  tipos: Tipo[];
  tableros: Tablero[];
  cantos: string[];
  presetDefault: Record<string, string>;
  rolesByTipo: Record<string, string[]>;
  initialConfig?: Partial<ProjectDefaults> | null;
  perfiles: Perfil[];
  perfilDefaultId: string;
  herrajesByTipo: Record<string, HerrajeTipo[]>;
  versiones: CotizacionVersion[];
}

export default function CotizacionDetalleClient({
  cabecera, cocinas, cotizacionId, lineasSinCocina, tipos, tableros, cantos, presetDefault, rolesByTipo, initialConfig, perfiles, perfilDefaultId, herrajesByTipo, versiones
}: Props) {
  const unidadInicial: UnidadProyecto = cabecera.sistema_medida === 'metrico' ? 'cm' : 'in';
  // Estado global del proyecto: si viene initialConfig del query param ?cfg, úsalo;
  // si no, inicializar con el presetDefault del sistema.
  const [projectDefaults, setProjectDefaults] = useState<ProjectDefaults>(() => {
    const getCantoMatch = (target: string) =>
      cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ??
      cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ??
      target;

    if (initialConfig) {
      return {
        preset: initialConfig.preset ?? { ...presetDefault },
        cantoFrentes: initialConfig.cantoFrentes ?? '',
        cantoCaja: initialConfig.cantoCaja ?? '',
        // recargoId: initialConfig.recargoId ?? '',
        margen: initialConfig.margen ?? '',
        conFondo: initialConfig.conFondo ?? true,
        familiasMaterialesActivas: initialConfig.familiasMaterialesActivas,
        materialesInferiores: initialConfig.materialesInferiores,
        materialesSuperiores: initialConfig.materialesSuperiores,
        materialesCloset: initialConfig.materialesCloset,
        materialesBanos: initialConfig.materialesBanos,
        preciosTableros: initialConfig.preciosTableros,
        tipoId: initialConfig.tipoId,
        largo: initialConfig.largo,
        alto: initialConfig.alto,
        prof: initialConfig.prof,
        unidad: initialConfig.unidad ?? unidadInicial,
        perfilId: initialConfig.perfilId,
        modoFrentes: initialConfig.modoFrentes,
        conHerrajes: initialConfig.conHerrajes,
        herrajesExcl: initialConfig.herrajesExcl,
        npuertas: initialConfig.npuertas,
        ncajones: initialConfig.ncajones,
        nentrepanos: initialConfig.nentrepanos,
      };
    }

    // Sin config del formulario: usar preset del sistema + cantos por defecto
    const frenteBoard = tableros.find((t) => t.codigo === presetDefault['frente']);
    const cajaBoard = tableros.find((t) => t.codigo === presetDefault['caja']);
    return {
      preset: { ...presetDefault },
      cantoFrentes: frenteBoard?.espesor_mm === 18 ? getCantoMatch('22x1') : '',
      cantoCaja: cajaBoard?.espesor_mm === 15 ? getCantoMatch('19x0,45') : '',
      // recargoId: '',
      margen: '',
      conFondo: true,
      unidad: unidadInicial,
      materialesInferiores: {
        preset: { ...presetDefault },
        cantoFrentes: frenteBoard?.espesor_mm === 18 ? getCantoMatch('22x1') : '',
        cantoCaja: cajaBoard?.espesor_mm === 15 ? getCantoMatch('19x0,45') : '',
        perfilId: perfilDefaultId,
      },
      materialesSuperiores: {
        preset: { ...presetDefault },
        cantoFrentes: frenteBoard?.espesor_mm === 18 ? getCantoMatch('22x1') : '',
        cantoCaja: cajaBoard?.espesor_mm === 15 ? getCantoMatch('19x0,45') : '',
        perfilId: perfilDefaultId,
      },
    };
  });
  const [showCharacteristics, setShowCharacteristics] = useState(false);
  const [columnasPrecio, setColumnasPrecio] = useState<ColumnasPrecio>({ sinHerrajes: true, conHerrajes: true, usd: true, cop: true });

  const router = useRouter();
  const [ordenSecciones, setOrdenSecciones] = useState<string[] | null>(null);
  const [seccionArrastrada, setSeccionArrastrada] = useState<string | null>(null);
  const [seccionDestino, setSeccionDestino] = useState<string | null>(null);
  const [guardandoOrden, setGuardandoOrden] = useState(false);
  const [mensajeOrden, setMensajeOrden] = useState('');
  const [errorOrden, setErrorOrden] = useState('');
  const ordenEnCurso = useRef(false);
  const [seccionesPrevias, setSeccionesPrevias] = useState(cocinas);
  if (seccionesPrevias !== cocinas) {
    setSeccionesPrevias(cocinas);
    setOrdenSecciones(null);
  }
  const seccionesPorId = new Map(cocinas.map(c => [c.id, c]));
  const seccionesOrdenadas = ordenSecciones
    ? ordenSecciones.flatMap(id => { const seccion = seccionesPorId.get(id); return seccion ? [seccion] : []; })
    : cocinas;

  async function moverSeccion(origenId: string, destinoId: string) {
    setSeccionArrastrada(null);
    setSeccionDestino(null);
    if (ordenEnCurso.current || origenId === destinoId) return;
    const ordenAnterior = seccionesOrdenadas.map(c => c.id);
    const ids = [...ordenAnterior];
    const origen = ids.indexOf(origenId);
    const destino = ids.indexOf(destinoId);
    if (origen < 0 || destino < 0) return;
    ids.splice(origen, 1);
    ids.splice(destino, 0, origenId);
    ordenEnCurso.current = true;
    setOrdenSecciones(ids);
    setGuardandoOrden(true);
    setErrorOrden('');
    setMensajeOrden('');
    try {
      const resultado = await reordenarCocinasAction(cotizacionId, ids);
      if (!resultado.ok) throw new Error(resultado.error || 'No se pudo guardar el orden.');
      setMensajeOrden('Orden de secciones guardado.');
    } catch (error) {
      setOrdenSecciones(ordenAnterior);
      setErrorOrden(error instanceof Error ? error.message : 'No se pudo guardar el orden.');
    } finally {
      ordenEnCurso.current = false;
      setGuardandoOrden(false);
      router.refresh();
    }
  }
  const [guardadoMateriales, setGuardadoMateriales] = useState({ pendientes: 0, error: null as string | null });
  const guardarEnOrden = useMemo(() => crearGuardadoSecuencial<ProjectDefaults>(async next => {
    const resultado = await actualizarCotizacionAction(cotizacionId, { configDefault: next });
    if (!resultado.ok) throw new Error(resultado.error || 'No se pudieron aplicar los materiales.');
    router.refresh();
  }, (pendientes, error) => setGuardadoMateriales({ pendientes, error })), [cotizacionId, router]);

  async function guardarCaracteristicas(next: ProjectDefaults) {
    try {
      await guardarEnOrden(next);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  const margenGlobal = useMemo(
    () => calcularMargenGlobalProyecto(cocinas, cabecera.total_cop),
    [cocinas, cabecera.total_cop]
  );
  const valores = useMemo(() => calcularValoresCotizacion([...cocinas, { lineas: lineasSinCocina }], Number(cabecera.trm)), [cocinas, lineasSinCocina, cabecera.trm]);

  function handleProjectDefaultsChange(next: ProjectDefaults) {
    setProjectDefaults(next);
    void guardarCaracteristicas(next);
  }

  function handleUnidadProyectoChange(unidad: UnidadProyecto) {
    const unidadAnterior = projectDefaults.unidad ?? unidadInicial;
    if (unidad === unidadAnterior) return;
    handleProjectDefaultsChange({
      ...projectDefaults,
      unidad,
      largo: convertirMedidaProyecto(projectDefaults.largo, unidadAnterior, unidad),
      alto: convertirMedidaProyecto(projectDefaults.alto, unidadAnterior, unidad),
      prof: convertirMedidaProyecto(projectDefaults.prof, unidadAnterior, unidad),
    });
  }

  async function handleMargenBlur() {
    await guardarCaracteristicas(projectDefaults);
  }

  // Al agregar un mueble, sus materiales y cantos quedan como default del proyecto
  // para que el próximo mueble (incluso en otra pestaña o al día siguiente) arranque con los mismos valores.
  function handleMaterialesUsados(materiales: { familia: FamiliaMaterial; preset: Record<string, string>; cantoFrentes: string; cantoCaja: string; perfilId?: string; herrajesExcl?: string[] }) {
    const key = CLAVE_CONFIG_FAMILIA[materiales.familia];
    const materialSet = { preset: materiales.preset, cantoFrentes: materiales.cantoFrentes, cantoCaja: materiales.cantoCaja, perfilId: materiales.perfilId, herrajesExcl: materiales.herrajesExcl };
    handleProjectDefaultsChange({
      ...projectDefaults,
      [key]: materialSet,
      ...(materiales.familia === 'inferior' ? materialSet : {}),
    });
  }

  return (
    <>
      <div className="flex items-start justify-between gap-2" data-tour="proyecto">
        <div className="flex-1">
          <ProyectoHeader cab={cabecera} margenGlobal={margenGlobal} valores={valores} margenAplicado={projectDefaults.margen} columnasMoneda={{ usd: columnasPrecio.usd, cop: columnasPrecio.cop }} />
        </div>
      </div>

      <UbicacionEditor id={cabecera.id} pais={cabecera.pais ?? 'Colombia'} ciudad={cabecera.ciudad ?? null}/>
      <section data-tour="config" className="space-y-2">
        <button
          type="button"
          onClick={() => setShowCharacteristics((visible) => !visible)}
          aria-expanded={showCharacteristics}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <span aria-hidden="true">{showCharacteristics ? '▲' : '▼'}</span>
          <span>CARACTERÍSTICAS DEL PROYECTO</span>
        </button>
        {showCharacteristics ? (
          <ProyectoHeader
            cab={cabecera}
            editing
            onClose={() => setShowCharacteristics(false)}
            margen={projectDefaults.margen}
            onMargenChange={(margen) => setProjectDefaults((prev) => ({ ...prev, margen }))}
            onMargenBlur={handleMargenBlur}
            onSave={() => guardarCaracteristicas(projectDefaults)}
            margenGlobal={margenGlobal}
          >
            <p role="status" className={guardadoMateriales.error ? 'mt-3 text-sm text-red-700' : 'mt-3 text-sm text-slate-600'}>
              {guardadoMateriales.error || (guardadoMateriales.pendientes ? 'Aplicando materiales a todos los muebles, paneles y fillers…' : 'Materiales guardados y aplicados a los módulos del proyecto.')}
            </p>
            <ProjectConfigPanel
              tableros={tableros}
              cantos={cantos}
              perfiles={perfiles}
              defaults={projectDefaults}
              onChange={handleProjectDefaultsChange}
            />
          </ProyectoHeader>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <span className="font-semibold">Columnas de precio:</span>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={columnasPrecio.sinHerrajes} onChange={(e) => setColumnasPrecio((value) => ({ ...value, sinHerrajes: e.target.checked }))} />
          Sin herrajes
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={columnasPrecio.conHerrajes} onChange={(e) => setColumnasPrecio((value) => ({ ...value, conHerrajes: e.target.checked }))} />
          Con herrajes
        </label>
        <span className="h-5 border-l border-slate-300" aria-hidden="true" />
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={columnasPrecio.usd} onChange={(e) => setColumnasPrecio((value) => ({ ...value, usd: e.target.checked || !value.cop }))} />
          Dólares (USD)
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={columnasPrecio.cop} onChange={(e) => setColumnasPrecio((value) => ({ ...value, cop: e.target.checked || !value.usd }))} />
          Pesos colombianos (COP)
        </label>
        <span className="h-5 border-l border-slate-300" aria-hidden="true" />
        <label className="flex items-center gap-2 font-semibold text-slate-700">
          Unidad de medidas:
          <select
            value={projectDefaults.unidad ?? unidadInicial}
            onChange={(e) => handleUnidadProyectoChange(e.target.value as UnidadProyecto)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-normal text-slate-700 focus:outline-2 focus:outline-slate-400"
            aria-label="Unidad de medidas para módulos nuevos"
          >
            <option value="in">Pulgadas (in)</option>
            <option value="cm">Centímetros (cm)</option>
            <option value="mm">Milímetros (mm)</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2" data-tour="export">
        <a href={`/cotizaciones/${cotizacionId}/export?sinHerrajes=${columnasPrecio.sinHerrajes ? '1' : '0'}&conHerrajes=${columnasPrecio.conHerrajes ? '1' : '0'}&usd=${columnasPrecio.usd ? '1' : '0'}&cop=${columnasPrecio.cop ? '1' : '0'}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">⬇ Exportar Excel</a>
        <a
          href={`/cotizaciones/${cotizacionId}/imprimir?sinHerrajes=${columnasPrecio.sinHerrajes ? '1' : '0'}&conHerrajes=${columnasPrecio.conHerrajes ? '1' : '0'}&usd=${columnasPrecio.usd ? '1' : '0'}&cop=${columnasPrecio.cop ? '1' : '0'}`}
          onClick={(event) => {
            if (estadoRequiereAlertaComentario(cabecera.estado) && !window.confirm(ALERTA_COMENTARIO)) event.preventDefault();
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >🖨 Imprimir / PDF</a>
        <VersionesCotizacion cotizacionId={cotizacionId} versiones={versiones} estado={cabecera.estado} />
      </div>

      <div className="space-y-4" data-tour="cocinas">
        <p role="status" className="text-xs text-slate-500">{guardandoOrden ? 'Guardando orden de secciones…' : mensajeOrden || (cocinas.length > 1 ? 'Arrastra el asa de una sección o usa las flechas para cambiar su orden.' : '')}</p>
        {errorOrden && <p role="alert" className="text-sm text-red-600">{errorOrden}</p>}
        {seccionesOrdenadas.map((c, index) => (
          <div key={c.id} data-seccion-id={c.id}
            className={`rounded-2xl ${seccionDestino === c.id ? 'ring-2 ring-blue-400' : ''} ${seccionArrastrada === c.id ? 'opacity-50' : ''}`}
            onDragOver={event => {
              if (!event.dataTransfer.types.includes('application/x-cotizador-seccion') || guardandoOrden) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setSeccionDestino(c.id);
            }}
            onDrop={event => {
              const origen = event.dataTransfer.getData('application/x-cotizador-seccion');
              if (!seccionesPorId.has(origen)) return;
              event.preventDefault();
              event.stopPropagation();
              void moverSeccion(origen, c.id);
            }}>
          <CocinaCard
            cotizacionId={cotizacionId}
            cocina={c}
            allCocinas={seccionesOrdenadas}
            controlesOrden={
              <div className="flex shrink-0 items-center gap-1 text-slate-400">
                <button type="button" draggable={!guardandoOrden && cocinas.length > 1}
                  disabled={guardandoOrden || cocinas.length < 2}
                  aria-label={`Arrastrar sección ${c.nombre}`} title="Arrastrar sección"
                  className="cursor-grab rounded px-1 text-lg font-bold hover:text-blue-600 active:cursor-grabbing disabled:cursor-default disabled:opacity-20"
                  onDragStart={event => {
                    event.stopPropagation();
                    event.dataTransfer.setData('application/x-cotizador-seccion', c.id);
                    event.dataTransfer.effectAllowed = 'move';
                    setSeccionArrastrada(c.id);
                  }}
                  onDragEnd={() => { setSeccionArrastrada(null); setSeccionDestino(null); }}>⋮⋮</button>
                <div className="flex flex-col text-[9px] font-bold leading-tight">
                  <button type="button" aria-label={`Mover sección ${c.nombre} arriba`} title="Mover sección arriba"
                    disabled={guardandoOrden || index === 0} className="hover:text-blue-600 disabled:opacity-20"
                    onClick={() => void moverSeccion(c.id, seccionesOrdenadas[index - 1].id)}>▲</button>
                  <button type="button" aria-label={`Mover sección ${c.nombre} abajo`} title="Mover sección abajo"
                    disabled={guardandoOrden || index === seccionesOrdenadas.length - 1} className="hover:text-blue-600 disabled:opacity-20"
                    onClick={() => void moverSeccion(c.id, seccionesOrdenadas[index + 1].id)}>▼</button>
                </div>
              </div>
            }
            tipos={tipos}
            tableros={tableros}
            cantos={cantos}
            presetDefault={presetDefault}
            rolesByTipo={rolesByTipo}
            perfiles={perfiles}
            perfilDefaultId={perfilDefaultId}
            herrajesByTipo={herrajesByTipo}
            trm={Number(cabecera.trm)}
            sistemaMedida={cabecera.sistema_medida ?? 'imperial'}
            projectDefaults={projectDefaults}
            onMaterialesUsados={handleMaterialesUsados}
            columnasPrecio={columnasPrecio}
          />
          </div>
        ))}
        <div data-tour="add-cocina"><AddCocina cotizacionId={cotizacionId} /></div>
      </div>

      <form action={eliminarCotizacionAction.bind(null, cotizacionId)}>
        <button className="text-sm text-red-600 hover:underline">Eliminar proyecto</button>
      </form>
    </>
  );
}
