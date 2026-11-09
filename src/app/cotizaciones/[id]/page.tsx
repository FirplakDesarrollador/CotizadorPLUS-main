import { notFound } from 'next/navigation';
import { puertasSegunReglas, requiereManoPuerta, manoValida } from '@/lib/mano-puerta';
import type { Regla } from '@/lib/engine';
import { getUserAndRole } from '@/lib/auth';
import { getCotizacion, listarVersionesCotizacion } from '@/lib/cotizaciones';
import { getCotizadorData } from '@/lib/cotizar';
import AppHeader from '@/components/AppHeader';
import CotizacionDetalleClient from './CotizacionDetalleClient';
import type { ProjectDefaults } from './ProjectConfigPanel';

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

type Cocina = { id: string; nombre: string; total_cop: number; total_usd: number; lineas: Linea[] };

function parseConfigParam(cfg: string | undefined): Partial<ProjectDefaults> | null {
  if (!cfg) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(cfg))) as ProjectDefaults;
  } catch {
    return null;
  }
}

export default async function CotizacionDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [{ user, rol, nombre }, { cabecera, cocinas, lineasSinCocina }, data, versiones] = await Promise.all([
    getUserAndRole(),
    getCotizacion(id),
    getCotizadorData(),
    listarVersionesCotizacion(id),
  ]);
  if (!cabecera) notFound();
  const aperturasPendientes = [...cocinas.flatMap(c => c.lineas), ...lineasSinCocina].filter(l => {
    const tipo = data.tipos.find((t: { id: string; pref: string; reglasPuertas?: Regla[] }) => t.id === l.tipo_mueble_id);
    const config = l.config as { manoPuerta?: unknown; overrides?: { n_puertas?: number } } | null;
    const puertas = puertasSegunReglas(tipo?.reglasPuertas, { largo: Number(l.largo), alto: Number(l.alto), prof: Number(l.prof), unidad: l.unidad_dim as 'in' | 'cm' | 'mm' }, config?.overrides?.n_puertas);
    return requiereManoPuerta(tipo?.pref, puertas) && !manoValida(config?.manoPuerta);
  });

  // La config de materiales globales queda guardada en el proyecto (config_default);
  // ?cfg=<base64> es solo el fallback del primer render justo tras crear el proyecto.
  const dbConfig = (cabecera as { config_default?: Partial<ProjectDefaults> | null }).config_default ?? null;
  const initialConfig = dbConfig ?? parseConfigParam(sp['cfg']);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader nombre={nombre} email={user?.email} rol={rol} active="cotizaciones" />
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 space-y-5">
        {aperturasPendientes.length > 0 && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Debes completar la apertura L/R de {aperturasPendientes.length} mueble(s) de una puerta.</p><p>Edita los siguientes muebles y selecciona L o R antes de generar las hojas de ruta:</p><ul className="list-disc pl-5">{aperturasPendientes.map(l => <li key={l.id}>{l.codigo_modulo ?? l.pref} · {cocinas.find(c => c.id === l.cocina_id)?.nombre ?? 'Sin sección'}</li>)}</ul></div>}
        <CotizacionDetalleClient
          cabecera={cabecera as Parameters<typeof CotizacionDetalleClient>[0]['cabecera']}
          cocinas={cocinas as Cocina[]}
          cotizacionId={id}
          tipos={data.tipos}
          tableros={data.tableros}
          cantos={data.cantos}
          presetDefault={data.presetDefault}
          rolesByTipo={data.rolesByTipo}
          initialConfig={initialConfig}
          perfiles={data.perfiles}
          perfilDefaultId={data.perfilDefaultId}
          herrajesByTipo={data.herrajesByTipo}
          versiones={versiones}
        />
      </main>
    </div>
  );
}
