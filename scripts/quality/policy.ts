import fs from 'node:fs';
import path from 'node:path';
import {
  BASELINE_PATH,
  getDiffBaseRef,
  loadBaseline,
  loadManifest,
  normalizePath,
  ROOT_DIR,
  runGitSafe,
  type Baseline,
} from './common';
import { getAllTestFiles } from './plan';

export interface PolicyViolation {
  rule: 'NO_SKIP_OR_TODO' | 'NO_DELETED_TESTS' | 'NO_BASELINE_REGRESSION' | 'NO_NEW_EXCLUDES' | 'MANIFEST_INTEGRITY';
  target: string;
  message: string;
}

export interface PolicyResult {
  passed: boolean;
  violations: PolicyViolation[];
  checkedTestFiles: number;
  durationMs: number;
}

const SKIP_CALL_REGEX = /\b(?:test|it|describe)\s*\.\s*(?:skip|todo|only)\s*\(/g;
const SKIP_OPTION_REGEX = /\b(?:test|it|describe)\s*\([^;\n]*,\s*\{[^}\n]*\b(?:skip|todo|only)\s*:\s*true\b/g;

export function findDisabledTestsInSource(source: string): string[] {
  const findings: string[] = [];
  const lines = source.split(/\r?\n/);

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    SKIP_CALL_REGEX.lastIndex = 0;
    SKIP_OPTION_REGEX.lastIndex = 0;

    if (SKIP_CALL_REGEX.test(line)) {
      findings.push(`Línea ${idx + 1}: uso prohibido de .skip/.todo/.only (${trimmed.slice(0, 90)})`);
    } else if (SKIP_OPTION_REGEX.test(line)) {
      findings.push(`Línea ${idx + 1}: opción prohibida { skip/todo/only: true } (${trimmed.slice(0, 90)})`);
    }
  });

  return findings;
}

