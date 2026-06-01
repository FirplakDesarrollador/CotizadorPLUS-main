import Link from 'next/link';
import { signOutAction } from '@/app/cotizador/session-actions';

export default function AppHeader({ email, rol, active }: { email?: string; rol: string; active?: 'cotizador' | 'cotizaciones' | 'admin' | 'diseno' | 'manual' }) {
  const link = (href: string, label: string, key: string) => (
    <Link href={href} className={`px-3 py-1.5 rounded-lg text-sm ${active === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</Link>
  );
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 mr-2 flex items-center gap-1.5">
            Cotizador PLUS
            <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">v1.0.1</span>
          </span>
          {link('/cotizador', 'Simulador', 'cotizador')}
          {link('/cotizaciones', 'Cotizaciones', 'cotizaciones')}
          {rol === 'admin' && link('/admin', 'Materiales-Parámetros', 'admin')}
          {rol === 'admin' && link('/admin/diseno', 'Diseño', 'diseno')}
          {link('/manual', 'Manual', 'manual')}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="hidden sm:inline">{email}</span>
          <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 capitalize">{rol}</span>
          <form action={signOutAction}>
            <button className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-100">Salir</button>
          </form>
        </div>
      </div>
    </header>
  );
}
