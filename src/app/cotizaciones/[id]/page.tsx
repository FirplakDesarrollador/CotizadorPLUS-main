import { notFound } from 'next/navigation';
import { getUserAndRole } from '@/lib/auth';
import { getCotizacion } from '@/lib/cotizaciones';
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
  const { user, rol } = await getUserAndRole();
  const { cabecera, cocinas } = await getCotizacion(id);
  if (!cabecera) notFound();
  const data = await getCotizadorData();

  // Si viene del formulario de creación, la config viene en ?cfg=<base64>
  const initialConfig = parseConfigParam(sp['cfg']);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={user?.email} rol={rol} active="cotizaciones" />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <CotizacionDetalleClient
          cabecera={cabecera as Parameters<typeof CotizacionDetalleClient>[0]['cabecera']}
          cocinas={cocinas as Cocina[]}
          cotizacionId={id}
          tipos={data.tipos}
          recargos={data.recargos}
          tableros={data.tableros}
          cantos={data.cantos}
          presetDefault={data.presetDefault}
          rolesByTipo={data.rolesByTipo}
          initialConfig={initialConfig}
          perfiles={data.perfiles}
          perfilDefaultId={data.perfilDefaultId}
          herrajesByTipo={data.herrajesByTipo}
        />
      </main>
    </div>
  );
}
