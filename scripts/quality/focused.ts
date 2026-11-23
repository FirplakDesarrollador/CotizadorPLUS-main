import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { normalizePath, ROOT_DIR } from './common';

function resolveTestTarget(arg: string): string | null {
  const normalized = normalizePath(arg.trim());
  const candidates = [
    normalized,
    normalized.startsWith('tests/') ? normalized : `tests/${normalized}`,
    normalized.endsWith('.test.ts') ? normalized : `tests/${normalized}.test.ts`,
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(ROOT_DIR, candidate))) {
      return candidate;
    }
  }
  return null;
}

function main(): void {
  const rawArgs = process.argv.slice(2).filter((a) => a !== '--');
  if (rawArgs.length === 0) {
    console.error('Uso: npm run test:focused -- <archivo-de-prueba> [otros...]');
    console.error('Ejemplo: npm run test:focused -- tests/margen-global.test.ts');
    process.exit(1);
  }

  const resolved: string[] = [];
  const missing: string[] = [];

  for (const arg of rawArgs) {
    const found = resolveTestTarget(arg);
    if (found) resolved.push(found);
    else missing.push(arg);
  }

  if (missing.length > 0) {
    console.error(`No se encontraron los archivos de prueba: ${missing.join(', ')}`);
    process.exit(1);
  }

  const start = Date.now();
  console.log(`Ejecutando prueba(s) enfocada(s): ${resolved.join(', ')}`);
  const proc = spawnSync('npx', ['tsx', '--test', ...resolved], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: true,
  });

  const elapsed = Date.now() - start;
  const code = proc.status ?? 1;
  console.log(`\nEstado test:focused: ${code === 0 ? 'VERIFIED' : 'FAILED'} (${elapsed}ms)`);
  process.exit(code);
}

main();
