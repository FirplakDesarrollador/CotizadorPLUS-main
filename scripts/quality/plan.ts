import fs from 'node:fs';
import path from 'node:path';
import {
  getChangedFiles,
  getCurrentBranch,
  getDevSyncStatus,
  loadManifest,
  matchPattern,
  normalizePath,
  ROOT_DIR,
  type DevSyncStatus,
  type Lane,
  type Manifest,
} from './common';

export interface ImpactPlan {
  changedFiles: string[];
  impactedLanes: Lane[];
  orphanFiles: string[];
  ignoredFiles: string[];
  testFiles: string[];
  isFullSuite: boolean;
  escalationReasons: string[];
  reason: string;
  devSync: DevSyncStatus;
  branch: string;
}

const DEFAULT_IGNORED_PATTERNS = [
  'WikiLLM/**',
  'docs/MANUAL*.md',
  'README*.md',
  'artifacts/**',
  '.tmp/**',
  'output/**',
  'outputs/**',
  'tmp/**',
  'public/**',
  '*.md',
  '*.pdf',
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.webp',
  '*.svg',
  '*.csv',
  '*.xlsx',
  '*.iges',
];

export function getAllTestFiles(): string[] {
  const testsDir = path.join(ROOT_DIR, 'tests');
  if (!fs.existsSync(testsDir)) return [];
  return fs
    .readdirSync(testsDir)
    .filter((f) => f.endsWith('.test.ts'))
    .map((f) => normalizePath(path.join('tests', f)))
    .sort();
}

export function isNonProductiveFile(file: string, manifest: Manifest): boolean {
  const patterns = manifest.ignoredNonProductivePatterns ?? DEFAULT_IGNORED_PATTERNS;
  return patterns.some((pat) => matchPattern(file, pat));
}

export function computeImpactPlan(
  baseBranch?: string,
  options?: { changedFiles?: string[]; manifest?: Manifest; allTests?: string[]; devSync?: DevSyncStatus }
): ImpactPlan {
  const manifest = options?.manifest ?? loadManifest();
  const changedFiles = (options?.changedFiles ?? getChangedFiles(baseBranch)).map(normalizePath);
  const allTests = options?.allTests ?? getAllTestFiles();
  const devSync = options?.devSync ?? getDevSyncStatus();
  const branch = getCurrentBranch();

  if (changedFiles.length === 0) {
    return {
      changedFiles: [],
      impactedLanes: [],
      orphanFiles: [],
      ignoredFiles: [],
      testFiles: [],
      isFullSuite: false,
      escalationReasons: [],
      reason: 'No hay cambios detectados en git (árbol limpio frente a la base).',
      devSync,
      branch,
    };
  }

  const impactedLanesSet = new Set<Lane>();
  const orphanFiles: string[] = [];
  const ignoredFiles: string[] = [];

  for (const file of changedFiles) {
    let matched = false;
    for (const lane of manifest.lanes) {
      if (lane.patterns.some((pattern) => matchPattern(file, pattern))) {
        impactedLanesSet.add(lane);
        matched = true;
      }
    }

    if (!matched) {
      if (isNonProductiveFile(file, manifest)) {
        ignoredFiles.push(file);
      } else {
        orphanFiles.push(file);
      }
    }
  }

  const impactedLanes = Array.from(impactedLanesSet);
  const escalationReasons: string[] = [];

  const transversalLanes = impactedLanes.filter((l) => l.escalatesToFull);
  if (transversalLanes.length > 0) {
    escalationReasons.push(
      `Cambios en capacidad transversal/harness (${transversalLanes.map((l) => l.id).join(', ')}).`
    );
  }
  if (orphanFiles.length > 0) {
    escalationReasons.push(
      `Se detectaron ${orphanFiles.length} archivo(s) productivo(s) sin capacidad asignada en quality/manifest.json.`
    );
  }

  const isFullSuite = escalationReasons.length > 0;
  let testFiles: string[] = [];
  let reason = '';

  if (isFullSuite) {
    testFiles = allTests;
    reason = `ESCALAMIENTO AUTOMÁTICO A FULL: ${escalationReasons.join(' ')}`;
  } else if (impactedLanes.length === 0) {
    testFiles = [];
    reason = 'Los cambios solo corresponden a documentación, artefactos o assets no productivos.';
  } else {
    const rawTests = new Set<string>();
    for (const lane of impactedLanes) {
      for (const t of lane.tests) {
        if (t === 'tests/*.test.ts') {
          allTests.forEach((f) => rawTests.add(f));
        } else if (allTests.includes(normalizePath(t)) || fs.existsSync(path.join(ROOT_DIR, t))) {
          rawTests.add(normalizePath(t));
        }
      }
    }
    testFiles = Array.from(rawTests).sort();
    reason = `Impacto segmentado en ${impactedLanes.length} capacidad(es): ${impactedLanes.map((l) => l.id).join(', ')}.`;
  }

  return {
    changedFiles,
    impactedLanes,
    orphanFiles,
    ignoredFiles,
    testFiles,
    isFullSuite,
    escalationReasons,
    reason,
    devSync,
    branch,
  };
}

