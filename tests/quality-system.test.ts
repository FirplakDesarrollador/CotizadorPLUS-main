import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { evaluateStageGate, normalizeRunReceipt, ROOT_DIR, type Baseline, type StageReceipt } from '../scripts/quality/common';
import { getLineChangeCount } from '../scripts/quality/learn';
import { computeImpactPlan } from '../scripts/quality/plan';
import {
  checkBaselineRegression,
  checkExcludeAdditions,
  countTestCases,
  findDisabledTestsInSource,
} from '../scripts/quality/policy';
import { checkSkillsSync, validateSkills } from '../scripts/quality/skills-sync';

test('computeImpactPlan selecciona solo las pruebas del lane afectado para cambios acotados', () => {
  const plan = computeImpactPlan(undefined, {
    changedFiles: ['src/lib/cema-template.ts'],
  });

  assert.equal(plan.isFullSuite, false);
  assert.deepEqual(plan.orphanFiles, []);
  assert.deepEqual(
    plan.impactedLanes.map((l) => l.id),
    ['lane:proposals-export']
  );
  assert.ok(plan.testFiles.includes('tests/templates-propuesta.test.ts'));
});

test('computeImpactPlan escala automáticamente a FULL ante archivo productivo sin clasificar', () => {
  const plan = computeImpactPlan(undefined, {
    changedFiles: ['src/nuevo-modulo-sin-lane/servicio.ts'],
  });

  assert.equal(plan.isFullSuite, true);
  assert.deepEqual(plan.orphanFiles, ['src/nuevo-modulo-sin-lane/servicio.ts']);
  assert.ok(plan.escalationReasons.length >= 1);
  assert.ok(plan.testFiles.length >= 30);
});

test('computeImpactPlan escala automáticamente a FULL cuando se modifica el harness o package.json', () => {
  const plan = computeImpactPlan(undefined, {
    changedFiles: ['package.json'],
  });

  assert.equal(plan.isFullSuite, true);
  assert.ok(plan.impactedLanes.some((l) => l.id === 'lane:core-transversal'));
});

test('computeImpactPlan no dispara pruebas cuando solo cambian documentos no productivos', () => {
  const plan = computeImpactPlan(undefined, {
    changedFiles: ['WikiLLM/log.md', 'README.md'],
  });

  assert.equal(plan.isFullSuite, false);
  assert.deepEqual(plan.orphanFiles, []);
  assert.deepEqual(plan.testFiles, []);
});

test('evaluateStageGate rechaza cualquier etapa requerida en estado SKIPPED, NOT_CONFIGURED o FAILED', () => {
  const okStages: StageReceipt[] = [
    { name: 'policy', required: true, status: 'VERIFIED', exitCode: 0, durationMs: 10, details: 'OK' },
    { name: 'build', required: false, status: 'SKIPPED', exitCode: null, durationMs: 0, details: 'Opcional' },
  ];
  assert.equal(evaluateStageGate(okStages).passed, true);

  const skippedReq: StageReceipt[] = [
    { name: 'lint', required: true, status: 'SKIPPED', exitCode: null, durationMs: 0, details: 'Omitido' },
  ];
  assert.equal(evaluateStageGate(skippedReq).passed, false);

  const notCfgReq: StageReceipt[] = [
    { name: 'build', required: true, status: 'NOT_CONFIGURED', exitCode: null, durationMs: 0, details: 'Falta config' },
  ];
  assert.equal(evaluateStageGate(notCfgReq).passed, false);
});

test('quality:policy detecta pruebas saltadas/pendientes, subidas de baseline y nuevos exclude', () => {
  const badSource = [
    "import test from 'node:test';",
    `test.${'skip'}('no permitido', () => {});`,
    `test('tampoco permitido', { ${'todo'}: true }, () => {});`,
  ].join('\n');

  const findings = findDisabledTestsInSource(badSource);
  assert.equal(findings.length, 2);
  assert.equal(countTestCases("test('a', () => {});\ntest('b', () => {});"), 2);

  const base: Baseline = {
    version: '1.0.0',
    generatedAt: '2026-10-05T00:00:00Z',
    branch: 'DEV',
    metrics: { typeErrors: 0, lintErrors: 36, lintWarnings: 17, totalTests: 222, passingTests: 222, failingTests: 0 },
    knownFailingTests: [],
    rules: { failOnNewTestFailure: true, maxFailingTests: 0, maxLintErrors: 36, maxTypeErrors: 0 },
  };
  const inflated: Baseline = {
    ...base,
    rules: { ...base.rules, maxLintErrors: 37 },
  };
  assert.equal(checkBaselineRegression(base, base).length, 0);
  assert.equal(checkBaselineRegression(base, inflated).length, 1);

  assert.equal(checkExcludeAdditions(['node_modules'], ['node_modules'], 'tsconfig.json').length, 0);
  assert.equal(checkExcludeAdditions(['node_modules'], ['node_modules', 'src/lib/**'], 'tsconfig.json').length, 1);
});

test('skills multi-IDE están sincronizados y pasan validación estructural', () => {
  const sync = checkSkillsSync();
  assert.equal(sync.inSync, true, `Destinos fuera de sync: ${[...sync.missing, ...sync.drifted].join(', ')}`);

  const validation = validateSkills();
  assert.equal(validation.valid, true, `Errores de validación: ${validation.errors.join(' | ')}`);
});

test('normalizeRunReceipt migra recibos v1 legados sin producir modos undefined', () => {
  const normalized = normalizeRunReceipt({
    timestamp: '2026-10-05T14:00:00.000Z',
    mode: 'gate',
    gitHead: 'abc123',
    exitCode: 0,
  });

  assert.ok(normalized);
  assert.equal(normalized.requestedMode, 'gate');
  assert.equal(normalized.effectiveMode, 'gate');
  assert.deepEqual(normalized.stages, []);
});

test('getLineChangeCount cuenta líneas en archivos nuevos aún no presentes en HEAD', () => {
  const relTmp = '.tmp/quality/test-line-count-probe.tmp.ts';
  const absTmp = path.join(ROOT_DIR, relTmp);
  fs.mkdirSync(path.dirname(absTmp), { recursive: true });
  fs.writeFileSync(absTmp, Array.from({ length: 25 }, (_, i) => `export const v${i} = ${i};`).join('\n'), 'utf-8');
  try {
    const count = getLineChangeCount(relTmp);
    assert.equal(count, 25);
  } finally {
    if (fs.existsSync(absTmp)) fs.unlinkSync(absTmp);
  }
});
