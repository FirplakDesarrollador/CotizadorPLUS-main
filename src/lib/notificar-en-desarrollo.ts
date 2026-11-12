import 'server-only';
import { createClient } from '@supabase/supabase-js';

export async function notificarAdminsEnDesarrollo(input: { cotizacionId: string; nombre: string; estadoAnterior: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !from || !url || !serviceKey) {
    return 'Estado guardado, pero falta configurar RESEND_API_KEY, EMAIL_FROM o SUPABASE_SERVICE_ROLE_KEY para notificar a los administradores.';
  }
  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profiles, error } = await admin.from('cot_perfiles').select('user_id').eq('rol', 'admin');
    if (error) return 'Estado guardado, pero no se pudo consultar la lista de administradores para enviar la notificación.';
    const emails = (await Promise.all((profiles ?? []).map(async (profile) => {
      const { data } = await admin.auth.admin.getUserById(profile.user_id);
      return data.user?.email;
    }))).filter((email): email is string => Boolean(email));
    if (!emails.length) return 'Estado guardado, pero no se encontraron correos de administradores para notificar.';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: emails, subject: `Cotización en desarrollo: ${input.nombre}`,
        text: `La cotización "${input.nombre}" cambió de estado ${input.estadoAnterior} a En desarrollo.\n\nAbrir cotización: ${process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/cotizaciones/${input.cotizacionId}` : `https://${process.env.VERCEL_URL ?? 'localhost:3000'}/cotizaciones/${input.cotizacionId}`}`,
      }),
    });
    if (!response.ok) return 'Estado guardado, pero Resend no pudo enviar el aviso a los administradores.';
    return undefined;
  } catch {
    return 'Estado guardado, pero ocurrió un error al notificar a los administradores.';
  }
}
