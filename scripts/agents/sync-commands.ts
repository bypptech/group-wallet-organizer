#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const srcShared = path.join(root, '.ai', 'templates', 'commands')
const codexDst = path.join(root, '.codex', 'commands')
const claudeDst = path.join(root, '.claude', 'commands')

function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }) }
function list(dir: string) {
  const out: string[] = []
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...list(full))
    else out.push(full)
  }
  return out
}
function copyIfMissing(src: string, dst: string) {
  if (fs.existsSync(dst)) return false
  ensureDir(path.dirname(dst))
  fs.copyFileSync(src, dst)
  return true
}

// 1) Seed .codex/commands from .claude/commands if empty
ensureDir(codexDst)
const codexEmpty = list(codexDst).length === 0
if (codexEmpty && fs.existsSync(claudeDst)) {
  for (const f of list(claudeDst)) {
    const rel = path.relative(claudeDst, f)
    const dst = path.join(codexDst, rel)
    ensureDir(path.dirname(dst))
    fs.copyFileSync(f, dst)
  }
  console.log('Seeded .codex/commands from .claude/commands')
}

// 2) Copy shared templates into both destinations if missing
if (fs.existsSync(srcShared)) {
  let copied = 0
  for (const f of list(srcShared)) {
    const rel = path.relative(srcShared, f)
    if (copyIfMissing(f, path.join(claudeDst, rel))) copied++
    if (copyIfMissing(f, path.join(codexDst, rel))) copied++
  }
  console.log(`Shared templates applied (new files): ${copied}`)
} else {
  console.log('No shared templates found under .ai/templates/commands')
}

console.log('✅ agents:sync completed')

