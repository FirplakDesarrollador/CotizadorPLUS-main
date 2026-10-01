'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/actualizar-contrasena`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (resetError) {
      setError('No pudimos enviar el enlace. Inténtalo nuevamente en unos minutos.');
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>
        {sent ? (
          <div className="mt-6 space-y-4">
            <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Si existe una cuenta asociada a ese correo, recibirás un enlace de recuperación. Revisa también la carpeta de spam.</p>
            <button type="button" onClick={() => setSent(false)} className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Enviar a otro correo</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Correo electrónico</label>
            <input id="email" name="email" type="email" autoComplete="email" required placeholder="correo@firplak.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">{loading ? 'Enviando…' : 'Enviar enlace'}</button>
          </form>
        )}
        <Link href="/login" className="mt-5 block text-center text-sm font-medium text-blue-700 hover:underline">Volver al inicio de sesión</Link>
      </section>
    </main>
  );
}
