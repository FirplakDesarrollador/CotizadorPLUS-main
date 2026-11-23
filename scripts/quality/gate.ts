import { spawnSync } from 'node:child_process';
import {
  evaluateStageGate,
  getCurrentBranch,
  getCurrentHead,
  loadBaseline,
  ROOT_DIR,
  saveRunReceipt,
  type QualityMode,
  type RunReceipt,
  type StageReceipt,
} from './common';
import { computeImpactPlan, getAllTestFiles, printImpactPlan } from './plan';
import { evaluatePolicy } from './policy';
import { checkLintRatchet, checkTypecheckRatchet } from './ratchet';
import { executeTests } from './run-tests';

function parseRequestedMode(argv: string[]): QualityMode {
  const modeArg = argv.find((a) => a.startsWith('--mode='));
  if (modeArg) {
    const val = modeArg.split('=')[1];
    if (val === 'impact' || val === 'quick' || val === 'gate' || val === 'full') {
      return val;
    }
  }
  if (argv.includes('--full')) return 'full';
  if (argv.includes('--quick')) return 'quick';
  if (argv.includes('--only-impact') || argv.includes('--impact')) return 'impact';
  return 'gate';
}

function runCommandStage(name: string, cmd: string, args: string[], required: boolean): StageReceipt {
  const start = Date.now();
  const proc = spawnSync(cmd, args, {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    shell: true,
  });
  const durationMs = Date.now() - start;
  const exitCode = proc.status ?? 1;
  const passed = exitCode === 0;
  const tail = ((proc.stdout || '') + '\n' + (proc.stderr || '')).trim().split(/\r?\n/).slice(-3).join(' | ');

  return {
    name,
    required,
    status: passed ? 'VERIFIED' : 'FAILED',
    exitCode,
    durationMs,
    details: passed ? 'OK' : tail || `exit ${exitCode}`,
  };
}

