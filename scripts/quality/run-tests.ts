import { spawnSync } from 'node:child_process';
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
  console.log(`\n🧪 Ejecutando ${testFiles.length} suite(s) de pruebas...`);

  // Ejecutamos tsx --test con la lista de archivos
  const proc = spawnSync('npx', ['tsx', '--test', ...testFiles], {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    shell: true,
  });

  const durationMs = Date.now() - startTime;
  const rawOutput = (proc.stdout || '') + '\n' + (proc.stderr || '');

  const durationsByTest: Record<string, number> = {};
  const slowTests: Array<{ name: string; durationMs: number; suite?: string }> = [];
  const knownFailuresSet = new Set(currentBaseline.knownFailingTests.map((k) => k.name.trim().toLowerCase()));

  const newFailures: Array<{ name: string; errorSnippet: string }> = [];
  const knownFailuresEncountered: Array<{ name: string }> = [];
  const violations: string[] = [];

  // Parsear líneas de resultados tipo: ✔ nombre (Xms) o ✖ nombre (Xms)
  const lines = rawOutput.split(/\r?\n/);
  let total = 0;
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Totalizadores al final: ℹ tests 201 / ℹ pass 197 / ℹ fail 4
    const totalMatch = line.match(/ℹ\s+tests\s+(\d+)/);
    if (totalMatch) total = parseInt(totalMatch[1], 10);
    const passMatch = line.match(/ℹ\s+pass\s+(\d+)/);
    if (passMatch) passed = parseInt(passMatch[1], 10);
    const failMatch = line.match(/ℹ\s+fail\s+(\d+)/);
    if (failMatch) failed = parseInt(failMatch[1], 10);

    // Detección de tiempos individuales
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

    // Detección de fallos individuales: ✖ nombre (Xms)
    const failItemMatch = line.match(/^✖\s+(.*?)\s+\(/);
    if (failItemMatch) {
      const testName = failItemMatch[1].trim();
      const isKnown = knownFailuresSet.has(testName.toLowerCase());

      // Capturar hasta 10 líneas de error snippet
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
        violations.push(`[REGRESIÓN] Test nuevo fallido: "${testName}"\n${errorSnippet}`);
      }
    }
  }

  // Si no se capturaron en el bucle individual, usar los totales de Node
  if (total === 0 && (passed > 0 || failed > 0)) {
    total = passed + failed;
  }

  // Detección de tests conocidos que ahora pasan (deuda pagada)
  const passedKnownFailures: Array<{ name: string }> = [];
  currentBaseline.knownFailingTests.forEach((k) => {
    if (!knownFailuresEncountered.some((kf) => kf.name.toLowerCase() === k.name.toLowerCase())) {
      // Si el archivo del test conocido estuvo entre los ejecutados y no falló, ¡pasó!
      if (testFiles.some((tf) => tf.includes(k.suite))) {
        passedKnownFailures.push({ name: k.name });
      }
    }
  });

  // Validación de trinquete: ¿Se superó el máximo de fallos permitidos?
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

// Ejecución como script directo para testing
if (require.main === module || process.argv[1]?.endsWith('run-tests.ts') || process.argv[1]?.endsWith('run-tests.js')) {
  const files = process.argv.slice(2);
  const result = executeTests(files.length > 0 ? files : ['tests/margen-global.test.ts']);
  console.log(`\nResultados: Total=${result.total}, Pass=${result.passed}, Fail=${result.failed}`);
  if (result.violations.length > 0) {
    console.error('Violaciones de trinquete:', result.violations);
    process.exit(1);
  } else {
    console.log('✅ Todos los tests pasaron o están en el baseline conocido.');
  }
}
