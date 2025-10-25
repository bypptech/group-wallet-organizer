#!/usr/bin/env node

/**
 * AI Config Migrator
 * - Merges legacy .claude, .gemini, .kiro directories into current project
 * - Preserves originals under `legacy/` subfolders and builds aggregate INDEX files
 *
 * Usage:
 *   node scripts/ai-config-migrator.js \
 *     --legacy-tsumiki /path/to/tsumiki \
 *     --legacy-vibekit /path/to/Web3AIVibeCodingKit \
 *     [--strategy merge|mirror] [--conflict rename|overwrite|skip]
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const getArg = (name, def = undefined) => {
  const i = args.indexOf(name);
  if (i === -1) return def;
  return args[i + 1];
};

const LEGACY_TSUMIKI = getArg('--legacy-tsumiki');
const LEGACY_VIBEKIT = getArg('--legacy-vibekit');
const STRATEGY = (getArg('--strategy', 'merge')); // merge|mirror
const CONFLICT = (getArg('--conflict', 'rename')); // rename|overwrite|skip

// Allow running without legacy flags when syncing from .ai (single source)

const projectRoot = process.cwd();
const tools = [
  { name: 'claude', subdirs: ['commands', 'agents'] },
  { name: 'gemini', subdirs: ['prompts', 'config'] },
  { name: 'kiro', subdirs: ['templates', 'rules'] }
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function listFilesRecursive(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else out.push(full);
  }
  return out;
}

function copyFileSafe(src, dst) {
  const dstDir = path.dirname(dst);
  ensureDir(dstDir);
  if (fs.existsSync(dst)) {
    if (CONFLICT === 'skip') return { action: 'skip' };
    if (CONFLICT === 'rename') {
      const { name, ext } = path.parse(dst);
      const renamed = path.join(dstDir, `${name}.legacy${ext}`);
      fs.copyFileSync(src, renamed);
      return { action: 'rename', to: renamed };
    }
    // overwrite
  }
  fs.copyFileSync(src, dst);
  return { action: 'copy' };
}

function aggregateIndex(tool) {
  const baseDir = path.join(projectRoot, `.${tool.name}`);
  const indexCandidates = tool.name === 'claude' ? ['commands'] : (tool.name === 'gemini' ? ['prompts'] : ['templates', 'rules']);
  const lines = [
    `# ${tool.name[0].toUpperCase()}${tool.name.slice(1)} Aggregated Index`,
    '',
    `Strategy: ${STRATEGY}, Conflict: ${CONFLICT}`,
    ''
  ];

  for (const sub of indexCandidates) {
    const dir = path.join(baseDir, sub);
    lines.push(`## ${sub}`);
    if (!fs.existsSync(dir)) { lines.push('- (none)'); lines.push(''); continue; }
    const files = listFilesRecursive(dir)
      .filter(p => fs.statSync(p).isFile())
      .map(p => path.relative(baseDir, p));
    if (files.length === 0) lines.push('- (none)');
    else files.sort().forEach(f => lines.push(`- ${f}`));
    lines.push('');
  }

  const indexPath = path.join(baseDir, 'INDEX.md');
  fs.writeFileSync(indexPath, lines.join('\n'));
}

function migrateFrom(sourceRoot, label) {
  if (!sourceRoot) return { copied: 0 };
  let copied = 0;
  console.log(`\n➡️  Migrating from ${label}: ${sourceRoot}`);
  for (const tool of tools) {
    const srcToolDir = path.join(sourceRoot, `.${tool.name}`);
    if (!fs.existsSync(srcToolDir)) { console.log(`  - Skip .${tool.name} (not found)`); continue; }
    const dstToolDir = path.join(projectRoot, `.${tool.name}`, 'legacy', label);
    for (const sub of tool.subdirs) {
      const srcSub = path.join(srcToolDir, sub);
      if (!fs.existsSync(srcSub)) continue;
      const files = listFilesRecursive(srcSub);
      for (const f of files) {
        const rel = path.relative(srcSub, f);
        const dst = path.join(dstToolDir, sub, rel);
        const res = copyFileSafe(f, dst);
        if (res.action !== 'skip') copied++;
      }
    }
    aggregateIndex(tool);
    console.log(`  - .${tool.name} migrated`);
  }
  return { copied };
}

// mirror strategy clears previous legacy before copying
if (STRATEGY === 'mirror') {
  for (const tool of tools) {
    const legacyRoot = path.join(projectRoot, `.${tool.name}`, 'legacy');
    if (fs.existsSync(legacyRoot)) fs.rmSync(legacyRoot, { recursive: true, force: true });
  }
}

let total = 0;
const r1 = migrateFrom(LEGACY_TSUMIKI, 'tsumiki'); total += r1.copied;
const r2 = migrateFrom(LEGACY_VIBEKIT, 'vibekit'); total += r2.copied;

console.log(`\n✅ Migration complete. Files processed: ${total}`);

// --- .ai single-source sync (non-destructive) ---
const aiDir = path.join(projectRoot, '.ai')
if (fs.existsSync(aiDir)) {
  const aiConfig = path.join(aiDir, 'config.yaml')
  const aiQuality = path.join(aiDir, 'quality-gates.yaml')

  // mirror config.yaml as generated copies for each tool
  if (fs.existsSync(aiConfig)) {
    const buf = fs.readFileSync(aiConfig)
    for (const tool of ['.claude', '.gemini', '.kiro']) {
      const out = path.join(projectRoot, tool, 'config.generated.yaml')
      ensureDir(path.dirname(out))
      fs.writeFileSync(out, buf)
    }
    console.log('🪄 Synced .ai/config.yaml to tool configs (config.generated.yaml)')
  }

  // append reference to Kiro quality gates
  const kiroQuality = path.join(projectRoot, '.kiro', 'rules', 'quality-gates.md')
  if (fs.existsSync(aiQuality)) {
    ensureDir(path.dirname(kiroQuality))
    try {
      const marker = '\n\n> Synced: see .ai/quality-gates.yaml for single-source configuration.'
      const current = fs.existsSync(kiroQuality) ? fs.readFileSync(kiroQuality, 'utf8') : ''
      if (!current.includes('Synced: see .ai/quality-gates.yaml')) {
        fs.writeFileSync(kiroQuality, current + marker)
        console.log('🪄 Added reference to .ai/quality-gates.yaml in .kiro/rules/quality-gates.md')
      }
    } catch {}
  }
}

// --- Sync root mcp.json to tool-specific locations for backward compatibility ---
try {
  const rootMcp = path.join(projectRoot, 'mcp.json')
  const claudeMcp = path.join(projectRoot, '.claude', 'mcp.json')
  if (fs.existsSync(rootMcp)) {
    ensureDir(path.dirname(claudeMcp))
    fs.copyFileSync(rootMcp, claudeMcp)
    console.log('🪄 Synced root mcp.json to .claude/mcp.json')
  }
} catch {}

// --- Compose .gemini/settings.generated.json directly from .ai/config.yaml + root mcp.json ---
try {
  const aiCfgPath = path.join(projectRoot, '.ai', 'config.yaml')
  if (fs.existsSync(aiCfgPath)) {
    const raw = fs.readFileSync(aiCfgPath, 'utf8')
    const readBlock = (key) => {
      const lines = raw.split(/\r?\n/)
      const out = {}
      let inBlock = false
      let indent = ''
      for (const line of lines) {
        if (/^\s*$/.test(line)) continue
        if (!inBlock) {
          const m = line.match(new RegExp(`^${key}:\s*$`))
          if (m) { inBlock = true; continue }
        } else {
          if (/^[^\s]/.test(line)) break // next top-level
          const m2 = line.match(/^\s{2}([a-zA-Z0-9_-]+):\s*(.*)$/)
          if (m2) {
            const k = m2[1]; const v = m2[2]
            if (v === '' ) { out[k] = true } else {
              out[k] = v.replace(/^\[|\]$/g,'')
            }
          }
        }
      }
      return out
    }
    const readArrayBlock = (pathKey) => {
      const [parent, child] = pathKey.split('.')
      const lines = raw.split(/\r?\n/)
      const out = []
      let inParent = false, inChild = false
      for (const line of lines) {
        if (!inParent) {
          if (new RegExp(`^${parent}:\s*$`).test(line)) inParent = true
          continue
        }
        if (inParent && !inChild) {
          if (/^[^\s]/.test(line)) { inParent = false; continue }
          if (new RegExp(`^\s{2}${child}:\s*\[?`).test(line)) { inChild = true; continue }
          continue
        }
        if (inChild) {
          if (/^[^\s]/.test(line)) break
          const m = line.match(/^\s{4}-\s*(.+)$/)
          if (m) out.push(m[1].trim())
        }
      }
      return out
    }

    const project = readBlock('project')
    const roles = readBlock('roles')
    const frontend = readArrayBlock('techStack.frontend')
    const backend = readArrayBlock('techStack.backend')
    const contracts = readArrayBlock('techStack.contracts')

    const rootMcpPath = path.join(projectRoot, 'mcp.json')
    let mcpServers = undefined
    if (fs.existsSync(rootMcpPath)) {
      try { mcpServers = JSON.parse(fs.readFileSync(rootMcpPath, 'utf8')).mcpServers } catch {}
    }

    const geminiOut = {
      project: {
        name: project.name || 'bypp-aicoding-kit',
        description: project.description || ''
      },
      roles,
      techStack: { frontend, backend, contracts },
      mcpServers: mcpServers || {}
    }

    const outPath = path.join(projectRoot, '.gemini', 'settings.generated.json')
    ensureDir(path.dirname(outPath))
    fs.writeFileSync(outPath, JSON.stringify(geminiOut, null, 2))
    console.log('🪄 Wrote .gemini/settings.generated.json from .ai/config.yaml')
  }
} catch (e) {
  console.warn('⚠️ Gemini settings generation failed:', e?.message)
}

// --- Generate tool markdown overviews from .ai/config.yaml and quality gates ---
try {
  const aiCfgPath = path.join(projectRoot, '.ai', 'config.yaml')
  const aiQualityPath = path.join(projectRoot, '.ai', 'quality-gates.yaml')
  if (fs.existsSync(aiCfgPath)) {
    const raw = fs.readFileSync(aiCfgPath, 'utf8')

    const readBlock = (key) => {
      const lines = raw.split(/\r?\n/)
      const out = {}
      let inBlock = false
      for (const line of lines) {
        if (!inBlock) {
          if (new RegExp(`^${key}:\s*$`).test(line)) { inBlock = true; continue }
        } else {
          if (/^[^\s]/.test(line)) break
          const m = line.match(/^\s{2}([a-zA-Z0-9_-]+):\s*(.*)$/)
          if (m) out[m[1]] = m[2]
        }
      }
      return out
    }
    const readArrayBlock = (pathKey) => {
      const [parent, child] = pathKey.split('.')
      const lines = raw.split(/\r?\n/)
      const out = []
      let inParent = false, inChild = false
      for (const line of lines) {
        if (!inParent) { if (new RegExp(`^${parent}:\s*$`).test(line)) inParent = true; continue }
        if (inParent && !inChild) {
          if (/^[^\s]/.test(line)) { inParent = false; continue }
          if (new RegExp(`^\s{2}${child}:`).test(line)) { inChild = true; continue }
          continue
        }
        if (inChild) {
          if (/^[^\s]/.test(line)) break
          const m = line.match(/^\s{4}-\s*(.+)$/)
          if (m) out.push(m[1].trim())
        }
      }
      return out
    }

    const project = readBlock('project')
    const roles = readBlock('roles')
    const frontend = readArrayBlock('techStack.frontend')
    const backend = readArrayBlock('techStack.backend')
    const contracts = readArrayBlock('techStack.contracts')

    // quality gates (best-effort parse)
    let q = { specFirst: undefined, testFirst: undefined, coverage: undefined }
    if (fs.existsSync(aiQualityPath)) {
      try {
        const qraw = fs.readFileSync(aiQualityPath, 'utf8')
        q.specFirst = /specFirst:\s*true/.test(qraw)
        q.testFirst = /testFirst:\s*true/.test(qraw)
        const m = qraw.match(/coverage:\s*[\r\n]+\s*minimum:\s*([0-9.]+)/)
        q.coverage = m ? m[1] : undefined
      } catch {}
    }

    // MCP servers
    let mcpNames = []
    try {
      const rootMcp = path.join(projectRoot, 'mcp.json')
      if (fs.existsSync(rootMcp)) {
        const j = JSON.parse(fs.readFileSync(rootMcp, 'utf8'))
        mcpNames = Object.keys(j.mcpServers || {})
      }
    } catch {}

    const makeMd = (tool) => {
      const lines = []
      lines.push(`# ${tool} Configuration Overview`)
      lines.push('')
      lines.push(`## Project`)
      lines.push(`- Name: ${project.name || ''}`)
      lines.push(`- Description: ${project.description || ''}`)
      lines.push('')
      lines.push('## Roles')
      for (const [k, v] of Object.entries(roles)) lines.push(`- ${k}: ${v}`)
      lines.push('')
      lines.push('## Tech Stack')
      lines.push(`- Frontend: ${frontend.join(', ')}`)
      lines.push(`- Backend: ${backend.join(', ')}`)
      lines.push(`- Contracts: ${contracts.join(', ')}`)
      lines.push('')
      lines.push('## Quality Gates')
      if (q.specFirst !== undefined) lines.push(`- Spec-First: ${q.specFirst}`)
      if (q.testFirst !== undefined) lines.push(`- Test-First: ${q.testFirst}`)
      if (q.coverage !== undefined) lines.push(`- Coverage minimum: ${q.coverage}`)
      lines.push('')
      lines.push('## MCP Servers')
      if (mcpNames.length) mcpNames.forEach((n) => lines.push(`- ${n}`))
      else lines.push('- (none)')
      lines.push('')
      lines.push('> Generated from .ai/config.yaml; do not edit this file manually.')
      return lines.join('\n')
    }

    const targets = [
      { out: path.join(projectRoot, '.claude', 'CLAUDE.generated.md'), tool: 'Claude' },
      { out: path.join(projectRoot, '.codex', 'CODEX.generated.md'), tool: 'Codex' },
      { out: path.join(projectRoot, '.kiro', 'KIRO.generated.md'), tool: 'Kiro' }
    ]
    for (const t of targets) {
      ensureDir(path.dirname(t.out))
      fs.writeFileSync(t.out, makeMd(t.tool))
    }
    console.log('🪄 Wrote generated markdown overviews for Claude/Codex/Kiro')
  }
} catch (e) {
  console.warn('⚠️ Markdown generation failed:', e?.message)
}

// --- Sync root mcp.json to .codex/mcp.json (parity with Claude) ---
try {
  const rootMcp = path.join(projectRoot, 'mcp.json')
  const codexMcp = path.join(projectRoot, '.codex', 'mcp.json')
  if (fs.existsSync(rootMcp)) {
    ensureDir(path.dirname(codexMcp))
    fs.copyFileSync(rootMcp, codexMcp)
    console.log('🪄 Synced root mcp.json to .codex/mcp.json')
  }
} catch {}