export function countTestCases(source: string): number {
  const matches = source.match(/^\s*(?:test|it)\s*\(/gm);
  return matches ? matches.length : 0;
}

export function checkBaselineRegression(
  previous: Baseline | null,
  current: Baseline
): PolicyViolation[] {
  if (!previous) return [];
  const violations: PolicyViolation[] = [];

  if (current.rules.maxTypeErrors > previous.rules.maxTypeErrors) {
    violations.push({
      rule: 'NO_BASELINE_REGRESSION',
      target: 'docs/quality/baseline.json',
      message: `maxTypeErrors subió de ${previous.rules.maxTypeErrors} a ${current.rules.maxTypeErrors}.`,
    });
  }
  if (current.rules.maxLintErrors > previous.rules.maxLintErrors) {
    violations.push({
      rule: 'NO_BASELINE_REGRESSION',
      target: 'docs/quality/baseline.json',
      message: `maxLintErrors subió de ${previous.rules.maxLintErrors} a ${current.rules.maxLintErrors}.`,
    });
  }
  if (current.rules.maxFailingTests > previous.rules.maxFailingTests) {
    violations.push({
      rule: 'NO_BASELINE_REGRESSION',
      target: 'docs/quality/baseline.json',
      message: `maxFailingTests subió de ${previous.rules.maxFailingTests} a ${current.rules.maxFailingTests}.`,
    });
  }
  if (current.knownFailingTests.length > previous.knownFailingTests.length) {
    violations.push({
      rule: 'NO_BASELINE_REGRESSION',
      target: 'docs/quality/baseline.json',
      message: `knownFailingTests subió de ${previous.knownFailingTests.length} a ${current.knownFailingTests.length}.`,
    });
  }

  return violations;
}

export function checkExcludeAdditions(
  previousExcludes: string[],
  currentExcludes: string[],
  target: string
): PolicyViolation[] {
  const prevSet = new Set(previousExcludes);
  const added = currentExcludes.filter((entry) => !prevSet.has(entry));
  return added.map((entry) => ({
    rule: 'NO_NEW_EXCLUDES',
    target,
    message: `Se añadió un nuevo exclude/ignore no autorizado: "${entry}".`,
  }));
}

function extractEslintIgnores(content: string): string[] {
  const blockMatch = content.match(/globalIgnores\s*\(\s*\[([\s\S]*?)\]\s*\)/);
  if (!blockMatch) return [];
  const matches = blockMatch[1].match(/['"`]([^'"`]+)['"`]/g) ?? [];
  return matches.map((m) => m.slice(1, -1));
}

function readGitRefFile(ref: string, relPath: string): string | null {
  const out = runGitSafe(`git show ${ref}:${relPath}`);
  return out || null;
}

function getComparisonRefs(): string[] {
  const refs = ['HEAD'];
  const mergeBase = getDiffBaseRef();
  const head = runGitSafe('git rev-parse HEAD');
  if (mergeBase && mergeBase !== head) {
    refs.push(mergeBase);
  }
  return refs;
}

export function evaluatePolicy(): PolicyResult {
  const startTime = Date.now();
  const violations: PolicyViolation[] = [];
  const seenKeys = new Set<string>();
  const addViolation = (v: PolicyViolation) => {
    const key = `${v.rule}|${v.target}|${v.message}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      violations.push(v);
    }
  };

  const testFiles = getAllTestFiles();
  const comparisonRefs = getComparisonRefs();

  // 1. Escanear todas las suites activas por .skip/.todo/.only
  for (const relTest of testFiles) {
    const absPath = path.join(ROOT_DIR, relTest);
    if (!fs.existsSync(absPath)) continue;
    const source = fs.readFileSync(absPath, 'utf-8');
    const disabled = findDisabledTestsInSource(source);
    for (const msg of disabled) {
      addViolation({
        rule: 'NO_SKIP_OR_TODO',
        target: relTest,
        message: msg,
      });
    }
  }

  // 2. Detectar archivos de prueba eliminados o pérdida de casos de prueba frente a HEAD y merge-base
  for (const ref of comparisonRefs) {
    const deletedFilesOut = runGitSafe(`git diff --name-status --diff-filter=D ${ref} -- tests/`);
    if (deletedFilesOut) {
      for (const line of deletedFilesOut.split(/\r?\n/)) {
        const parts = line.trim().split(/\s+/);
        const deletedPath = parts[1];
        if (deletedPath && deletedPath.endsWith('.test.ts')) {
          addViolation({
            rule: 'NO_DELETED_TESTS',
            target: normalizePath(deletedPath),
            message: `Archivo de pruebas eliminado respecto a ${ref}: ${deletedPath}.`,
          });
        }
      }
    }

    const modifiedTestsOut = runGitSafe(`git diff --name-only ${ref} -- tests/`);
    if (modifiedTestsOut) {
      for (const rawFile of modifiedTestsOut.split(/\r?\n/)) {
        const relTest = normalizePath(rawFile.trim());
        if (!relTest.endsWith('.test.ts')) continue;
        const absPath = path.join(ROOT_DIR, relTest);
        if (!fs.existsSync(absPath)) continue;
        const refSource = readGitRefFile(ref, relTest);
        if (!refSource) continue;
        const currentSource = fs.readFileSync(absPath, 'utf-8');
        const prevCount = countTestCases(refSource);
        const currCount = countTestCases(currentSource);
        if (currCount < prevCount) {
          addViolation({
            rule: 'NO_DELETED_TESTS',
            target: relTest,
            message: `Se redujo la cantidad de casos de prueba de ${prevCount} a ${currCount} en ${relTest} (frente a ${ref}).`,
          });
        }
      }
    }
  }

  // 3. Prohibir subidas de baseline respecto a HEAD y merge-base (si el archivo cambió en la rama)
  if (fs.existsSync(BASELINE_PATH)) {
    const currentBaseline = loadBaseline();
    for (const ref of comparisonRefs) {
      const refBaselineRaw = readGitRefFile(ref, 'docs/quality/baseline.json');
      if (!refBaselineRaw) continue;
      try {
        const prevBaseline = JSON.parse(refBaselineRaw) as Baseline;
        checkBaselineRegression(prevBaseline, currentBaseline).forEach(addViolation);
      } catch {
        // Ignorar si el baseline histórico no es JSON válido
      }
    }
  }

  // 4. Prohibir nuevos exclude en tsconfig.json y globalIgnores en eslint.config.mjs
  const tsconfigPath = path.join(ROOT_DIR, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      const currTs = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8')) as { exclude?: string[] };
      for (const ref of comparisonRefs) {
        const refRaw = readGitRefFile(ref, 'tsconfig.json');
        if (!refRaw) continue;
        const prevTs = JSON.parse(refRaw) as { exclude?: string[] };
        checkExcludeAdditions(prevTs.exclude ?? [], currTs.exclude ?? [], 'tsconfig.json').forEach(addViolation);
      }
    } catch {
      // Ignorar si tsconfig tiene comentarios
    }
  }

  const eslintPath = path.join(ROOT_DIR, 'eslint.config.mjs');
  if (fs.existsSync(eslintPath)) {
    const currIgnores = extractEslintIgnores(fs.readFileSync(eslintPath, 'utf-8'));
    for (const ref of comparisonRefs) {
      const refRaw = readGitRefFile(ref, 'eslint.config.mjs');
      if (!refRaw) continue;
      const prevIgnores = extractEslintIgnores(refRaw);
      checkExcludeAdditions(prevIgnores, currIgnores, 'eslint.config.mjs').forEach(addViolation);
    }
  }

  // 5. Integridad del manifiesto: todas las rutas de prueba existen y ningún test activo queda huérfano
  const manifest = loadManifest();
  const mappedTests = new Set<string>();
  for (const lane of manifest.lanes) {
    for (const testRef of lane.tests) {
      if (testRef === 'tests/*.test.ts') {
        continue;
      }
      const norm = normalizePath(testRef);
      mappedTests.add(norm);
      if (!fs.existsSync(path.join(ROOT_DIR, norm))) {
        addViolation({
          rule: 'MANIFEST_INTEGRITY',
          target: norm,
          message: `El manifiesto referencia un archivo de pruebas inexistente en [${lane.id}]: ${norm}.`,
        });
      }
    }
  }

  for (const testFile of testFiles) {
    if (testFile === 'tests/quality-system.test.ts') continue;
    if (!mappedTests.has(testFile)) {
      addViolation({
        rule: 'MANIFEST_INTEGRITY',
        target: testFile,
        message: `La suite '${testFile}' no está asignada a ninguna capacidad funcional en quality/manifest.json.`,
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    checkedTestFiles: testFiles.length,
    durationMs: Date.now() - startTime,
  };
}

if (require.main === module || process.argv[1]?.endsWith('policy.ts') || process.argv[1]?.endsWith('policy.js')) {
  const res = evaluatePolicy();
  console.log('\n======================================================');
  console.log('        POLÍTICA DE NO REGRESIÓN (QUALITY:POLICY)     ');
  console.log('======================================================\n');
  console.log(`Suites revisadas: ${res.checkedTestFiles} (${res.durationMs}ms)`);
  if (res.passed) {
    console.log('VERIFIED: Cero violaciones de política (sin .skip/.todo, sin borrados, sin subidas de baseline ni nuevos exclude).');
  } else {
    console.error(`FAILED: Se detectaron ${res.violations.length} violación(es):`);
    res.violations.forEach((v) => {
      console.error(`  - [${v.rule}] ${v.target}: ${v.message}`);
    });
  }
  console.log('\n======================================================\n');
  process.exit(res.passed ? 0 : 1);
}