async function main() {
  const requestedMode = parseRequestedMode(process.argv.slice(2));
  const baseline = loadBaseline();
  const startTime = Date.now();
  const gitBranch = getCurrentBranch();
  const gitHead = getCurrentHead();

  // 1. Planificación por impacto
  const plan = computeImpactPlan();
  const escalatedToFull = requestedMode === 'gate' && plan.isFullSuite;
  const effectiveMode: QualityMode = escalatedToFull ? 'full' : requestedMode;

  console.log('\n======================================================');
  console.log('   SISTEMA MODULAR DE CALIDAD & SAFE CHANGE           ');
  console.log(`   Modo solicitado: ${requestedMode.toUpperCase()} | Modo efectivo: ${effectiveMode.toUpperCase()}`);
  console.log('======================================================\n');

  printImpactPlan(plan);

  const stages: StageReceipt[] = [];
  const violations: string[] = [];

  // 2. Política de no regresión (siempre requerida)
  console.log('[1] Evaluando política de no regresión (quality:policy)...');
  const policyRes = evaluatePolicy();
  stages.push({
    name: 'quality:policy',
    required: true,
    status: policyRes.passed ? 'VERIFIED' : 'FAILED',
    exitCode: policyRes.passed ? 0 : 1,
    durationMs: policyRes.durationMs,
    details: policyRes.passed
      ? `${policyRes.checkedTestFiles} suites verificadas sin regresiones`
      : policyRes.violations.map((v) => `[${v.rule}] ${v.target}: ${v.message}`).join(' ; '),
  });
  if (!policyRes.passed) {
    policyRes.violations.forEach((v) => violations.push(`[POLÍTICA/${v.rule}] ${v.target}: ${v.message}`));
  }

  // 3. Sincronización multi-IDE de skills (siempre requerida)
  console.log('[2] Verificando sincronización de skills multi-IDE (skills:check)...');
  const skillsStage = runCommandStage('skills:check', 'npx', ['tsx', 'scripts/quality/skills-sync.ts', '--check'], true);
  stages.push(skillsStage);
  if (skillsStage.status !== 'VERIFIED') {
    violations.push(`[SKILLS] Desincronización detectada en skills multi-IDE: ${skillsStage.details}`);
  }

  // 4. Typecheck (quick, gate, full)
  let typecheckPassed = true;
  if (effectiveMode === 'quick' || effectiveMode === 'gate' || effectiveMode === 'full') {
    console.log('[3] Ejecutando typecheck bajo trinquete (tsc --noEmit)...');
    const tc = checkTypecheckRatchet(baseline);
    typecheckPassed = tc.passed;
    stages.push({
      name: 'typecheck',
      required: true,
      status: tc.passed ? 'VERIFIED' : 'FAILED',
      exitCode: tc.passed ? 0 : 1,
      durationMs: tc.durationMs,
      details: `${tc.errorCount} error(es) (máx baseline: ${baseline.rules.maxTypeErrors})`,
    });
    violations.push(...tc.violations);
  } else {
    stages.push({
      name: 'typecheck',
      required: false,
      status: 'SKIPPED',
      exitCode: null,
      durationMs: 0,
      details: 'No requerido en modo impact',
    });
  }

  // 5. ESLint bajo trinquete (gate, full)
  let lintPassed = true;
  if (effectiveMode === 'gate' || effectiveMode === 'full') {
    console.log('[4] Ejecutando ESLint bajo trinquete...');
    const lint = checkLintRatchet(baseline);
    lintPassed = lint.passed;
    stages.push({
      name: 'lint',
      required: true,
      status: lint.passed ? 'VERIFIED' : 'FAILED',
      exitCode: lint.passed ? 0 : 1,
      durationMs: lint.durationMs,
      details: `${lint.errorCount} error(es), ${lint.warningCount} warning(s) (máx baseline: ${baseline.rules.maxLintErrors})`,
    });
    violations.push(...lint.violations);
    if (lint.improvements.length > 0) {
      lint.improvements.forEach((imp) => console.log(`  Mejora: ${imp}`));
    }
  } else {
    stages.push({
      name: 'lint',
      required: false,
      status: 'SKIPPED',
      exitCode: null,
      durationMs: 0,
      details: `No requerido en modo ${effectiveMode}`,
    });
  }

  // 6. Pruebas unitarias (impacto o full)
  const testsToRun = effectiveMode === 'full' ? getAllTestFiles() : plan.testFiles;
  console.log(`[5] Ejecutando pruebas (${effectiveMode === 'full' ? 'SUITE COMPLETA' : 'IMPACTO'}: ${testsToRun.length} archivo(s))...`);
  const testResults = executeTests(testsToRun, baseline);
  const testsPassed = testResults.violations.length === 0;
  violations.push(...testResults.violations);

  stages.push({
    name: effectiveMode === 'full' ? 'tests:full' : 'tests:impact',
    required: true,
    status: testsPassed ? 'VERIFIED' : 'FAILED',
    exitCode: testResults.exitCode,
    durationMs: testResults.durationMs,
    details:
      testsToRun.length === 0
        ? 'Sin capacidades productivas afectadas (0 pruebas requeridas)'
        : `${testResults.passed}/${testResults.total} pasaron, ${testResults.failed} fallaron`,
  });

  // 7. Build de producción Next.js (obligatorio en modo full solicitado o escalado a full)
  if (effectiveMode === 'full') {
    const skipBuildFlag = process.argv.includes('--no-build');
    if (skipBuildFlag) {
      stages.push({
        name: 'build:next',
        required: true,
        status: 'SKIPPED',
        exitCode: null,
        durationMs: 0,
        details: 'Omitido manualmente con --no-build (falla el gate por política sin bypass)',
      });
    } else {
      console.log('[6] Ejecutando compilación de producción (npm run build)...');
      const buildStage = runCommandStage('build:next', 'npm', ['run', 'build'], true);
      stages.push(buildStage);
      if (buildStage.status !== 'VERIFIED') {
        violations.push(`[BUILD] npm run build falló: ${buildStage.details}`);
      }
    }
  } else {
    stages.push({
      name: 'build:next',
      required: false,
      status: 'SKIPPED',
      exitCode: null,
      durationMs: 0,
      details: `No requerido en modo ${effectiveMode} (se exige en modo full)`,
    });
  }

  // 8. Evaluar regla estricta de estados verificables
  const stageCheck = evaluateStageGate(stages);
  if (!stageCheck.passed) {
    for (const msg of stageCheck.failures) {
      if (!violations.includes(msg)) violations.push(msg);
    }
  }

  const exitCode = violations.length === 0 ? 0 : 1;
  const totalDuration = Date.now() - startTime;

  const receipt: RunReceipt = {
    timestamp: new Date().toISOString(),
    requestedMode,
    effectiveMode,
    escalatedToFull,
    escalationReasons: plan.escalationReasons,
    gitBranch,
    gitHead,
    devSync: plan.devSync,
    impactedLanes: plan.impactedLanes.map((l) => l.id),
    changedFiles: plan.changedFiles,
    orphanFiles: plan.orphanFiles,
    testsRun: testsToRun,
    stages,
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
      testsPassed,
      policyPassed: policyRes.passed,
      skillsCheckPassed: skillsStage.status === 'VERIFIED',
      violations,
    },
    exitCode,
  };

  saveRunReceipt(receipt);

  console.log('\n======================================================');
  console.log('                 RESUMEN POR ETAPA                    ');
  console.log('======================================================');
  for (const s of stages) {
    const reqTag = s.required ? 'REQ' : 'OPT';
    console.log(`  [${s.status.padEnd(14)}] (${reqTag}) ${s.name.padEnd(16)} exit=${s.exitCode ?? '-'} (${s.durationMs}ms) — ${s.details}`);
  }
  console.log('------------------------------------------------------');
  if (exitCode === 0) {
    console.log(`APROBADO (EXIT 0) | Modo: ${requestedMode} -> ${effectiveMode} | Tiempo: ${totalDuration}ms`);
    console.log('Recibo guardado en .tmp/quality/run-receipt.json');
  } else {
    console.error(`RECHAZADO (EXIT 1) | Modo: ${requestedMode} -> ${effectiveMode} | Violaciones: ${violations.length}`);
    violations.forEach((v) => console.error(`  - ${v}`));
    console.error('Recibo guardado en .tmp/quality/run-receipt.json');
  }
  console.log('======================================================\n');

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Error fatal en compuerta de calidad:', err);
  process.exit(1);
});
