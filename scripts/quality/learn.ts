import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  ensureTmpDir,
  LEARN_REPORT_PATH,
  loadLastRun,
  loadManifest,
  ROOT_DIR,
  type LastRunReceipt,
  type Manifest,
} from './common';
import { computeImpactPlan } from './plan';

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Finding {
  category: 'COBERTURA' | 'MAPEO' | 'ARQUITECTURA' | 'RENDIMIENTO_FLAKINESS';
  severity: Severity;
  target: string;
  message: string;
  recommendation: string;
}

export interface LearnReport {
  generatedAt: string;
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
    timestamp?: string;
    totalTests?: number;
    passed?: number;
    failed?: number;
    durationMs?: number;
  };
}

export function analyzeQualityLearn(baseBranch?: string): LearnReport {
  const manifest: Manifest = loadManifest();
  const lastRun: LastRunReceipt | null = loadLastRun();
  const plan = computeImpactPlan(baseBranch);
  const changedFiles = plan.changedFiles;

  let gitHead = 'UNKNOWN';
  try {
    gitHead = execSync('git rev-parse HEAD', { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
  } catch {
    gitHead = 'UNKNOWN';
  }

  const findings: Finding[] = [];

  // Helper para diff de líneas añadidas/modificadas por archivo
  const getLineChangeCount = (file: string): number => {
    try {
      const out = execSync(`git diff --numstat HEAD -- "${file}"`, {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const parts = out.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parseInt(parts[0], 10) || 0) + (parseInt(parts[1], 10) || 0);
      }
    } catch {
      // Ignorar si el archivo no existe en el índice
    }
    return 0;
  };

  // 1. Análisis de Brechas de Mapeo (Orphan files)
  for (const orphan of plan.orphanFiles) {
    if (orphan.startsWith('src/')) {
      findings.push({
        category: 'MAPEO',
        severity: 'MEDIUM',
        target: orphan,
        message: `El archivo modificado '${orphan}' no está mapeado a ninguna capacidad o lane en quality/manifest.json.`,
        recommendation: `Añade un patrón en 'quality/manifest.json' dentro del lane correspondiente para garantizar que sus cambios activen pruebas automáticas.`,
      });
    }
  }

  // 2. Análisis de Riesgo Arquitectónico y Brechas de Cobertura
  const CORE_MODULES = [
    'src/lib/engine.ts',
    'src/lib/cotizaciones.ts',
    'src/lib/group-engine.ts',
    'src/lib/cotizar.ts',
  ];

  for (const file of changedFiles) {
    const isCore = CORE_MODULES.includes(file);
    const lineChanges = getLineChangeCount(file);

    // Riesgo arquitectónico en módulos core
    if (isCore) {
      const hasTestsRun = lastRun && lastRun.testsRun.length > 0;
      if (!hasTestsRun || !lastRun.testsRun.some((t) => t.includes('group') || t.includes('engine') || t.includes('margen'))) {
        findings.push({
          category: 'ARQUITECTURA',
          severity: 'HIGH',
          target: file,
          message: `Módulo central de negocio '${file}' modificado (${lineChanges} líneas) sin ejecución reciente de suites de integración asociadas.`,
          recommendation: `Ejecuta 'npm run quality:gate' o 'npm run quality:gate:full' para validar que los invariantes del motor no se hayan degradado.`,
        });
      }
    }

    // Brechas de cobertura en archivos de lógica src/lib/ o src/app/
    if (file.startsWith('src/lib/') && !file.endsWith('.d.ts') && !file.includes('-isazaale')) {
      const baseName = path.basename(file, path.extname(file));
      const testsDir = path.join(ROOT_DIR, 'tests');
      const directTestFile = path.join(testsDir, `${baseName}.test.ts`);
      const directTestExists = fs.existsSync(directTestFile);

      // Si no existe test directo y el cambio es sustancial (> 20 líneas o archivo nuevo)
      if (!directTestExists && lineChanges > 20) {
        findings.push({
          category: 'COBERTURA',
          severity: 'HIGH',
          target: file,
          message: `Lógica sustancialmente modificada o agregada en '${file}' (${lineChanges} líneas cambiadas) sin archivo de prueba directa 'tests/${baseName}.test.ts'.`,
          recommendation: `Diseña e implementa una suite de prueba en 'tests/${baseName}.test.ts' que asegure los casos de borde de este componente.`,
        });
      } else if (!directTestExists && lineChanges > 0) {
        findings.push({
          category: 'COBERTURA',
          severity: 'MEDIUM',
          target: file,
          message: `Cambio en '${file}' sin archivo de prueba dedicado 'tests/${baseName}.test.ts'.`,
          recommendation: `Considera incorporar casos de prueba unitaria para '${baseName}'.`,
        });
      }
    }
  }

  // 3. Análisis de Rendimiento y Flakiness desde la última corrida
  if (lastRun && lastRun.testMetrics?.durationsByTest) {
    const manifestThresholds = manifest.thresholds || { testDurationWarningMs: 500, testDurationCriticalMs: 1500 };
    for (const [testName, duration] of Object.entries(lastRun.testMetrics.durationsByTest)) {
      if (duration >= manifestThresholds.testDurationCriticalMs) {
        findings.push({
          category: 'RENDIMIENTO_FLAKINESS',
          severity: 'MEDIUM',
          target: testName,
          message: `Prueba con latencia crítica: '${testName}' tardó ${Math.round(duration)}ms en completarse (umbral crítico: ${manifestThresholds.testDurationCriticalMs}ms).`,
          recommendation: `Optimiza la lógica del test o desacopla consultas pesadas para prevenir ralentizaciones en el pipeline de CI.`,
        });
      } else if (duration >= manifestThresholds.testDurationWarningMs) {
        findings.push({
          category: 'RENDIMIENTO_FLAKINESS',
          severity: 'LOW',
          target: testName,
          message: `Prueba lenta detectada: '${testName}' tardó ${Math.round(duration)}ms (umbral de advertencia: ${manifestThresholds.testDurationWarningMs}ms).`,
          recommendation: `Monitorea este test para evitar que se convierta en cuello de botella.`,
        });
      }
    }
  } else {
    findings.push({
      category: 'RENDIMIENTO_FLAKINESS',
      severity: 'LOW',
      target: 'telemetry',
      message: `No se encontraron recibos de la última corrida en '.tmp/quality/last-run.json'.`,
      recommendation: `Ejecuta 'npm run quality:gate' o 'npm run quality:impact' antes de correr 'quality:learn' para habilitar telemetría de tiempos reales.`,
    });
  }

  const high = findings.filter((f) => f.severity === 'HIGH').length;
  const medium = findings.filter((f) => f.severity === 'MEDIUM').length;
  const low = findings.filter((f) => f.severity === 'LOW').length;

  const report: LearnReport = {
    generatedAt: new Date().toISOString(),
    gitHead,
    summary: {
      totalFindings: findings.length,
      high,
      medium,
      low,
    },
    findings,
    lastRunTelemetry: {
      available: !!lastRun,
      timestamp: lastRun?.timestamp,
      totalTests: lastRun?.testMetrics?.total,
      passed: lastRun?.testMetrics?.passed,
      failed: lastRun?.testMetrics?.failed,
      durationMs: lastRun?.durationMs,
    },
  };

  ensureTmpDir();
  fs.writeFileSync(LEARN_REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf-8');
  return report;
}

export function printLearnReport(report: LearnReport): void {
  console.log('\n======================================================');
  console.log('       🧠 AUDITORÍA Y APRENDIZAJE: QUALITY:LEARN      ');
  console.log('       (Diagnóstico Consultivo y Brechas de Calidad)   ');
  console.log('======================================================\n');

  console.log(`📊 Resumen de Hallazgos: ${report.summary.totalFindings}`);
  console.log(`   🔴 ALTA SEVERIDAD (HIGH):   ${report.summary.high}`);
  console.log(`   🟡 MEDIA SEVERIDAD (MED):   ${report.summary.medium}`);
  console.log(`   🔵 BAJA SEVERIDAD (LOW):    ${report.summary.low}\n`);

  if (report.findings.length === 0) {
    console.log('✨ ¡Excelente! No se detectaron brechas de cobertura, mapeo ni riesgos de latencia.');
  } else {
    report.findings.forEach((f, idx) => {
      const icon = f.severity === 'HIGH' ? '🔴 [HIGH]' : f.severity === 'MEDIUM' ? '🟡 [MED]' : '🔵 [LOW]';
      console.log(`--- [Hallazgo #${idx + 1}] ${icon} [${f.category}] ---`);
      console.log(`🎯 Objetivo: ${f.target}`);
      console.log(`💬 Detalle:  ${f.message}`);
      console.log(`💡 Acción:   ${f.recommendation}\n`);
    });
  }

  console.log(`📁 Reporte estructurado guardado en .tmp/quality/learn-report.json`);
  console.log('📌 Nota: Este análisis es estrictamente consultivo y no muta código.');
  console.log('======================================================\n');
}

// Ejecución como script directo
if (require.main === module || process.argv[1]?.endsWith('learn.ts') || process.argv[1]?.endsWith('learn.js')) {
  const report = analyzeQualityLearn();
  printLearnReport(report);

  if (process.argv.includes('--strict') && report.summary.high > 0) {
    console.error(`❌ Proceso rechazado en modo --strict: Existen ${report.summary.high} hallazgo(s) de severidad HIGH sin resolver.`);
    process.exit(1);
  }
}
