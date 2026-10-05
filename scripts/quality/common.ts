import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface Lane {
  id: string;
  name: string;
  description: string;
  patterns: string[];
  tests: string[];
  escalatesToFull?: boolean;
}

export interface Manifest {
  version: string;
  lanes: Lane[];
  thresholds: {
    testDurationWarningMs: number;
    testDurationCriticalMs: number;
    maxNewErrorsAllowed: number;
  };
}

export interface Baseline {
  version: string;
  generatedAt: string;
  branch: string;
  metrics: {
    typeErrors: number;
    lintErrors: number;
    lintWarnings: number;
    totalTests: number;
    passingTests: number;
    failingTests: number;
  };
  knownFailingTests: Array<{
    suite: string;
    name: string;
    reason: string;
  }>;
  rules: {
    failOnNewTestFailure: boolean;
    maxFailingTests: number;
    maxLintErrors: number;
    maxTypeErrors: number;
  };
}

export interface LastRunReceipt {
  timestamp: string;
  mode: 'impact' | 'full' | 'gate';
  gitHead: string;
  impactedLanes: string[];
  changedFiles: string[];
  testsRun: string[];
  durationMs: number;
  testMetrics: {
    total: number;
    passed: number;
    failed: number;
    durationsByTest: Record<string, number>;
  };
  ratchetStatus: {
    typecheckPassed: boolean;
    lintPassed: boolean;
    testsPassed: boolean;
    violations: string[];
  };
  exitCode: number;
}

export const ROOT_DIR = path.resolve(__dirname, '../..');
export const MANIFEST_PATH = path.join(ROOT_DIR, 'quality/manifest.json');
export const BASELINE_PATH = path.join(ROOT_DIR, 'docs/quality/baseline.json');
export const TMP_DIR = path.join(ROOT_DIR, '.tmp/quality');
export const LAST_RUN_PATH = path.join(TMP_DIR, 'last-run.json');
export const LEARN_REPORT_PATH = path.join(TMP_DIR, 'learn-report.json');

export function ensureTmpDir(): void {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

export function loadManifest(): Manifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest not found at ${MANIFEST_PATH}`);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

export function loadBaseline(): Baseline {
  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(`Baseline not found at ${BASELINE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
}

export function saveBaseline(baseline: Baseline): void {
  const dir = path.dirname(BASELINE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n', 'utf-8');
}

export function saveLastRun(receipt: LastRunReceipt): void {
  ensureTmpDir();
  fs.writeFileSync(LAST_RUN_PATH, JSON.stringify(receipt, null, 2) + '\n', 'utf-8');
}

export function loadLastRun(): LastRunReceipt | null {
  if (!fs.existsSync(LAST_RUN_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(LAST_RUN_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Normaliza rutas a formato Unix con barras hacia adelante (/)
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Obtiene lista de archivos modificados mediante git
 */
export function getChangedFiles(baseBranch?: string): string[] {
  const changed = new Set<string>();

  const runGit = (cmd: string): string => {
    try {
      return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch {
      return '';
    }
  };

  // 1. Archivos unstaged o en working tree
  const statusOut = runGit('git status --porcelain');
  if (statusOut) {
    statusOut.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^..\s+(.*)$/);
      if (!match) return;
      const rawPath = match[1].trim();
      const parts = rawPath.split(' -> ');
      const filePath = parts[parts.length - 1]?.trim().replace(/^"|"$/g, '');
      if (filePath) {
        if (filePath.endsWith('/')) {
          const fullDirPath = path.join(ROOT_DIR, filePath);
          if (fs.existsSync(fullDirPath) && fs.statSync(fullDirPath).isDirectory()) {
            const listAll = (d: string): string[] => {
              const entries = fs.readdirSync(d, { withFileTypes: true });
              let res: string[] = [];
              for (const e of entries) {
                const sub = path.join(d, e.name);
                if (e.isDirectory()) res = res.concat(listAll(sub));
                else res.push(sub);
              }
              return res;
            };
            listAll(fullDirPath).forEach((f) => {
              changed.add(normalizePath(path.relative(ROOT_DIR, f)));
            });
            return;
          }
        }
        changed.add(normalizePath(filePath));
      }
    });
  }

  // 2. Diff respecto a la rama base (por defecto origin/main o main o HEAD~1)
  const branchesToTry = baseBranch ? [baseBranch] : ['origin/main', 'main', 'origin/DEV', 'DEV', 'HEAD~1'];
  let diffBase = '';
  for (const b of branchesToTry) {
    const testMergeBase = runGit(`git merge-base HEAD ${b}`);
    if (testMergeBase) {
      diffBase = testMergeBase;
      break;
    }
  }

  if (diffBase) {
    const diffOut = runGit(`git diff --name-only ${diffBase}...HEAD`);
    if (diffOut) {
      diffOut.split('\n').forEach((line) => {
        const file = line.trim();
        if (file) changed.add(normalizePath(file));
      });
    }
  }

  return Array.from(changed).filter(Boolean);
}

/**
 * Comprueba si un path relativo coincide con un patrón tipo glob
 */
export function matchPattern(filePath: string, pattern: string): boolean {
  const normFile = normalizePath(filePath);
  const normPat = normalizePath(pattern);

  if (normPat.endsWith('/**')) {
    const prefix = normPat.slice(0, -3);
    return normFile === prefix || normFile.startsWith(prefix + '/');
  }

  if (normPat.startsWith('tests/*.test.ts')) {
    return normFile.startsWith('tests/') && normFile.endsWith('.test.ts');
  }

  if (normPat === normFile) return true;

  // Manejo de comodín simple *
  const regexStr = '^' + normPat.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*') + '$';
  return new RegExp(regexStr).test(normFile);
}
