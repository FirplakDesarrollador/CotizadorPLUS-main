import { execSync } from 'node:child_process';
import {
  loadBaseline,
  ROOT_DIR,
  saveBaseline,
  type Baseline,
} from './common';
import { getAllTestFiles } from './plan';
import { checkLintRatchet, checkTypecheckRatchet } from './ratchet';
import { executeTests } from './run-tests';

async function updateBaseline() {
  console.log('\n======================================================');
  console.log('       🔄 ACTUALIZACIÓN DE LÍNEA BASE (BASELINE)      ');
  console.log('======================================================\n');

  const oldBaseline = loadBaseline();
  let branch = 'unknown';
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
  } catch {
    branch = 'main';
  }

  // 1. Verificación estática
  console.log('1️⃣ Midiendo errores de tipos (tsc)...');
  const typeResult = checkTypecheckRatchet(oldBaseline);

  console.log('2️⃣ Midiendo errores de linter (eslint)...');
  const lintResult = checkLintRatchet(oldBaseline);

  // 3. Ejecutar todas las pruebas para capturar fallos reales actuales
  console.log('3️⃣ Ejecutando suite completa de pruebas...');
  const allTests = getAllTestFiles();
  const testResults = executeTests(allTests, {
    ...oldBaseline,
    rules: { ...oldBaseline.rules, maxFailingTests: 9999 }, // permitir medir sin abortar
  });

  // 4. Validar trinquete: no se permite inflar la deuda
  const allowForce = process.argv.includes('--force');
  if (!allowForce) {
    if (typeResult.errorCount > oldBaseline.rules.maxTypeErrors) {
      console.error(
        `❌ No se puede actualizar baseline: errores de tipo (${typeResult.errorCount}) superan el baseline anterior (${oldBaseline.rules.maxTypeErrors}).`
      );
      process.exit(1);
    }
    if (lintResult.errorCount > oldBaseline.rules.maxLintErrors) {
      console.error(
        `❌ No se puede actualizar baseline: errores de linter (${lintResult.errorCount}) superan el baseline anterior (${oldBaseline.rules.maxLintErrors}).`
      );
      process.exit(1);
    }
  }

  // 5. Construir lista de fallos conocidos actualizada
  const knownFailingTests: Baseline['knownFailingTests'] = [];
  testResults.knownFailuresEncountered.forEach((kf) => {
    const existing = oldBaseline.knownFailingTests.find((e) => e.name.toLowerCase() === kf.name.toLowerCase());
    knownFailingTests.push({
      suite: existing?.suite ?? 'unknown',
      name: kf.name,
      reason: existing?.reason ?? 'Fallo histórico conocido',
    });
  });

  testResults.newFailures.forEach((nf) => {
    knownFailuresEncounteredFallback(nf);
  });

  function knownFailuresEncounteredFallback(nf: { name: string; errorSnippet: string }) {
    if (allowForce) {
      knownFailingTests.push({
        suite: 'tests/*',
        name: nf.name,
        reason: nf.errorSnippet.slice(0, 100),
      });
    }
  }

  const newBaseline: Baseline = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    branch,
    metrics: {
      typeErrors: typeResult.errorCount,
      lintErrors: lintResult.errorCount,
      lintWarnings: lintResult.warningCount,
      totalTests: testResults.total,
      passingTests: testResults.passed,
      failingTests: testResults.failed,
    },
    knownFailingTests,
    rules: {
      failOnNewTestFailure: true,
      maxFailingTests: testResults.failed,
      maxLintErrors: lintResult.errorCount,
      maxTypeErrors: typeResult.errorCount,
    },
  };

  saveBaseline(newBaseline);

  console.log('\n✅ Línea base actualizada exitosamente en docs/quality/baseline.json');
  console.log(`   - Errores de tipo: ${newBaseline.metrics.typeErrors}`);
  console.log(`   - Errores de linter: ${newBaseline.metrics.lintErrors} (antes: ${oldBaseline.metrics.lintErrors})`);
  console.log(`   - Tests pasando: ${newBaseline.metrics.passingTests} / ${newBaseline.metrics.totalTests}`);
  console.log(`   - Tests fallando: ${newBaseline.metrics.failingTests} (antes: ${oldBaseline.metrics.failingTests})`);
  console.log('\n======================================================\n');
}

updateBaseline().catch((err) => {
  console.error('Error al actualizar baseline:', err);
  process.exit(1);
});
