import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export type QualityMode = 'plan' | 'impact' | 'quick' | 'gate' | 'full' | 'learn';
export type StageStatus = 'VERIFIED' | 'FAILED' | 'SKIPPED' | 'NOT_CONFIGURED';

export interface Lane {
  id: string;
  name: string;
  description: string;
  patterns: string[];
  tests: string[];
  escalatesToFull?: boolean;
  critical?: boolean;
}

export interface Manifest {
  version: string;
  ignoredNonProductivePatterns?: string[];
  lanes: Lane[];
  thresholds: {
    testDurationWarningMs: number;
    testDurationCriticalMs: number;
    stageDurationWarningMs?: number;
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

export interface StageReceipt {
  name: string;
  required: boolean;
  status: StageStatus;
  exitCode: number | null;
  durationMs: number;
  details: string;
}

export interface DevSyncStatus {
  available: boolean;
  devRef: string | null;
  behindCount: number;
  aheadCount: number;
  pendingCommits: string[];
}

export interface RunReceipt {
  timestamp: string;
  requestedMode: QualityMode;
  effectiveMode: QualityMode;
  escalatedToFull: boolean;
  escalationReasons: string[];
  gitBranch: string;
  gitHead: string;
  devSync: DevSyncStatus;
  impactedLanes: string[];
  changedFiles: string[];
  orphanFiles: string[];
  testsRun: string[];
  stages: StageReceipt[];
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
    policyPassed: boolean;
    skillsCheckPassed: boolean;
    violations: string[];
  };
  exitCode: number;
}

export const ROOT_DIR = path.resolve(__dirname, '../..');
export const MANIFEST_PATH = path.join(ROOT_DIR, 'quality/manifest.json');
export const BASELINE_PATH = path.join(ROOT_DIR, 'docs/quality/baseline.json');
export const TMP_DIR = path.join(ROOT_DIR, '.tmp/quality');
export const RUN_RECEIPT_PATH = path.join(TMP_DIR, 'run-receipt.json');
export const LAST_RUN_PATH = path.join(TMP_DIR, 'last-run.json');
export const LEARN_REPORT_PATH = path.join(TMP_DIR, 'learn-report.json');
export const LEARNING_REPORT_MD_PATH = path.join(TMP_DIR, 'learning-report.md');

export function ensureTmpDir(): void {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

export function loadManifest(): Manifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest not found at ${MANIFEST_PATH}`);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as Manifest;
}

export function loadBaseline(): Baseline {
  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(`Baseline not found at ${BASELINE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8')) as Baseline;
}

export function saveBaseline(baseline: Baseline): void {
  const dir = path.dirname(BASELINE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n', 'utf-8');
}

export function saveRunReceipt(receipt: RunReceipt): void {
  ensureTmpDir();
  const payload = JSON.stringify(receipt, null, 2) + '\n';
  fs.writeFileSync(RUN_RECEIPT_PATH, payload, 'utf-8');
  fs.writeFileSync(LAST_RUN_PATH, payload, 'utf-8');
}

export function normalizeRunReceipt(raw: Record<string, unknown>): RunReceipt | null {
  if (!raw || typeof raw !== 'object') return null;
  const legacyMode = typeof raw.mode === 'string' ? (raw.mode as QualityMode) : undefined;
  const requestedMode = (typeof raw.requestedMode === 'string' ? raw.requestedMode : legacyMode) as QualityMode | undefined;
  const effectiveMode = (typeof raw.effectiveMode === 'string' ? raw.effectiveMode : requestedMode) as QualityMode | undefined;
  if (!requestedMode || !effectiveMode) return null;

  return {
    timestamp: String(raw.timestamp ?? ''),
    requestedMode,
    effectiveMode,
    escalatedToFull: Boolean(raw.escalatedToFull ?? false),
    escalationReasons: Array.isArray(raw.escalationReasons) ? (raw.escalationReasons as string[]) : [],
    gitBranch: String(raw.gitBranch ?? getCurrentBranch()),
    gitHead: String(raw.gitHead ?? 'UNKNOWN'),
    devSync: (raw.devSync as DevSyncStatus | undefined) ?? {
      available: false,
      devRef: null,
      behindCount: 0,
      aheadCount: 0,
      pendingCommits: [],
    },
    impactedLanes: Array.isArray(raw.impactedLanes) ? (raw.impactedLanes as string[]) : [],
    changedFiles: Array.isArray(raw.changedFiles) ? (raw.changedFiles as string[]) : [],
    orphanFiles: Array.isArray(raw.orphanFiles) ? (raw.orphanFiles as string[]) : [],
    testsRun: Array.isArray(raw.testsRun) ? (raw.testsRun as string[]) : [],
    stages: Array.isArray(raw.stages) ? (raw.stages as StageReceipt[]) : [],
    durationMs: Number(raw.durationMs ?? 0),
    testMetrics: (raw.testMetrics as RunReceipt['testMetrics'] | undefined) ?? {
      total: 0,
      passed: 0,
      failed: 0,
      durationsByTest: {},
    },
    ratchetStatus: (raw.ratchetStatus as RunReceipt['ratchetStatus'] | undefined) ?? {
      typecheckPassed: true,
      lintPassed: true,
      testsPassed: true,
      policyPassed: true,
      skillsCheckPassed: true,
      violations: [],
    },
    exitCode: Number(raw.exitCode ?? 1),
  };
}

export function loadRunReceipt(): RunReceipt | null {
  for (const target of [RUN_RECEIPT_PATH, LAST_RUN_PATH]) {
    if (fs.existsSync(target)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(target, 'utf-8')) as Record<string, unknown>;
        return normalizeRunReceipt(parsed);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function getDiffBaseRef(baseBranch?: string): string {
  const branchesToTry = baseBranch
    ? [baseBranch]
    : ['origin/DEV', 'DEV', 'origin/main', 'main', 'HEAD~1'];

  for (const b of branchesToTry) {
    const mergeBase = runGitSafe(`git merge-base HEAD ${b}`);
    if (mergeBase) return mergeBase;
  }
  return '';
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

export function runGitSafe(cmd: string): string {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

export function getCurrentBranch(): string {
  return runGitSafe('git rev-parse --abbrev-ref HEAD') || 'UNKNOWN';
}

export function getCurrentHead(): string {
  return runGitSafe('git rev-parse HEAD') || 'UNKNOWN';
}

export function getDevSyncStatus(): DevSyncStatus {
  const candidates = ['origin/DEV', 'DEV'];
  let devRef: string | null = null;
  for (const ref of candidates) {
    if (runGitSafe(`git rev-parse --verify --quiet ${ref}`)) {
      devRef = ref;
      break;
    }
  }

  if (!devRef) {
    return { available: false, devRef: null, behindCount: 0, aheadCount: 0, pendingCommits: [] };
  }

  const counts = runGitSafe(`git rev-list --left-right --count HEAD...${devRef}`);
  const [aheadRaw, behindRaw] = counts.split(/\s+/);
  const aheadCount = parseInt(aheadRaw || '0', 10) || 0;
  const behindCount = parseInt(behindRaw || '0', 10) || 0;

  const pendingOut = behindCount > 0 ? runGitSafe(`git log --oneline -n 10 HEAD..${devRef}`) : '';
  const pendingCommits = pendingOut ? pendingOut.split(/\r?\n/).filter(Boolean) : [];

  return {
    available: true,
    devRef,
    behindCount,
    aheadCount,
    pendingCommits,
  };
}

/**
 * Obtiene lista de archivos modificados en working tree + commits propios respecto a la rama base.
 * Si hay cambios en working tree o commits sin empujar sobre la rama actual, prioriza el diff local
 * respecto al upstream o merge-base.
 */
export function getChangedFiles(baseBranch?: string): string[] {
  const changed = new Set<string>();

  // 1. Archivos unstaged, staged o untracked en working tree
  const statusOut = runGitSafe('git status --porcelain');
  if (statusOut) {
    statusOut.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^..\s+(.*)$/);
      if (!match) return;
      const rawPath = match[1].trim();
      const parts = rawPath.split(' -> ');
      const filePath = parts[parts.length - 1]?.trim().replace(/^"|"$/g, '');
      if (!filePath) return;

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
    });
  }

  // 2. Diff de commits locales frente a la rama base
  const diffBase = getDiffBaseRef(baseBranch);

  if (diffBase) {
    const diffOut = runGitSafe(`git diff --name-only ${diffBase}...HEAD`);
    if (diffOut) {
      diffOut.split(/\r?\n/).forEach((line) => {
        const file = line.trim();
        if (file) changed.add(normalizePath(file));
      });
    }
  }

  return Array.from(changed).filter(Boolean).sort();
}

/**
 * Comprueba si un path relativo coincide con un patrón glob sencillo.
 */
export function matchPattern(filePath: string, pattern: string): boolean {
  const normFile = normalizePath(filePath);
  const normPat = normalizePath(pattern);

  if (normPat === normFile) return true;

  if (normPat.endsWith('/**')) {
    const prefix = normPat.slice(0, -3);
    return normFile === prefix || normFile.startsWith(prefix + '/');
  }

  if (normPat.startsWith('*.') && !normPat.includes('/')) {
    const ext = normPat.slice(1);
    return normFile.endsWith(ext);
  }

  const escaped = normPat
    .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
    .replace(/\\\*\\\*/g, '.*')
    .replace(/\\\*/g, '[^/]*');

  return new RegExp(`^${escaped}$`).test(normFile);
}

/**
 * Valida la regla de estados verificables: ninguna etapa requerida puede quedar
 * FAILED, SKIPPED o NOT_CONFIGURED.
 */
export function evaluateStageGate(stages: StageReceipt[]): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const stage of stages) {
    if (stage.required && stage.status !== 'VERIFIED') {
      failures.push(
        `[ETAPA REQUERIDA] '${stage.name}' terminó en estado ${stage.status} (solo VERIFIED permite aprobar). ${stage.details}`
      );
    }
  }
  return { passed: failures.length === 0, failures };
}
