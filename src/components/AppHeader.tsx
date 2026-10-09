import Link from 'next/link';
import { signOutAction } from '@/app/cotizador/session-actions';

export default function AppHeader({ email, rol, active }: { email?: string; rol: string; active?: 'cotizador' | 'cotizaciones' | 'admin' | 'diseno' | 'hdr' | 'optimizador' | 'manual' }) {
  const link = (href: string, label: string, key: string) => (
    <Link href={href} className={`px-3 py-1.5 rounded-lg text-sm ${active === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</Link>
  );
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div
        className="mx-auto grid w-full max-w-[1500px] items-start gap-4 px-4 py-1.5"
        style={{ gridTemplateColumns: '180px minmax(0, 1fr) 180px' }}
      >
        <div className="flex flex-col justify-self-start leading-none">
          <span className="whitespace-nowrap font-semibold text-slate-900" style={{ fontSize: 18 }}>Cotizador PLUS</span>
          <span className="mt-1 inline-block self-start whitespace-nowrap font-medium text-slate-900" style={{ fontSize: 12 }}>v1.0.3</span>
        </div>
        <div className="flex min-w-0 items-center justify-center">
          <nav className="flex items-center gap-1" aria-label="Navegación principal">
          {link('/cotizador', 'Simulador', 'cotizador')}
          {link('/cotizaciones', 'Cotizaciones', 'cotizaciones')}
          {rol === 'admin' && link('/admin', 'Materiales-Parámetros', 'admin')}
          {rol === 'admin' && link('/admin/diseno', 'Diseño', 'diseno')}
          {rol === 'admin' && link('/hdr', 'HDR', 'hdr')}
          {rol === 'admin' && link('/optimizador', 'Optimizador', 'optimizador')}
          {link('/manual', 'Manual', 'manual')}
          </nav>
        </div>
        <details
          className="relative text-sm text-slate-500"
          style={{ justifySelf: 'end' }}
        >
          <summary
            aria-label="Abrir menú de usuario"
            className="flex cursor-pointer items-center justify-center rounded-lg font-medium text-white hover:opacity-85 focus:outline-2 focus:outline-slate-400"
            style={{ width: 64, height: 36, backgroundColor: '#0f172a', listStyle: 'none' }}
          >
            User
          </summary>
          <div
            className="z-50 pt-2"
            style={{ position: 'absolute', right: 0, top: '100%', width: 256 }}
          >
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
              <p className="truncate text-sm font-medium text-slate-900">{email || 'Usuario'}</p>
              <p className="mt-0.5 text-xs capitalize text-slate-500">Rol: {rol}</p>
              <form action={signOutAction} className="mt-3 border-t border-slate-100 pt-2">
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">Cerrar sesión</button>
              </form>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

