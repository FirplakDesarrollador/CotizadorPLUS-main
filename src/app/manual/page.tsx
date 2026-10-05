import fs from 'node:fs';
import path from 'node:path';
import { getUserAndRole } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import ManualView from './ManualView';

export const dynamic = 'force-dynamic';

export default async function ManualPage() {
  const { user, rol } = await getUserAndRole();
  let content = '# Manual\n\nNo se encontró el documento del manual.';
  try {
    content = fs.readFileSync(path.join(process.cwd(), 'docs', 'MANUAL.md'), 'utf8');
  } catch { /* usa el fallback */ }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={user?.email} rol={rol} active="manual" />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <ManualView content={content} />
        </div>
      </main>
    </div>
  );
}
