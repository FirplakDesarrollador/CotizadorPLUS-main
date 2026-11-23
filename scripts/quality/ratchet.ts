import { execSync } from 'node:child_process';
import { loadBaseline, ROOT_DIR, type Baseline } from './common';

export interface StaticCheckDetail {
  passed: boolean;
  errorCount: number;
  warningCount: number;
  durationMs: number;
  violations: string[];
  improvements: string[];
}

export interface RatchetCheckResult {
  passed: boolean;
  typeErrors: number;
  lintErrors: number;
  lintWarnings: number;
  typecheck: StaticCheckDetail;
  lint: StaticCheckDetail;
  violations: string[];
  improvements: string[];
}

export function checkTypecheckRatchet(baseline?: Baseline): StaticCheckDetail {
  const currentBaseline = baseline ?? loadBaseline();
  const startTime = Date.now();
  const violations: string[] = [];
  const improvements: string[] = [];
  let errorCount = 0;

  try {
    execSync('npx tsc --noEmit', { cwd: ROOT_DIR, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err: unknown) {
    const errorObj = err as { stdout?: string; stderr?: string };
    const output = (errorObj.stdout || '') + '\n' + (errorObj.stderr || '');
    const errorMatches = output.match(/error TS\d+:/g);
    errorCount = errorMatches ? errorMatches.length : 1;
  }

  if (errorCount > currentBaseline.rules.maxTypeErrors) {
    violations.push(
      `[TRINQUETE TYPESCRIPT] Se encontraron ${errorCount} error(es) de tipo (máximo permitido: ${currentBaseline.rules.maxTypeErrors}).`
    );
  } else if (errorCount < currentBaseline.rules.maxTypeErrors) {
    improvements.push(
      `[MEJORA TYPESCRIPT] Los errores de tipo bajaron de ${currentBaseline.rules.maxTypeErrors} a ${errorCount}.`
    );
  }

  return {
    passed: violations.length === 0,
    errorCount,
    warningCount: 0,
    durationMs: Date.now() - startTime,
    violations,
    improvements,
  };
}

export function checkLintRatchet(baseline?: Baseline): StaticCheckDetail {
  const currentBaseline = baseline ?? loadBaseline();
  const startTime = Date.now();
  const violations: string[] = [];
  const improvements: string[] = [];
  let errorCount = 0;
  let warningCount = 0;

  try {
    execSync('npm run lint', { cwd: ROOT_DIR, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    errorCount = 0;
  } catch (err: unknown) {
    const errorObj = err as { stdout?: string; stderr?: string };
    const output = (errorObj.stdout || '') + '\n' + (errorObj.stderr || '');
    const summaryMatch = output.match(/(\d+)\s+errors?,\s+(\d+)\s+warnings?/);
    if (summaryMatch) {
      errorCount = parseInt(summaryMatch[1], 10);
      warningCount = parseInt(summaryMatch[2], 10);
    } else {
      const errorMatches = output.match(/\berror\b/g);
      errorCount = errorMatches ? errorMatches.length : 1;
    }
  }

  if (errorCount > currentBaseline.rules.maxLintErrors) {
    violations.push(
      `[TRINQUETE LINTER] Se encontraron ${errorCount} error(es) de ESLint (máximo permitido: ${currentBaseline.rules.maxLintErrors}). No se permite introducir errores nuevos.`
    );
  } else if (errorCount < currentBaseline.rules.maxLintErrors) {
    improvements.push(
      `[MEJORA LINTER] Los errores de linter bajaron de ${currentBaseline.rules.maxLintErrors} a ${errorCount}. Ejecuta 'npm run quality:baseline:update' para consolidar la mejora.`
    );
  }

  return {
    passed: violations.length === 0,
    errorCount,
    warningCount,
    durationMs: Date.now() - startTime,
    violations,
    improvements,
  };
}

export function runAllRatchetChecks(baseline?: Baseline): RatchetCheckResult {
  const currentBaseline = baseline ?? loadBaseline();
  console.log('Verificando trinquete de tipos (tsc)...');
  const typecheck = checkTypecheckRatchet(currentBaseline);

  console.log('Verificando trinquete de linter (eslint)...');
  const lint = checkLintRatchet(currentBaseline);

  const violations = [...typecheck.violations, ...lint.violations];
  const improvements = [...typecheck.improvements, ...lint.improvements];

  return {
    passed: violations.length === 0,
    typeErrors: typecheck.errorCount,
    lintErrors: lint.errorCount,
    lintWarnings: lint.warningCount,
    typecheck,
    lint,
    violations,
    improvements,
  };
}
