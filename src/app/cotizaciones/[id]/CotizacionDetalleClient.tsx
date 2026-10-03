'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProyectoHeader from './ProyectoHeader';
import CocinaCard from './CocinaCard';
import AddCocina from './AddCocina';
import GuideButton from '@/components/GuideButton';
import TooltipToggle from '@/components/TooltipToggle';
import ProjectConfigPanel, { type ProjectDefaults } from './ProjectConfigPanel';
import { eliminarCotizacionAction, actualizarCotizacionAction } from '../actions';
import VersionesCotizacion from './VersionesCotizacion';
import type { CotizacionVersion } from '@/lib/cotizaciones';
import type { FamiliaMaterial } from '@/lib/muebles';
import { calcularMargenGlobalProyecto } from '@/lib/module-groups';

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
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Perfil = { id: string; nombre: string; descripcion: string | null; valores: Record<string, string> };
type HerrajeTipo = { rol: string; codigo: string | null };
type Cab = { id: string; nombre: string | null; cliente_nombre: string | null; comprador_nombre?: string | null; moneda: string; trm: number; estado: string; total_cop: number; total_usd: number; sistema_medida: 'imperial' | 'metrico' };
export type ColumnasPrecio = { sinHerrajes: boolean; conHerrajes: boolean; usd: boolean; cop: boolean };
type UnidadProyecto = 'in' | 'cm' | 'mm';

const FACTOR_MM: Record<UnidadProyecto, number> = { in: 25.4, cm: 10, mm: 1 };

function convertirMedidaProyecto(valor: string | undefined, origen: UnidadProyecto, destino: UnidadProyecto) {
  if (valor == null || valor.trim() === '') return valor;
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return valor;
  return String(Math.round((numero * FACTOR_MM[origen] / FACTOR_MM[destino]) * 1e6) / 1e6);
}

const GUIA_PROYECTO = [
  { title: 'Proyecto / cotización', description: 'Un proyecto agrupa cocinas, y cada cocina agrupa módulos (muebles). Así se arma una cotización completa.' },
  { selector: '[data-tour="proyecto"]', title: 'Características del proyecto', description: 'Usa "editar" para cambiar en una sola sección nombre, cliente, moneda, TRM, estado, materiales y margen. A la derecha ves el total.' },
  { selector: '[data-tour="export"]', title: 'Exportar', description: 'Descarga la cotización en Excel, o ábrela como PDF para imprimir/guardar.' },
  { selector: '[data-tour="versiones"]', title: 'Versiones', description: 'Guarda puntos de retorno del proyecto y restaura una versión anterior cuando lo necesites.' },
  { selector: '[data-tour="cocinas"]', title: 'Cocinas y módulos', description: 'Cada tarjeta es una cocina. Dentro agregas módulos con "+ Agregar módulo"; el subtotal por cocina se calcula solo.' },
  { selector: '[data-tour="add-cocina"]', title: 'Agregar cocina', description: 'Añade tantas cocinas como necesite el proyecto. El total del proyecto suma todas.' },
];

interface Props {
  cabecera: Cab;
  cocinas: Cocina[];
  cotizacionId: string;
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
  cabecera, cocinas, cotizacionId, tipos, tableros, cantos, presetDefault, rolesByTipo, initialConfig, perfiles, perfilDefaultId, herrajesByTipo, versiones
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
        materialesInferiores: initialConfig.materialesInferiores,
        materialesSuperiores: initialConfig.materialesSuperiores,
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

  const margenGlobal = useMemo(
    () => calcularMargenGlobalProyecto(cocinas, cabecera.total_cop),
    [cocinas, cabecera.total_cop]
  );

  function handleProjectDefaultsChange(next: ProjectDefaults) {
    setProjectDefaults(next);
    actualizarCotizacionAction(cotizacionId, { configDefault: next }).catch(() => {});
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
    await actualizarCotizacionAction(cotizacionId, { configDefault: projectDefaults });
    router.refresh();
  }

  // Al agregar un mueble, sus materiales y cantos quedan como default del proyecto
  // para que el próximo mueble (incluso en otra pestaña o al día siguiente) arranque con los mismos valores.
  function handleMaterialesUsados(materiales: { familia: FamiliaMaterial; preset: Record<string, string>; cantoFrentes: string; cantoCaja: string; perfilId?: string; herrajesExcl?: string[] }) {
    const key = materiales.familia === 'superior' ? 'materialesSuperiores' : 'materialesInferiores';
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
          <ProyectoHeader cab={cabecera} margenGlobal={margenGlobal} />
        </div>
        <div className="flex gap-2">
          <GuideButton steps={GUIA_PROYECTO} label="Guía" />
          <TooltipToggle />
        </div>
      </div>

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
            onSave={async () => {
              await actualizarCotizacionAction(cotizacionId, { configDefault: projectDefaults });
              router.refresh();
              return { ok: true };
            }}
            margenGlobal={margenGlobal}
          >
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
        <a href={`/cotizaciones/${cotizacionId}/imprimir?sinHerrajes=${columnasPrecio.sinHerrajes ? '1' : '0'}&conHerrajes=${columnasPrecio.conHerrajes ? '1' : '0'}&usd=${columnasPrecio.usd ? '1' : '0'}&cop=${columnasPrecio.cop ? '1' : '0'}`} target="_blank" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">🖨 Imprimir / PDF</a>
        <VersionesCotizacion cotizacionId={cotizacionId} versiones={versiones} />
      </div>

      <div className="space-y-4" data-tour="cocinas">
        {cocinas.map((c) => (
          <CocinaCard
            key={c.id}
            cotizacionId={cotizacionId}
            cocina={c}
            allCocinas={cocinas}
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
        ))}
        <div data-tour="add-cocina"><AddCocina cotizacionId={cotizacionId} /></div>
      </div>

      <form action={eliminarCotizacionAction.bind(null, cotizacionId)}>
        <button className="text-sm text-red-600 hover:underline">Eliminar proyecto</button>
      </form>
    </>
  );
}
