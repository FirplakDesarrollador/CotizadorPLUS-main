'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ActualizarContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => setSessionReady(Boolean(data.session)));
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError('No pudimos actualizar la contraseña. Solicita un enlace nuevo e inténtalo otra vez.');
      return;
    }
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Crear nueva contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">Usa al menos 8 caracteres.</p>
        {sessionReady === false ? (
          <div className="mt-6 space-y-4">
            <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">El enlace es inválido o venció. Solicita uno nuevo para continuar.</p>
            <Link href="/recuperar-contrasena" className="block w-full rounded-lg bg-slate-900 py-2 text-center text-sm font-medium text-white hover:bg-slate-800">Solicitar otro enlace</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div><label htmlFor="password" className="block text-sm font-medium text-slate-700">Nueva contraseña</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" /></div>
            <div><label htmlFor="confirmation" className="block text-sm font-medium text-slate-700">Confirmar contraseña</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" /></div>
            {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" disabled={loading || sessionReady !== true} className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">{loading ? 'Actualizando…' : sessionReady === null ? 'Validando enlace…' : 'Actualizar contraseña'}</button>
          </form>
        )}
      </section>
    </main>
  );
}
