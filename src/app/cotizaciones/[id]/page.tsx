import { notFound } from 'next/navigation';
import { getUserAndRole } from '@/lib/auth';
import { getCotizacion } from '@/lib/cotizaciones';
import { getCotizadorData } from '@/lib/cotizar';
import AppHeader from '@/components/AppHeader';
import ProyectoHeader from './ProyectoHeader';
import CocinaCard from './CocinaCard';
import AddCocina from './AddCocina';
import { eliminarCotizacionAction } from '../actions';

type Linea = { id: string; pref: string | null; descripcion_es: string | null; cantidad: number; precio_unit_usd: number; precio_total_usd: number; precio_total_cop: number };
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
        <ProyectoHeader cab={cabecera} />

        <div className="space-y-4">
          {(cocinas as Cocina[]).map((c) => (
            <CocinaCard key={c.id} cotizacionId={id} cocina={c} tipos={data.tipos} recargos={data.recargos} tableros={data.tableros} presetDefault={data.presetDefault} rolesByTipo={data.rolesByTipo} />
          ))}
          <AddCocina cotizacionId={id} />
        </div>

        <form action={eliminarCotizacionAction.bind(null, id)}>
          <button className="text-sm text-red-600 hover:underline">Eliminar proyecto</button>
        </form>
      </main>
    </div>
  );
}
