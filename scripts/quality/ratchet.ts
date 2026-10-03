import { execSync } from 'node:child_process';
import { loadBaseline, ROOT_DIR, type Baseline } from './common';

export interface RatchetCheckResult {
  passed: boolean;
  typeErrors: number;
  lintErrors: number;
  lintWarnings: number;
  violations: string[];
  improvements: string[];
}

export function checkTypecheckRatchet(baseline?: Baseline): { passed: boolean; errorCount: number; violations: string[] } {
  const currentBaseline = baseline ?? loadBaseline();
  const violations: string[] = [];
  let errorCount = 0;

  try {
    execSync('npx tsc --noEmit', { cwd: ROOT_DIR, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err: unknown) {
    const errorObj = err as { stdout?: string; stderr?: string };
    const output = (errorObj.stdout || '') + '\n' + (errorObj.stderr || '');
    // Contar líneas con error tipo TSxxxx:
    const errorMatches = output.match(/error TS\d+:/g);
    errorCount = errorMatches ? errorMatches.length : 1;
  }

  if (errorCount > currentBaseline.rules.maxTypeErrors) {
    violations.push(
      `[TRINQUETE TYPESCRIPT] Se encontraron ${errorCount} error(es) de tipo (máximo permitido por baseline: ${currentBaseline.rules.maxTypeErrors}).`
    );
  }

  return {
    passed: violations.length === 0,
    errorCount,
    violations,
  };
}

export function checkLintRatchet(baseline?: Baseline): {
  passed: boolean;
  errorCount: number;
  warningCount: number;
  violations: string[];
  improvements: string[];
} {
  const currentBaseline = baseline ?? loadBaseline();
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
    // Buscar resumen tipo: ✖ 49 problems (36 errors, 13 warnings)
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
      `[TRINQUETE LINTER] Se encontraron ${errorCount} error(es) de ESLint (máximo permitido por baseline: ${currentBaseline.rules.maxLintErrors}). ¡No se permite introducir nuevos errores!`
    );
  } else if (errorCount < currentBaseline.rules.maxLintErrors) {
    improvements.push(
      `[MEJORA LINTER] Los errores de linter bajaron de ${currentBaseline.rules.maxLintErrors} a ${errorCount}. Ejecuta 'npm run quality:baseline:update' para congelar la nueva marca.`
    );
  }

  return {
    passed: violations.length === 0,
    errorCount,
    warningCount,
    violations,
    improvements,
  };
}

export function runAllRatchetChecks(baseline?: Baseline): RatchetCheckResult {
  const currentBaseline = baseline ?? loadBaseline();
  console.log('🔍 Ejecutando verificación de trinquete de tipos (tsc)...');
  const typeResult = checkTypecheckRatchet(currentBaseline);

  console.log('🔍 Ejecutando verificación de trinquete de linter (eslint)...');
  const lintResult = checkLintRatchet(currentBaseline);

  const violations = [...typeResult.violations, ...lintResult.violations];
  const improvements = [...lintResult.improvements];

  return {
    passed: violations.length === 0,
    typeErrors: typeResult.errorCount,
    lintErrors: lintResult.errorCount,
    lintWarnings: lintResult.warningCount,
    violations,
    improvements,
  };
}
