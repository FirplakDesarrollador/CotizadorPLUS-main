import fs from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './common';

export const CANONICAL_SKILL_REL = '.agents/skills/desplegar/SKILL.md';
export const CANONICAL_AGENTS_REL = 'AGENTS.md';

export interface SyncTarget {
  relPath: string;
  render: (canonicalSkill: string, canonicalAgents: string) => string;
}

function normalizeLf(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd() + '\n';
}

export function parseFrontmatter(content: string): {
  meta: Record<string, string>;
  body: string;
  rawFrontmatter: string | null;
} {
  const norm = normalizeLf(content);
  const match = norm.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: norm, rawFrontmatter: null };
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) meta[key] = val;
  }
  return {
    meta,
    body: match[2].replace(/^\n+/, ''),
    rawFrontmatter: match[1],
  };
}

export function buildSyncTargets(): SyncTarget[] {
  return [
    {
      relPath: '.claude/skills/desplegar/SKILL.md',
      render: (canonicalSkill) => normalizeLf(canonicalSkill),
    },
    {
      relPath: '.agents/workflows/desplegar.md',
      render: (canonicalSkill) => {
        const { meta, body } = parseFrontmatter(canonicalSkill);
        const desc = meta.description || 'Sistema modular de calidad y despliegue controlado.';
        return normalizeLf(
          [
            '---',
            `description: ${desc}`,
            '---',
            '',
            '<!-- AUTO-GENERATED from .agents/skills/desplegar/SKILL.md via npm run skills:sync. Do not edit directly. -->',
            '',
            body,
          ].join('\n')
        );
      },
    },
    {
      relPath: '.cursor/rules/desplegar.mdc',
      render: (canonicalSkill) => {
        const { meta, body } = parseFrontmatter(canonicalSkill);
        const desc = meta.description || 'Protocolo universal /desplegar';
        return normalizeLf(
          [
            '---',
            `description: ${desc}`,
            'alwaysApply: false',
            '---',
            '',
            '<!-- AUTO-GENERATED from .agents/skills/desplegar/SKILL.md via npm run skills:sync. Do not edit directly. -->',
            '',
            body,
          ].join('\n')
        );
      },
    },
    {
      relPath: '.agents/AGENTS.md',
      render: (_canonicalSkill, canonicalAgents) =>
        normalizeLf(
          [
            '<!-- AUTO-GENERATED from AGENTS.md via npm run skills:sync. Do not edit directly. -->',
            '',
            canonicalAgents,
          ].join('\n')
        ),
    },
    {
      relPath: '.cursor/rules/agents.mdc',
      render: (_canonicalSkill, canonicalAgents) =>
        normalizeLf(
          [
            '---',
            'description: Instrucciones canónicas del repositorio Cotizador PLUS (sincronizadas desde AGENTS.md)',
            'alwaysApply: true',
            '---',
            '',
            '<!-- AUTO-GENERATED from AGENTS.md via npm run skills:sync. Do not edit directly. -->',
            '',
            canonicalAgents,
          ].join('\n')
        ),
    },
  ];
}

export function readCanonicalSources(): { skill: string; agents: string } {
  const skillPath = path.join(ROOT_DIR, CANONICAL_SKILL_REL);
  const agentsPath = path.join(ROOT_DIR, CANONICAL_AGENTS_REL);
  if (!fs.existsSync(skillPath)) {
    throw new Error(`No existe la fuente canónica del skill: ${CANONICAL_SKILL_REL}`);
  }
  if (!fs.existsSync(agentsPath)) {
    throw new Error(`No existe la fuente canónica de instrucciones raíz: ${CANONICAL_AGENTS_REL}`);
  }
  return {
    skill: normalizeLf(fs.readFileSync(skillPath, 'utf-8')),
    agents: normalizeLf(fs.readFileSync(agentsPath, 'utf-8')),
  };
}

