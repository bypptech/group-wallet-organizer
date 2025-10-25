#!/usr/bin/env node
/**
 * Sync specs between docs/* and .kiro/specs/<project>
 *
 * Default direction: docs -> .kiro
 * Usage:
 *   node scripts/specs/sync-specs.js --project <name> [--from docs|kiro] [--dry]
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const has = (name) => args.includes(name);

const project = getArg('--project');
const from = getArg('--from', 'docs'); // 'docs' | 'kiro'
const dry = has('--dry');

if (!project) {
  console.error('Missing --project <name>');
  process.exit(1);
}

const repo = process.cwd();
const docsDir = path.join(repo, 'docs');
const kiroDir = path.join(repo, '.kiro', 'specs', project);

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const exists = (p) => fs.existsSync(p);

const pickFirst = (candidates) => candidates.find(exists);

const detectFromDocs = () => {
  const req = pickFirst([
    path.join(docsDir, 'specs', `${project}-requirements.md`),
    path.join(docsDir, 'specs', 'requirements.md'),
  ]);
  const design = pickFirst([
    path.join(docsDir, 'design', `${project}-architecture.md`),
    path.join(docsDir, 'design', 'architecture.md'),
    path.join(docsDir, 'design', `${project}`, 'architecture.md'),
  ]);
  const tasks = pickFirst([
    path.join(docsDir, 'tasks', `${project}-tasks.md`),
    path.join(docsDir, 'tasks', 'tasks.md'),
  ]);
  return { req, design, tasks };
};

const detectFromKiro = () => {
  const req = path.join(kiroDir, 'requirements.md');
  const design = path.join(kiroDir, 'design.md');
  const tasks = path.join(kiroDir, 'tasks.md');
  return { req: exists(req) ? req : undefined, design: exists(design) ? design : undefined, tasks: exists(tasks) ? tasks : undefined };
};

const copy = (src, dst) => {
  if (!src) return false;
  if (dry) { console.log(`[dry] copy ${src} -> ${dst}`); return true; }
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
  console.log(`copied ${path.relative(repo, src)} -> ${path.relative(repo, dst)}`);
  return true;
};

if (from === 'docs') {
  const { req, design, tasks } = detectFromDocs();
  if (!req && !design && !tasks) {
    console.error(`No docs specs found for project '${project}'.`);
    process.exit(2);
  }
  copy(req, path.join(kiroDir, 'requirements.md'));
  copy(design, path.join(kiroDir, 'design.md'));
  copy(tasks, path.join(kiroDir, 'tasks.md'));
  console.log('✅ Synced docs -> .kiro');
} else if (from === 'kiro') {
  const { req, design, tasks } = detectFromKiro();
  if (!req && !design && !tasks) {
    console.error(`No .kiro specs found for project '${project}'.`);
    process.exit(3);
  }
  const outSpecs = path.join(docsDir, 'specs', `${project}-requirements.md`);
  const outDesign = path.join(docsDir, 'design', `${project}-architecture.md`);
  const outTasks = path.join(docsDir, 'tasks', `${project}-tasks.md`);
  copy(req, outSpecs);
  copy(design, outDesign);
  copy(tasks, outTasks);
  console.log('✅ Synced .kiro -> docs');
} else {
  console.error(`Unknown --from '${from}', expected 'docs' or 'kiro'`);
  process.exit(4);
}

