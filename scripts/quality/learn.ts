import fs from 'node:fs';
import path from 'node:path';
import {
  ensureTmpDir,
  getCurrentBranch,
  getCurrentHead,
  LEARN_REPORT_PATH,
  LEARNING_REPORT_MD_PATH,
  loadManifest,
  loadRunReceipt,
  matchPattern,
  ROOT_DIR,
  runGitSafe,
  type Manifest,
  type RunReceipt,
} from './common';
import { computeImpactPlan } from './plan';

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Finding {
  category: 'COBERTURA' | 'MAPEO' | 'ARQUITECTURA' | 'RENDIMIENTO_FLAKINESS' | 'SINCRONIZACION_DEV';
  severity: Severity;
  target: string;
  message: string;
  recommendation: string;
}

export interface LearnReport {
  generatedAt: string;
  gitBranch: string;
  gitHead: string;
  summary: {
    totalFindings: number;
    high: number;
    medium: number;
    low: number;
  };
  findings: Finding[];
  lastRunTelemetry: {
    available: boolean;
    requestedMode?: string;
    effectiveMode?: string;
    exitCode?: number;
    timestamp?: string;
    totalTests?: number;
    passed?: number;
    failed?: number;
    durationMs?: number;
  };
}

const CORE_MODULES = [
  'src/lib/engine.ts',
  'src/lib/cotizaciones.ts',
  'src/lib/group-engine.ts',
  'src/lib/cotizar.ts',
  'src/lib/supabase/server.ts',
  'src/proxy.ts',
];

export function getLineChangeCount(file: string): number {
  const out = runGitSafe(`git diff --numstat HEAD -- "${file}"`);
  if (out) {
    const parts = out.trim().split(/\s+/);
    if (parts.length >= 2) {
      const count = (parseInt(parts[0], 10) || 0) + (parseInt(parts[1], 10) || 0);
      if (count > 0) return count;
    }
  }

  // Si el archivo es nuevo (untracked o aún no presente en HEAD), contar sus líneas en disco
  const absPath = path.join(ROOT_DIR, file);
  const inHead = Boolean(runGitSafe(`git ls-tree --name-only HEAD -- "${file}"`));
  if (!inHead && fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
    const content = fs.readFileSync(absPath, 'utf-8');
    return content ? content.split(/\r?\n/).length : 0;
  }

  return 0;
}

