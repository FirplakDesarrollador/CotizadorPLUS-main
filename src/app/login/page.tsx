'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setLoading(false);
      setError('El nombre es obligatorio.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoading(false); setError(error.message); return; }
    const { error: nombreError } = await supabase.rpc('cot_guardar_nombre_usuario', { p_nombre: nombreLimpio });
    setLoading(false);
    if (nombreError) {
      await supabase.auth.signOut();
      setError(nombreError.message);
      return;
    }
    router.push('/cotizador');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900">Cotizador PLUS</h1>
            <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">v1.0.3</span>
          </div>
          <p className="text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>
        <div className="space-y-3">
          <input type="text" required maxLength={80} placeholder="Tu nombre" value={nombre}
            onChange={(e) => setNombre(e.target.value)} autoComplete="name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          <input type="email" required placeholder="correo@firplak.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          <input type="password" required placeholder="Contraseña" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
        </div>
        <div className="text-right">
          <Link href="/recuperar-contrasena" className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
