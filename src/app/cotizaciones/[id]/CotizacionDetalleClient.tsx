'use client';
import { useState } from 'react';
import ProyectoHeader from './ProyectoHeader';
import CocinaCard from './CocinaCard';
import AddCocina from './AddCocina';
import GuideButton from '@/components/GuideButton';
import TooltipToggle from '@/components/TooltipToggle';
import ProjectConfigPanel, { type ProjectDefaults } from './ProjectConfigPanel';
import { eliminarCotizacionAction } from '../actions';

type LineaConfig = {
  preset?: Record<string, string>;
  conHerrajes?: boolean;
  recargoPct?: number;
  overrides?: Record<string, number> | null;
  modoFrentes?: 'normal' | 'sin_frentes' | 'solo_frentes';
  herrajesExcluidos?: string[] | null;
  margenOverride?: number;
  cantoFrentes?: string;
  cantoCaja?: string;
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
};

type Cocina = { id: string; nombre: string; total_cop: number; total_usd: number; lineas: Linea[] };
type Tipo = { id: string; pref: string; nombre_es: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Perfil = { id: string; nombre: string; descripcion: string | null; valores: Record<string, string> };
type HerrajeTipo = { rol: string; codigo: string | null };
type Cab = { id: string; nombre: string | null; cliente_nombre: string | null; moneda: string; trm: number; estado: string; total_cop: number; total_usd: number };

const GUIA_PROYECTO = [
  { title: 'Proyecto / cotización', description: 'Un proyecto agrupa cocinas, y cada cocina agrupa módulos (muebles). Así se arma una cotización completa.' },
  { selector: '[data-tour="proyecto"]', title: 'Datos del proyecto', description: 'Nombre, cliente, moneda, TRM y estado. Usa "editar" para cambiarlos. A la derecha ves el total.' },
  { selector: '[data-tour="config"]', title: 'Configuración global', description: 'Define los tableros, cantos, recargo y margen que se pre-llenan en cada mueble nuevo. Puedes cambiarlos por mueble si es necesario.' },
  { selector: '[data-tour="export"]', title: 'Exportar', description: 'Descarga la cotización en Excel, o ábrela como PDF para imprimir/guardar.' },
  { selector: '[data-tour="cocinas"]', title: 'Cocinas y módulos', description: 'Cada tarjeta es una cocina. Dentro agregas módulos con "+ Agregar módulo"; el subtotal por cocina se calcula solo.' },
  { selector: '[data-tour="add-cocina"]', title: 'Agregar cocina', description: 'Añade tantas cocinas como necesite el proyecto. El total del proyecto suma todas.' },
];

interface Props {
  cabecera: Cab;
  cocinas: Cocina[];
  cotizacionId: string;
  tipos: Tipo[];
  recargos: Recargo[];
  tableros: Tablero[];
  cantos: string[];
  presetDefault: Record<string, string>;
  rolesByTipo: Record<string, string[]>;
  initialConfig?: Partial<ProjectDefaults> | null;
  perfiles: Perfil[];
  perfilDefaultId: string;
  herrajesByTipo: Record<string, HerrajeTipo[]>;
}

export default function CotizacionDetalleClient({
  cabecera, cocinas, cotizacionId, tipos, recargos, tableros, cantos, presetDefault, rolesByTipo, initialConfig, perfiles, perfilDefaultId, herrajesByTipo
}: Props) {
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
        recargoId: initialConfig.recargoId ?? '',
        margen: initialConfig.margen ?? '',
      };
    }

    // Sin config del formulario: usar preset del sistema + cantos por defecto
    const frenteBoard = tableros.find((t) => t.codigo === presetDefault['frente']);
    const cajaBoard = tableros.find((t) => t.codigo === presetDefault['caja']);
    return {
      preset: { ...presetDefault },
      cantoFrentes: frenteBoard?.espesor_mm === 18 ? getCantoMatch('22x1') : '',
      cantoCaja: cajaBoard?.espesor_mm === 15 ? getCantoMatch('19x0,45') : '',
      recargoId: '',
      margen: '',
    };
  });

  const [showConfig, setShowConfig] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between gap-2" data-tour="proyecto">
        <div className="flex-1"><ProyectoHeader cab={cabecera} /></div>
        <div className="flex gap-2">
          <GuideButton steps={GUIA_PROYECTO} label="Guía" />
          <TooltipToggle />
        </div>
      </div>

      {/* Panel de configuración global colapsable */}
      <div data-tour="config">
        <button
          onClick={() => setShowConfig((s) => !s)}
          className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 bg-white rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors"
        >
          <span>⚙️</span>
          <span className="font-medium">Materiales del proyecto</span>
          <span className="text-slate-400 ml-1">{showConfig ? '▲ ocultar' : '▼ ver / editar'}</span>
          <span className="ml-3 text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
            {projectDefaults.preset['caja'] ? projectDefaults.preset['caja'].split('·')[0].trim() : 'Sin configurar'}
          </span>
        </button>
        {showConfig && (
          <div className="mt-2">
            <ProjectConfigPanel
              tableros={tableros}
              recargos={recargos}
              cantos={cantos}
              perfiles={perfiles}
              defaults={projectDefaults}
              onChange={setProjectDefaults}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2" data-tour="export">
        <a href={`/cotizaciones/${cotizacionId}/export`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">⬇ Exportar Excel</a>
        <a href={`/cotizaciones/${cotizacionId}/imprimir`} target="_blank" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">🖨 Imprimir / PDF</a>
      </div>

      <div className="space-y-4" data-tour="cocinas">
        {cocinas.map((c) => (
          <CocinaCard
            key={c.id}
            cotizacionId={cotizacionId}
            cocina={c}
            allCocinas={cocinas}
            tipos={tipos}
            recargos={recargos}
            tableros={tableros}
            cantos={cantos}
            presetDefault={presetDefault}
            rolesByTipo={rolesByTipo}
            perfiles={perfiles}
            perfilDefaultId={perfilDefaultId}
            herrajesByTipo={herrajesByTipo}
            trm={Number(cabecera.trm)}
            projectDefaults={projectDefaults}
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