export function renderMarkdownReport(report: LearnReport, receipt: RunReceipt | null): string {
  const lines: string[] = [];
  lines.push('# Reporte Consultivo de Calidad (`quality:learn`)');
  lines.push('');
  lines.push('> Análisis estrictamente consultivo. No modifica código, pruebas ni baselines.');
  lines.push('');
  lines.push(`- **Fecha**: ${report.generatedAt}`);
  lines.push(`- **Rama**: \`${report.gitBranch}\``);
  lines.push(`- **Commit HEAD**: \`${report.gitHead}\``);
  if (report.lastRunTelemetry.available) {
    lines.push(
      `- **Última corrida**: \`${report.lastRunTelemetry.requestedMode}\` → \`${report.lastRunTelemetry.effectiveMode}\` (exit \`${report.lastRunTelemetry.exitCode}\`, ${report.lastRunTelemetry.passed}/${report.lastRunTelemetry.totalTests} pruebas en ${report.lastRunTelemetry.durationMs}ms)`
    );
  } else {
    lines.push('- **Última corrida**: No disponible (`.tmp/quality/run-receipt.json` ausente)');
  }
  lines.push('');
  lines.push('## Resumen de hallazgos');
  lines.push('');
  lines.push('| Severidad | Cantidad | Acción requerida |');
  lines.push('| :--- | ---: | :--- |');
  lines.push(`| HIGH | ${report.summary.high} | Bloquea cierre hasta resolverse o justificarse técnicamente |`);
  lines.push(`| MEDIUM | ${report.summary.medium} | Recomendado atender en la iteración |`);
  lines.push(`| LOW | ${report.summary.low} | Informativo / monitoreo |`);
  lines.push('');

  if (report.findings.length === 0) {
    lines.push('No se detectaron brechas de cobertura, mapeo, arquitectura ni rendimiento.');
  } else {
    lines.push('## Detalle de hallazgos');
    lines.push('');
    report.findings.forEach((f, idx) => {
      lines.push(`### ${idx + 1}. [${f.severity}] ${f.category} — \`${f.target}\``);
      lines.push(`- **Hallazgo**: ${f.message}`);
      lines.push(`- **Recomendación**: ${f.recommendation}`);
      lines.push('');
    });
  }

  if (receipt?.stages && receipt.stages.length > 0) {
    lines.push('## Telemetría de etapas (`run-receipt.json`)');
    lines.push('');
    lines.push('| Etapa | Requerida | Estado | Exit | Duración | Detalle |');
    lines.push('| :--- | :---: | :--- | ---: | ---: | :--- |');
    for (const s of receipt.stages) {
      lines.push(
        `| \`${s.name}\` | ${s.required ? 'Sí' : 'No'} | **${s.status}** | ${s.exitCode ?? '-'} | ${s.durationMs}ms | ${s.details.replace(/\|/g, '/')} |`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function analyzeQualityLearn(baseBranch?: string): LearnReport {
  const manifest: Manifest = loadManifest();
  const receipt: RunReceipt | null = loadRunReceipt();
  const plan = computeImpactPlan(baseBranch);
  const changedFiles = plan.changedFiles;
  const gitHead = getCurrentHead();
  const gitBranch = getCurrentBranch();
  const findings: Finding[] = [];

  // 1. Brechas de mapeo (archivos productivos huérfanos)
  for (const orphan of plan.orphanFiles) {
    const isProductiveCore = orphan.startsWith('src/') || orphan.startsWith('db/migrations/');
    findings.push({
      category: 'MAPEO',
      severity: isProductiveCore ? 'HIGH' : 'MEDIUM',
      target: orphan,
      message: `El archivo productivo '${orphan}' no está clasificado en ninguna capacidad de quality/manifest.json.`,
      recommendation: `Asigna '${orphan}' al lane adecuado en quality/manifest.json y asocia su suite de pruebas.`,
    });
  }

  // 2. Riesgo arquitectónico y brechas de cobertura
  for (const file of changedFiles) {
    const isCore = CORE_MODULES.includes(file);
    const lineChanges = getLineChangeCount(file);

    if (isCore) {
      const ranOk = Boolean(receipt && receipt.exitCode === 0 && receipt.testsRun.length > 0);
      if (!ranOk) {
        findings.push({
          category: 'ARQUITECTURA',
          severity: 'HIGH',
          target: file,
          message: `Módulo crítico '${file}' modificado (${lineChanges} líneas) sin recibo verde reciente en .tmp/quality/run-receipt.json.`,
          recommendation: `Ejecuta '/desplegar gate' o '/desplegar full' antes de cerrar la entrega.`,
        });
      }
    }

    if (file.startsWith('src/lib/') && !file.endsWith('.d.ts') && !file.includes('-isazaale')) {
      const matchedLanes = manifest.lanes.filter(
        (l) => !l.escalatesToFull && l.patterns.some((p) => matchPattern(file, p))
      );
      const hasLaneTests = matchedLanes.some((l) => l.tests.length > 0);
      const baseName = path.basename(file, path.extname(file));
      const directTestExists = fs.existsSync(path.join(ROOT_DIR, 'tests', `${baseName}.test.ts`));

      if (!directTestExists && !hasLaneTests && lineChanges > 20) {
        findings.push({
          category: 'COBERTURA',
          severity: 'HIGH',
          target: file,
          message: `Lógica sustancial modificada en '${file}' (${lineChanges} líneas) sin prueba directa ni cobertura de lane.`,
          recommendation: `Agrega pruebas unitarias en 'tests/${baseName}.test.ts' y regístralas en quality/manifest.json.`,
        });
      } else if (!directTestExists && lineChanges > 20) {
        findings.push({
          category: 'COBERTURA',
          severity: 'MEDIUM',
          target: file,
          message: `Cambio amplio en '${file}' (${lineChanges} líneas) cubierto solo indirectamente por el lane.`,
          recommendation: `Considera añadir pruebas enfocadas en 'tests/${baseName}.test.ts' para aislar regresiones.`,
        });
      }
    }
  }

  // 3. Rendimiento de pruebas y etapas
  if (receipt) {
    const warnTestMs = manifest.thresholds?.testDurationWarningMs ?? 500;
    const critTestMs = manifest.thresholds?.testDurationCriticalMs ?? 1500;
    const warnStageMs = manifest.thresholds?.stageDurationWarningMs ?? 15000;

    for (const [testName, duration] of Object.entries(receipt.testMetrics?.durationsByTest ?? {})) {
      if (duration >= critTestMs) {
        findings.push({
          category: 'RENDIMIENTO_FLAKINESS',
          severity: 'MEDIUM',
          target: testName,
          message: `Prueba con latencia crítica: '${testName}' tardó ${Math.round(duration)}ms (umbral: ${critTestMs}ms).`,
          recommendation: 'Optimiza fixtures o divide el caso para mantener el ciclo local rápido.',
        });
      } else if (duration >= warnTestMs) {
        findings.push({
          category: 'RENDIMIENTO_FLAKINESS',
          severity: 'LOW',
          target: testName,
          message: `Prueba lenta detectada: '${testName}' tardó ${Math.round(duration)}ms (umbral: ${warnTestMs}ms).`,
          recommendation: 'Monitorea su tendencia para evitar degradación del tiempo de validación.',
        });
      }
    }

    for (const stage of receipt.stages ?? []) {
      if (stage.durationMs >= warnStageMs && stage.name !== 'build:next') {
        findings.push({
          category: 'RENDIMIENTO_FLAKINESS',
          severity: 'LOW',
          target: `stage:${stage.name}`,
          message: `La etapa '${stage.name}' tardó ${stage.durationMs}ms (umbral: ${warnStageMs}ms).`,
          recommendation: 'Evalúa usar /desplegar quick o test:focused durante iteración local.',
        });
      }
    }
  } else {
    findings.push({
      category: 'RENDIMIENTO_FLAKINESS',
      severity: 'LOW',
      target: 'run-receipt.json',
      message: 'No existe recibo previo en .tmp/quality/run-receipt.json.',
      recommendation: 'Ejecuta /desplegar impact, gate o full para generar telemetría real.',
    });
  }

  // 4. Sincronización pendiente con DEV
  if (plan.devSync.available && plan.devSync.behindCount > 0) {
    findings.push({
      category: 'SINCRONIZACION_DEV',
      severity: 'MEDIUM',
      target: plan.devSync.devRef ?? 'origin/DEV',
      message: `La rama actual '${gitBranch}' está ${plan.devSync.behindCount} commit(s) detrás de ${plan.devSync.devRef}.`,
      recommendation: `Antes de publicar a DEV/main, trae y evalúa los cambios pendientes de ${plan.devSync.devRef} en tu rama de trabajo.`,
    });
  }

  const high = findings.filter((f) => f.severity === 'HIGH').length;
  const medium = findings.filter((f) => f.severity === 'MEDIUM').length;
  const low = findings.filter((f) => f.severity === 'LOW').length;

  const report: LearnReport = {
    generatedAt: new Date().toISOString(),
    gitBranch,
    gitHead,
    summary: {
      totalFindings: findings.length,
      high,
      medium,
      low,
    },
    findings,
    lastRunTelemetry: {
      available: Boolean(receipt),
      requestedMode: receipt?.requestedMode,
      effectiveMode: receipt?.effectiveMode,
      exitCode: receipt?.exitCode,
      timestamp: receipt?.timestamp,
      totalTests: receipt?.testMetrics?.total,
      passed: receipt?.testMetrics?.passed,
      failed: receipt?.testMetrics?.failed,
      durationMs: receipt?.durationMs,
    },
  };

  ensureTmpDir();
  fs.writeFileSync(LEARN_REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(LEARNING_REPORT_MD_PATH, renderMarkdownReport(report, receipt) + '\n', 'utf-8');
  return report;
}

export function printLearnReport(report: LearnReport): void {
  console.log('\n======================================================');
  console.log('      AUDITORÍA CONSULTIVA: QUALITY:LEARN             ');
  console.log('======================================================\n');
  console.log(`Hallazgos totales: ${report.summary.totalFindings} (HIGH=${report.summary.high}, MEDIUM=${report.summary.medium}, LOW=${report.summary.low})\n`);

  if (report.findings.length === 0) {
    console.log('Sin hallazgos de cobertura, mapeo, arquitectura ni rendimiento.');
  } else {
    report.findings.forEach((f, idx) => {
      console.log(`#${idx + 1} [${f.severity}] [${f.category}] ${f.target}`);
      console.log(`   Detalle: ${f.message}`);
      console.log(`   Acción:  ${f.recommendation}\n`);
    });
  }

  console.log('Reportes escritos en:');
  console.log('  - .tmp/quality/learning-report.md');
  console.log('  - .tmp/quality/learn-report.json');
  console.log('Nota: análisis estrictamente consultivo (no modifica código ni baselines).');
  console.log('======================================================\n');
}

if (require.main === module || process.argv[1]?.endsWith('learn.ts') || process.argv[1]?.endsWith('learn.js')) {
  const report = analyzeQualityLearn();
  printLearnReport(report);

  if (process.argv.includes('--strict') && report.summary.high > 0) {
    console.error(`Bloqueo en modo --strict: existen ${report.summary.high} hallazgo(s) HIGH sin resolver.`);
    process.exit(1);
  }
}
