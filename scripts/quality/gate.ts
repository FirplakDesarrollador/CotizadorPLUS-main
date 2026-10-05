import { execSync } from 'node:child_process';
import {
  loadBaseline,
  ROOT_DIR,
  saveLastRun,
  type LastRunReceipt,
} from './common';
import { computeImpactPlan, getAllTestFiles, printImpactPlan } from './plan';
import { runAllRatchetChecks } from './ratchet';
import { executeTests } from './run-tests';

async function main() {
  const isFull = process.argv.includes('--full');
  const isImpactOnly = process.argv.includes('--only-impact');
  const baseline = loadBaseline();

  console.log('\n======================================================');
  console.log(` 🛡️  SISTEMA DE CALIDAD MODULAR & TRINQUETE DE DEUDA `);
  console.log(` Modo: ${isFull ? 'COMPLETO (FULL CI/RELEASE)' : isImpactOnly ? 'SOLO IMPACTO' : 'GATE ESTÁNDAR'}`);
  console.log('======================================================\n');

  const startTime = Date.now();
  let currentHead = '';
  try {
    currentHead = execSync('git rev-parse HEAD', { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
  } catch {
    currentHead = 'UNKNOWN';
  }

  // 1. Determinar plan de impacto
  const plan = computeImpactPlan();
  printImpactPlan(plan);

  let typecheckPassed = true;
  let lintPassed = true;
  const violations: string[] = [];

  // 2. Ejecutar validaciones estáticas (Linter & Typecheck) salvo si es only-impact
  if (!isImpactOnly) {
    const staticChecks = runAllRatchetChecks(baseline);
    typecheckPassed = staticChecks.typeErrors <= baseline.rules.maxTypeErrors;
    lintPassed = staticChecks.lintErrors <= baseline.rules.maxLintErrors;
    violations.push(...staticChecks.violations);

    if (staticChecks.improvements.length > 0) {
      console.log('\n🎉 Mejoras detectadas:');
      staticChecks.improvements.forEach((imp) => console.log(`   ${imp}`));
    }
  }

  // 3. Determinar qué tests correr
  const testsToRun = isFull ? getAllTestFiles() : plan.testFiles;

  // 4. Ejecutar tests
  const testResults = executeTests(testsToRun, baseline);
  violations.push(...testResults.violations);

  // 5. Consolidar recibo
  const totalDuration = Date.now() - startTime;
  const exitCode = violations.length === 0 ? 0 : 1;

  const receipt: LastRunReceipt = {
    timestamp: new Date().toISOString(),
    mode: isFull ? 'full' : isImpactOnly ? 'impact' : 'gate',
    gitHead: currentHead,
    impactedLanes: plan.impactedLanes.map((l) => l.id),
    changedFiles: plan.changedFiles,
    testsRun: testsToRun,
    durationMs: totalDuration,
    testMetrics: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      durationsByTest: testResults.durationsByTest,
    },
    ratchetStatus: {
      typecheckPassed,
      lintPassed,
      testsPassed: testResults.violations.length === 0,
      violations,
    },
    exitCode,
  };

  saveLastRun(receipt);

  // 6. Reporte Final
  console.log('\n======================================================');
  if (exitCode === 0) {
    console.log(' 🟢 COMPUERTA DE CALIDAD APROBADA (EXIT 0)');
    console.log('    Ninguna regresión introducida respecto al baseline.');
    if (testResults.passedKnownFailures.length > 0) {
      console.log(`    ⭐ ¡${testResults.passedKnownFailures.length} test(s) históricos que antes fallaban ahora PASAN!`);
    }
    console.log(`    Recibo guardado en .tmp/quality/last-run.json`);
  } else {
    console.error(' 🔴 COMPUERTA DE CALIDAD RECHAZADA (EXIT 1)');
    console.error('    Se detectaron las siguientes violaciones de trinquete:');
    violations.forEach((v) => console.error(`    ❌ ${v}`));
    console.error(`\n    Recibo guardado en .tmp/quality/last-run.json`);
  }
  console.log('======================================================\n');

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Error fatal en compuerta de calidad:', err);
  process.exit(1);
});