export function syncSkills(): { written: string[] } {
  const { skill, agents } = readCanonicalSources();
  const targets = buildSyncTargets();
  const written: string[] = [];

  for (const target of targets) {
    const absPath = path.join(ROOT_DIR, target.relPath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const expected = target.render(skill, agents);
    fs.writeFileSync(absPath, expected, 'utf-8');
    written.push(target.relPath);
  }

  return { written };
}

export function checkSkillsSync(): { inSync: boolean; drifted: string[]; missing: string[] } {
  const { skill, agents } = readCanonicalSources();
  const targets = buildSyncTargets();
  const drifted: string[] = [];
  const missing: string[] = [];

  for (const target of targets) {
    const absPath = path.join(ROOT_DIR, target.relPath);
    if (!fs.existsSync(absPath)) {
      missing.push(target.relPath);
      continue;
    }
    const stat = fs.lstatSync(absPath);
    if (stat.isSymbolicLink()) {
      drifted.push(`${target.relPath} (symlink prohibido; debe ser copia determinista)`);
      continue;
    }
    const actual = normalizeLf(fs.readFileSync(absPath, 'utf-8'));
    const expected = target.render(skill, agents);
    if (actual !== expected) {
      drifted.push(target.relPath);
    }
  }

  return {
    inSync: drifted.length === 0 && missing.length === 0,
    drifted,
    missing,
  };
}

export function validateSkills(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { skill, agents } = readCanonicalSources();
  const { meta, rawFrontmatter } = parseFrontmatter(skill);

  if (!rawFrontmatter) {
    errors.push(`${CANONICAL_SKILL_REL}: falta el bloque frontmatter YAML.`);
  } else {
    const allowedKeys = new Set(['name', 'description']);
    const keys = Object.keys(meta);
    if (meta.name !== 'desplegar') {
      errors.push(`${CANONICAL_SKILL_REL}: frontmatter 'name' debe ser 'desplegar' (actual: '${meta.name ?? ''}').`);
    }
    if (!meta.description || meta.description.length < 20) {
      errors.push(`${CANONICAL_SKILL_REL}: frontmatter 'description' ausente o demasiado corta.`);
    }
    for (const k of keys) {
      if (!allowedKeys.has(k)) {
        errors.push(`${CANONICAL_SKILL_REL}: metadato propietario/no estándar en frontmatter: '${k}'.`);
      }
    }
  }

  const requiredTokens = [
    '/desplegar plan',
    '/desplegar impact',
    '/desplegar quick',
    '/desplegar gate',
    '/desplegar full',
    '/desplegar learn',
    '/desplegar release',
    'VERIFIED',
    'FAILED',
    'SKIPPED',
    'NOT_CONFIGURED',
    '.tmp/quality/learning-report.md',
    'autorización explícita',
    'git fetch origin',
  ];

  for (const token of requiredTokens) {
    if (!skill.includes(token)) {
      errors.push(`${CANONICAL_SKILL_REL}: falta la cláusula obligatoria '${token}'.`);
    }
  }

  if (!agents.includes('/desplegar') || !agents.includes('.agents/skills/desplegar/SKILL.md')) {
    errors.push('AGENTS.md: debe declarar explícitamente el protocolo /desplegar y su fuente canónica.');
  }

  const claudePath = path.join(ROOT_DIR, 'CLAUDE.md');
  if (!fs.existsSync(claudePath)) {
    errors.push('CLAUDE.md: archivo ausente.');
  } else {
    const claudeContent = fs.readFileSync(claudePath, 'utf-8');
    if (!claudeContent.includes('@AGENTS.md')) {
      errors.push('CLAUDE.md: debe importar @AGENTS.md.');
    }
  }

  const geminiPath = path.join(ROOT_DIR, 'GEMINI.md');
  if (!fs.existsSync(geminiPath)) {
    errors.push('GEMINI.md: archivo ausente.');
  } else {
    const geminiContent = fs.readFileSync(geminiPath, 'utf-8');
    if (!geminiContent.includes('AGENTS.md') || !geminiContent.includes('.agents/skills/desplegar/SKILL.md')) {
      errors.push('GEMINI.md: debe referenciar AGENTS.md y .agents/skills/desplegar/SKILL.md.');
    }
  }

  const syncRes = checkSkillsSync();
  if (!syncRes.inSync) {
    for (const m of syncRes.missing) errors.push(`Destino sincronizado ausente: ${m}`);
    for (const d of syncRes.drifted) errors.push(`Destino desincronizado: ${d}`);
  }

  return { valid: errors.length === 0, errors };
}

if (require.main === module || process.argv[1]?.endsWith('skills-sync.ts') || process.argv[1]?.endsWith('skills-sync.js')) {
  const args = process.argv.slice(2);

  if (args.includes('--sync')) {
    const { written } = syncSkills();
    console.log(`VERIFIED: ${written.length} archivo(s) sincronizados desde ${CANONICAL_SKILL_REL} y ${CANONICAL_AGENTS_REL}:`);
    written.forEach((f) => console.log(`  - ${f}`));
    process.exit(0);
  }

  if (args.includes('--validate')) {
    const res = validateSkills();
    if (res.valid) {
      console.log('VERIFIED: Skill /desplegar, frontmatter YAML estándar, AGENTS/CLAUDE/GEMINI y destinos multi-IDE válidos.');
      process.exit(0);
    } else {
      console.error('FAILED: Errores de validación de skills:');
      res.errors.forEach((e) => console.error(`  - ${e}`));
      process.exit(1);
    }
  }

  // Default: --check
  const check = checkSkillsSync();
  if (check.inSync) {
    console.log('VERIFIED: Todos los destinos multi-IDE de /desplegar y AGENTS.md están sincronizados.');
    process.exit(0);
  } else {
    console.error('FAILED: Desincronización detectada. Ejecuta `npm run skills:sync`.');
    check.missing.forEach((m) => console.error(`  - Ausente: ${m}`));
    check.drifted.forEach((d) => console.error(`  - Divergente: ${d}`));
    process.exit(1);
  }
}
