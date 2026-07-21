import { notFound } from 'next/navigation';
import { getUserAndRole } from '@/lib/auth';
import { getCotizacion } from '@/lib/cotizaciones';
import { getCotizadorData } from '@/lib/cotizar';
import AppHeader from '@/components/AppHeader';
import ProyectoHeader from './ProyectoHeader';
import CocinaCard from './CocinaCard-isazaale';
import AddCocina from './AddCocina';
import GuideButton from '@/components/GuideButton';
import { eliminarCotizacionAction } from '../actions';

const GUIA_PROYECTO = [
  { title: 'Proyecto / cotización', description: 'Un proyecto agrupa cocinas, y cada cocina agrupa módulos (muebles). Así se arma una cotización completa.' },
  { selector: '[data-tour="proyecto"]', title: 'Datos del proyecto', description: 'Nombre, cliente, moneda, TRM y estado. Usa "editar" para cambiarlos. A la derecha ves el total.' },
  { selector: '[data-tour="export"]', title: 'Exportar', description: 'Descarga la cotización en Excel, o ábrela como PDF para imprimir/guardar.' },
  { selector: '[data-tour="cocinas"]', title: 'Cocinas y módulos', description: 'Cada tarjeta es una cocina. Dentro agregas módulos con "+ Agregar módulo"; el subtotal por cocina se calcula solo.' },
  { selector: '[data-tour="add-cocina"]', title: 'Agregar cocina', description: 'Añade tantas cocinas como necesite el proyecto. El total del proyecto suma todas.' },
];

type LineaConfig = { preset?: Record<string, string>; conHerrajes?: boolean; recargoPct?: number; overrides?: Record<string, number> | null; modoFrentes?: 'normal' | 'sin_frentes' | 'solo_frentes'; herrajesExcluidos?: string[] | null };
type Linea = {
  id: string; pref: string | null; descripcion_es: string | null; cantidad: number;
  precio_unit_usd: number; precio_total_usd: number; precio_total_cop: number;
  tipo_mueble_id: string; largo: number; alto: number; prof: number; unidad_dim: string; config: LineaConfig | null;
};
type Cocina = { id: string; nombre: string; total_cop: number; total_usd: number; lineas: Linea[] };

export default async function CotizacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, rol } = await getUserAndRole();
  const { cabecera, cocinas } = await getCotizacion(id);
  if (!cabecera) notFound();
  const data = await getCotizadorData();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={user?.email} rol={rol} active="cotizaciones" />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <div className="flex items-start justify-between gap-2" data-tour="proyecto">
          <div className="flex-1"><ProyectoHeader cab={cabecera} /></div>
          <GuideButton steps={GUIA_PROYECTO} label="Guía" />
        </div>

        <div className="flex gap-2" data-tour="export">
          <a href={`/cotizaciones/${id}/export`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">⬇ Exportar Excel</a>
          <a href={`/cotizaciones/${id}/imprimir`} target="_blank" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">🖨 Imprimir / PDF</a>
        </div>

        <div className="space-y-4" data-tour="cocinas">
          {(cocinas as Cocina[]).map((c) => (
            <CocinaCard key={c.id} cotizacionId={id} cocina={c} tipos={data.tipos} tableros={data.tableros} presetDefault={data.presetDefault} rolesByTipo={data.rolesByTipo} perfiles={data.perfiles} perfilDefaultId={data.perfilDefaultId} herrajesByTipo={data.herrajesByTipo} trm={Number((cabecera as { trm?: number }).trm ?? data.trmDefault)} />
          ))}
          <div data-tour="add-cocina"><AddCocina cotizacionId={id} /></div>
        </div>

        <form action={eliminarCotizacionAction.bind(null, id)}>
          <button className="text-sm text-red-600 hover:underline">Eliminar proyecto</button>
        </form>
      </main>
    </div>
  );
}
