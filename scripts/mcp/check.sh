#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
MCP_FILE="$ROOT_DIR/mcp.json"

if [ ! -f "$MCP_FILE" ]; then
  echo "mcp.json not found at repo root" >&2
  exit 1
fi

echo "MCP servers defined in mcp.json:"
node - <<'NODE'
const fs = require('fs');
const p = require('path');
const file = p.join(process.cwd(), 'mcp.json');
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
const servers = j.mcpServers || {};
for (const [name, cfg] of Object.entries(servers)) {
  const cmd = [cfg.command, ...(cfg.args||[])].filter(Boolean).join(' ');
  console.log(`- ${name}: ${cmd}`);
}
NODE

echo
echo "Connectivity checks are skipped in restricted environments."
echo "To test locally: run each command with --version or help."

