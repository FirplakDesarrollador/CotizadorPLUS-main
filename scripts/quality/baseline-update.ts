import {
  getCurrentBranch,
  loadBaseline,
  saveBaseline,
  type Baseline,
} from './common';
import { getAllTestFiles } from './plan';
import { checkLintRatchet, checkTypecheckRatchet } from './ratchet';
import { executeTests } from './run-tests';

async function updateBaseline() {
  console.log('\n======================================================');
  console.log('       ACTUALIZACIÓN DE LÍNEA BASE (RATCHET)          ');
  console.log('======================================================\n');

  const oldBaseline = loadBaseline();
  const branch = getCurrentBranch();

  console.log('1. Midiendo errores de tipos (tsc)...');
  const typeResult = checkTypecheckRatchet(oldBaseline);

  console.log('2. Midiendo errores de linter (eslint)...');
  const lintResult = checkLintRatchet(oldBaseline);

  console.log('3. Ejecutando suite completa de pruebas...');
  const allTests = getAllTestFiles();
  const testResults = executeTests(allTests, {
    ...oldBaseline,
    rules: { ...oldBaseline.rules, maxFailingTests: 9999 },
  });

  if (typeResult.errorCount > oldBaseline.rules.maxTypeErrors) {
    console.error(
      `Rechazado: errores de tipo (${typeResult.errorCount}) superan el baseline actual (${oldBaseline.rules.maxTypeErrors}). El trinquete solo permite bajar deuda.`
    );
    process.exit(1);
  }
  if (lintResult.errorCount > oldBaseline.rules.maxLintErrors) {
    console.error(
      `Rechazado: errores de linter (${lintResult.errorCount}) superan el baseline actual (${oldBaseline.rules.maxLintErrors}). El trinquete solo permite bajar deuda.`
    );
    process.exit(1);
  }
  if (testResults.failed > oldBaseline.rules.maxFailingTests) {
    console.error(
      `Rechazado: pruebas fallidas (${testResults.failed}) superan el baseline actual (${oldBaseline.rules.maxFailingTests}).`
    );
    process.exit(1);
  }

  const knownFailingTests: Baseline['knownFailingTests'] = [];
  testResults.knownFailuresEncountered.forEach((kf) => {
    const existing = oldBaseline.knownFailingTests.find((e) => e.name.toLowerCase() === kf.name.toLowerCase());
    knownFailingTests.push({
      suite: existing?.suite ?? 'unknown',
      name: kf.name,
      reason: existing?.reason ?? 'Fallo histórico conocido',
    });
  });

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

  console.log('\nLínea base actualizada en docs/quality/baseline.json:');
  console.log(`  - Errores de tipo: ${newBaseline.metrics.typeErrors} (antes: ${oldBaseline.metrics.typeErrors})`);
  console.log(`  - Errores de linter: ${newBaseline.metrics.lintErrors} (antes: ${oldBaseline.metrics.lintErrors})`);
  console.log(`  - Pruebas pasando: ${newBaseline.metrics.passingTests}/${newBaseline.metrics.totalTests}`);
  console.log(`  - Pruebas fallando: ${newBaseline.metrics.failingTests} (antes: ${oldBaseline.metrics.failingTests})`);
  console.log('\n======================================================\n');
}

updateBaseline().catch((err) => {
  console.error('Error al actualizar baseline:', err);
  process.exit(1);
});
