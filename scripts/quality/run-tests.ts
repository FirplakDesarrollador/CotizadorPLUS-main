import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadBaseline, ROOT_DIR, type Baseline } from './common';

export interface TestExecutionResult {
  total: number;
  passed: number;
  failed: number;
  durationsByTest: Record<string, number>;
  slowTests: Array<{ name: string; durationMs: number; suite?: string }>;
  newFailures: Array<{ name: string; errorSnippet: string }>;
  knownFailuresEncountered: Array<{ name: string }>;
  passedKnownFailures: Array<{ name: string }>;
  violations: string[];
  rawOutput: string;
  exitCode: number;
  durationMs: number;
}

export function executeTests(testFiles: string[], baseline?: Baseline): TestExecutionResult {
  const currentBaseline = baseline ?? loadBaseline();
  if (testFiles.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      durationsByTest: {},
      slowTests: [],
      newFailures: [],
      knownFailuresEncountered: [],
      passedKnownFailures: [],
      violations: [],
      rawOutput: 'No tests to run',
      exitCode: 0,
      durationMs: 0,
    };
  }

  const startTime = Date.now();
  console.log(`\nEjecutando ${testFiles.length} suite(s) de pruebas...`);

  const tsxCli = path.join(ROOT_DIR, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const proc = fs.existsSync(tsxCli)
    ? spawnSync(process.execPath, [tsxCli, '--test', ...testFiles], {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        maxBuffer: 64 * 1024 * 1024,
      })
    : spawnSync('npx', ['tsx', '--test', ...testFiles], {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        shell: true,
        maxBuffer: 64 * 1024 * 1024,
      });

  const durationMs = Date.now() - startTime;
  const rawOutput = (proc.stdout || '') + '\n' + (proc.stderr || '');

  const durationsByTest: Record<string, number> = {};
  const slowTests: Array<{ name: string; durationMs: number; suite?: string }> = [];
  const knownFailuresSet = new Set(currentBaseline.knownFailingTests.map((k) => k.name.trim().toLowerCase()));

  const newFailures: Array<{ name: string; errorSnippet: string }> = [];
  const knownFailuresEncountered: Array<{ name: string }> = [];
  const violations: string[] = [];

  const lines = rawOutput.split(/\r?\n/);
  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let todo = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const totalMatch = line.match(/ℹ\s+tests\s+(\d+)/);
    if (totalMatch) total = parseInt(totalMatch[1], 10);
    const passMatch = line.match(/ℹ\s+pass\s+(\d+)/);
    if (passMatch) passed = parseInt(passMatch[1], 10);
    const failMatch = line.match(/ℹ\s+fail\s+(\d+)/);
    if (failMatch) failed = parseInt(failMatch[1], 10);
    const skipMatch = line.match(/ℹ\s+skipped\s+(\d+)/);
    if (skipMatch) skipped = parseInt(skipMatch[1], 10);
    const todoMatch = line.match(/ℹ\s+todo\s+(\d+)/);
    if (todoMatch) todo = parseInt(todoMatch[1], 10);

    const testMatch = line.match(/^[✔✖]\s+(.*?)\s+\((\d+(?:\.\d+)?)(ms|s)\)/);
    if (testMatch) {
      const testName = testMatch[1].trim();
      let testDur = parseFloat(testMatch[2]);
      if (testMatch[3] === 's') testDur *= 1000;
      durationsByTest[testName] = testDur;

      if (testDur >= 500) {
        slowTests.push({ name: testName, durationMs: testDur });
      }
    }

    const failItemMatch = line.match(/^✖\s+(.*?)\s+\(/);
    if (failItemMatch) {
      const testName = failItemMatch[1].trim();
      const isKnown = knownFailuresSet.has(testName.toLowerCase());

      const snippetLines: string[] = [];
      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        if (lines[j].startsWith('✔') || lines[j].startsWith('✖') || lines[j].startsWith('ℹ')) break;
        snippetLines.push(lines[j]);
      }
      const errorSnippet = snippetLines.join('\n').trim();

      if (isKnown) {
        knownFailuresEncountered.push({ name: testName });
      } else {
        newFailures.push({ name: testName, errorSnippet });
        violations.push(`[REGRESIÓN] Test fallido: "${testName}"\n${errorSnippet}`);
      }
    }
  }

  if (total === 0 && (passed > 0 || failed > 0)) {
    total = passed + failed;
  }

  if (proc.status !== 0 && failed === 0 && violations.length === 0) {
    violations.push(`[ERROR DE EJECUCIÓN] tsx --test terminó con exit ${proc.status ?? 1}.\n${rawOutput.slice(-600)}`);
  }

  if (skipped > 0 || todo > 0) {
    violations.push(`[POLÍTICA] Se detectaron pruebas saltadas o pendientes en runtime (skipped=${skipped}, todo=${todo}).`);
  }

  const passedKnownFailures: Array<{ name: string }> = [];
  currentBaseline.knownFailingTests.forEach((k) => {
    if (!knownFailuresEncountered.some((kf) => kf.name.toLowerCase() === k.name.toLowerCase())) {
      if (testFiles.some((tf) => tf.includes(k.suite))) {
        passedKnownFailures.push({ name: k.name });
      }
    }
  });

  if (failed > currentBaseline.rules.maxFailingTests) {
    violations.push(
      `[TRINQUETE] Fallaron ${failed} tests (máximo permitido por baseline: ${currentBaseline.rules.maxFailingTests}).`
    );
  }

  const exitCode = violations.length === 0 ? 0 : 1;

  return {
    total,
    passed,
    failed,
    durationsByTest,
    slowTests,
    newFailures,
    knownFailuresEncountered,
    passedKnownFailures,
    violations,
    rawOutput,
    exitCode,
    durationMs,
  };
}

if (require.main === module || process.argv[1]?.endsWith('run-tests.ts') || process.argv[1]?.endsWith('run-tests.js')) {
  const files = process.argv.slice(2);
  const result = executeTests(files.length > 0 ? files : ['tests/margen-global.test.ts']);
  console.log(`\nResultados: Total=${result.total}, Pass=${result.passed}, Fail=${result.failed}`);
  if (result.violations.length > 0) {
    console.error('Violaciones de trinquete:', result.violations);
    process.exit(1);
  } else {
    console.log('VERIFIED: Todas las pruebas pasaron.');
  }
}