export function printImpactPlan(plan: ImpactPlan): void {
  console.log('\n======================================================');
  console.log('           PLAN DE IMPACTO DE CALIDAD (COSTO 0)       ');
  console.log('======================================================\n');
  console.log(`Rama actual: ${plan.branch}`);
  if (plan.devSync.available) {
    const syncNote =
      plan.devSync.behindCount > 0
        ? `ATENCIÓN: ${plan.devSync.behindCount} commit(s) pendiente(s) en ${plan.devSync.devRef} por revisar/traer antes de publicar`
        : `Al día con ${plan.devSync.devRef}`;
    console.log(`Sincronización DEV: ${syncNote} (ahead ${plan.devSync.aheadCount}, behind ${plan.devSync.behindCount})`);
  }
  console.log(`Diagnóstico: ${plan.reason}`);
  console.log(`Escala a FULL: ${plan.isFullSuite ? 'SÍ' : 'NO'}`);
  if (plan.escalationReasons.length > 0) {
    plan.escalationReasons.forEach((r) => console.log(`  - Motivo: ${r}`));
  }

  console.log(`\nArchivos modificados detectados (${plan.changedFiles.length}):`);
  plan.changedFiles.slice(0, 20).forEach((f) => console.log(`  - ${f}`));
  if (plan.changedFiles.length > 20) {
    console.log(`  ... y ${plan.changedFiles.length - 20} archivo(s) más`);
  }

  if (plan.orphanFiles.length > 0) {
    console.log(`\nArchivos productivos sin capacidad asignada (${plan.orphanFiles.length}):`);
    plan.orphanFiles.forEach((f) => console.log(`  [!] ${f}`));
  }

  console.log('\nCapacidades / Lanes afectados:');
  if (plan.impactedLanes.length === 0) {
    console.log('  (Ninguna capacidad de código afectada)');
  } else {
    plan.impactedLanes.forEach((lane) => {
      const badge = lane.escalatesToFull ? ' [ESCALA A FULL]' : lane.critical ? ' [CRÍTICO]' : '';
      console.log(`  - [${lane.id}] ${lane.name}${badge}`);
    });
  }

  console.log(`\nPruebas seleccionadas (${plan.testFiles.length}):`);
  if (plan.testFiles.length === 0) {
    console.log('  (No se requiere ejecución de pruebas)');
  } else {
    plan.testFiles.forEach((t) => console.log(`  - ${t}`));
  }
  console.log('\n======================================================\n');
}

if (require.main === module || process.argv[1]?.endsWith('plan.ts') || process.argv[1]?.endsWith('plan.js')) {
  const jsonFlag = process.argv.includes('--json');
  const plan = computeImpactPlan();
  if (jsonFlag) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    printImpactPlan(plan);
  }
}
