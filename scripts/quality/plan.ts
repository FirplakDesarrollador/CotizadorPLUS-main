import fs from 'node:fs';
import path from 'node:path';
import {
  getChangedFiles,
  loadManifest,
  matchPattern,
  normalizePath,
  ROOT_DIR,
  type Lane,
} from './common';

export interface ImpactPlan {
  changedFiles: string[];
  impactedLanes: Lane[];
  orphanFiles: string[];
  testFiles: string[];
  isFullSuite: boolean;
  reason: string;
}

export function getAllTestFiles(): string[] {
  const testsDir = path.join(ROOT_DIR, 'tests');
  if (!fs.existsSync(testsDir)) return [];
  return fs
    .readdirSync(testsDir)
    .filter((f) => f.endsWith('.test.ts'))
    .map((f) => normalizePath(path.join('tests', f)))
    .sort();
}

export function computeImpactPlan(baseBranch?: string): ImpactPlan {
  const manifest = loadManifest();
  const changedFiles = getChangedFiles(baseBranch);
  const allTests = getAllTestFiles();

  if (changedFiles.length === 0) {
    return {
      changedFiles: [],
      impactedLanes: [],
      orphanFiles: [],
      testFiles: [],
      isFullSuite: false,
      reason: 'No hay cambios detectados en git (árbol limpio).',
    };
  }

  const impactedLanesSet = new Set<Lane>();
  const orphanFiles: string[] = [];

  for (const file of changedFiles) {
    let matched = false;
    for (const lane of manifest.lanes) {
      if (lane.patterns.some((pattern) => matchPattern(file, pattern))) {
        impactedLanesSet.add(lane);
        matched = true;
      }
    }
    // Si no hizo match con ningún lane y no es documentación o artefactos generados
    if (!matched) {
      const isDocOrArtifact =
        file.startsWith('WikiLLM/') ||
        file.startsWith('docs/') ||
        file.endsWith('.md') ||
        file.endsWith('.pdf') ||
        file.endsWith('.png') ||
        file.endsWith('.jpg') ||
        file.endsWith('.csv') ||
        file.endsWith('.json') ||
        file.startsWith('.tmp/') ||
        file.startsWith('output/');
      if (!isDocOrArtifact) {
        orphanFiles.push(file);
      }
    }
  }

  const impactedLanes = Array.from(impactedLanesSet);
  const escalatesToFull = impactedLanes.some((l) => l.escalatesToFull) || orphanFiles.length > 0;

  let testFiles: string[] = [];
  let isFullSuite = false;
  let reason = '';

  if (escalatesToFull) {
    isFullSuite = true;
    testFiles = allTests;
    reason = impactedLanes.some((l) => l.escalatesToFull)
      ? 'Cambio en lane transversal core (escalamiento automático a suite completa).'
      : 'Se detectaron archivos modificados huérfanos fuera del mapa de impacto.';
  } else if (impactedLanes.length === 0) {
    testFiles = [];
    reason = 'Los cambios solo corresponden a documentación, artefactos o assets estáticos.';
  } else {
    const rawTests = new Set<string>();
    for (const lane of impactedLanes) {
      for (const t of lane.tests) {
        if (t === 'tests/*.test.ts') {
          allTests.forEach((f) => rawTests.add(f));
        } else if (fs.existsSync(path.join(ROOT_DIR, t))) {
          rawTests.add(normalizePath(t));
        }
      }
    }
    testFiles = Array.from(rawTests).sort();
    reason = `Impacto segmentado en ${impactedLanes.length} lane(s): ${impactedLanes.map((l) => l.name).join(', ')}.`;
  }

  return {
    changedFiles,
    impactedLanes,
    orphanFiles,
    testFiles,
    isFullSuite,
    reason,
  };
}

export function printImpactPlan(plan: ImpactPlan): void {
  console.log('\n======================================================');
  console.log('           🎯 PLAN DE IMPACTO DE CALIDAD             ');
  console.log('======================================================\n');
  console.log(`📌 Diagnóstico: ${plan.reason}`);
  console.log(`📁 Archivos modificados detectados: ${plan.changedFiles.length}`);
  plan.changedFiles.slice(0, 10).forEach((f) => console.log(`   - ${f}`));
  if (plan.changedFiles.length > 10) {
    console.log(`   ... y ${plan.changedFiles.length - 10} archivo(s) más`);
  }

  if (plan.orphanFiles.length > 0) {
    console.log('\n⚠️  Archivos sin capacidad asignada (Huérfanos):');
    plan.orphanFiles.forEach((f) => console.log(`   [!] ${f}`));
  }

  console.log('\n🚦 Capacidades / Lanes activados:');
  if (plan.impactedLanes.length === 0) {
    console.log('   (Ninguna capacidad de código afectada)');
  } else {
    plan.impactedLanes.forEach((lane) => {
      console.log(`   • [${lane.id}] ${lane.name}`);
    });
  }

  console.log(`\n🧪 Pruebas a ejecutar (${plan.testFiles.length}):`);
  if (plan.testFiles.length === 0) {
    console.log('   (No se requiere ejecución de pruebas)');
  } else {
    plan.testFiles.forEach((t) => console.log(`   ✓ ${t}`));
  }
  console.log('\n======================================================\n');
}

// Ejecución como script directo
if (require.main === module || process.argv[1]?.endsWith('plan.ts') || process.argv[1]?.endsWith('plan.js')) {
  const plan = computeImpactPlan();
  printImpactPlan(plan);
}
