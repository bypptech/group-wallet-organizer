# AI Configuration (Single-Source + MCP)

This repo uses a single-source configuration under `.ai/` and generates tool-specific files for Claude, Codex, Gemini, and Kiro.

## Single Source of Truth

- `.ai/config.yaml` — project, roles, tech stack, quality gates, MCP references
- `.ai/quality-gates.yaml` — quality gates canonical definition
- `.ai/templates/commands/` — shared command templates distributed to agents

Run:
- `npm run ai:migrate` — sync `.ai` settings into `.claude/.gemini/.kiro` (non-destructive)
- `npm run agents:sync` — distribute shared command templates into `.claude/commands` and `.codex/commands` (missing-only)

## MCP Servers

- Root `mcp.json` defines unified MCP server configuration.
- `npm run ai:migrate` mirrors `mcp.json` to `.claude/mcp.json` for backward compatibility.
- Check configured servers:
  - `bash scripts/mcp/check.sh`

Example `mcp.json` entries include Context7, sequential-thinking, and OpenZeppelin Contracts registry.

## Conventions

- Edit only files in `.ai/`. Generated files under tool directories are not hand-edited.
- Add neutral, tool-agnostic content in shared templates; keep tool-specific nuances minimal.

