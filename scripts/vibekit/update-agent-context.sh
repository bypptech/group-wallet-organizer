#!/usr/bin/env bash
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
FEATURE_DIR="$REPO_ROOT/docs/specs/$CURRENT_BRANCH"
NEW_PLAN="$FEATURE_DIR/plan.md"

# Agent context files in integrated layout
CLAUDE_FILE="$REPO_ROOT/.claude/CLAUDE.md"
GEMINI_FILE="$REPO_ROOT/.gemini/GEMINI.md"
COPILOT_FILE="$REPO_ROOT/.github/copilot-instructions.md"

AGENT_TYPE="$1"

if [ ! -f "$NEW_PLAN" ]; then
  echo "ERROR: No plan.md found at $NEW_PLAN"
  exit 1
fi

echo "=== Updating agent context files for feature $CURRENT_BRANCH ==="

NEW_LANG=$(grep "^**Language/Version**: " "$NEW_PLAN" 2>/dev/null | head -1 | sed 's/^**Language\/Version**: //' | grep -v "NEEDS CLARIFICATION" || echo "")
NEW_FRAMEWORK=$(grep "^**Primary Dependencies**: " "$NEW_PLAN" 2>/dev/null | head -1 | sed 's/^**Primary Dependencies**: //' | grep -v "NEEDS CLARIFICATION" || echo "")
NEW_TESTING=$(grep "^**Testing**: " "$NEW_PLAN" 2>/dev/null | head -1 | sed 's/^**Testing**: //' | grep -v "NEEDS CLARIFICATION" || echo "")
NEW_DB=$(grep "^**Storage**: " "$NEW_PLAN" 2>/dev/null | head -1 | sed 's/^**Storage**: //' | grep -v "N/A" | grep -v "NEEDS CLARIFICATION" || echo "")
NEW_PROJECT_TYPE=$(grep "^**Project Type**: " "$NEW_PLAN" 2>/dev/null | head -1 | sed 's/^**Project Type**: //' || echo "")

update_agent_file() {
  local target_file="$1"
  local agent_name="$2"

  echo "Updating $agent_name context file: $target_file"

  local temp_file=$(mktemp)

  if [ ! -f "$target_file" ]; then
    # If missing, try to create from template in docs/templates
    if [ -f "$REPO_ROOT/docs/templates/agent-file-template.md" ]; then
      cp "$REPO_ROOT/docs/templates/agent-file-template.md" "$temp_file"
    else
      touch "$temp_file"
    fi
    # Fill placeholders when possible
    sed -i.bak "s|\[PROJECT NAME\]|$(basename "$REPO_ROOT")|" "$temp_file" || true
    local COMMANDS="# Add commands for $NEW_LANG"
    if [[ "$NEW_LANG" == *"Python"* ]]; then COMMANDS="cd src && pytest && ruff check ."; fi
    if [[ "$NEW_LANG" == *"Rust"* ]]; then COMMANDS="cargo test && cargo clippy"; fi
    if [[ "$NEW_LANG" == *"JavaScript"* ]] || [[ "$NEW_LANG" == *"TypeScript"* ]]; then COMMANDS="npm test && npm run lint"; fi
    sed -i.bak "s|\[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES\]|$COMMANDS|" "$temp_file" || true
    sed -i.bak "s|\[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE\]|$NEW_LANG: Follow standard conventions|" "$temp_file" || true
    sed -i.bak "s|\[LAST 3 FEATURES AND WHAT THEY ADDED\]|- $CURRENT_BRANCH: Added $NEW_LANG + $NEW_FRAMEWORK|" "$temp_file" || true
    rm -f "$temp_file.bak"
  else
    # Update existing file (python snippet from legacy script)
    python3 - "$target_file" "$CURRENT_BRANCH" "$NEW_LANG" "$NEW_FRAMEWORK" "$NEW_DB" "$NEW_PROJECT_TYPE" << 'PY'
import re, sys
from datetime import datetime
path, branch, lang, framework, db, ptype = sys.argv[1:]
with open(path, 'r') as f:
    content = f.read()
tech = re.search(r'## Active Technologies\n(.*?)\n\n', content, re.DOTALL)
if tech:
    existing = tech.group(1)
    adds = []
    if lang and lang not in existing:
        adds.append(f"- {lang} + {framework} ({branch})")
    if db and db not in existing:
        adds.append(f"- {db} ({branch})")
    if adds:
        updated = existing + "\n" + "\n".join(adds)
        content = content.replace(tech.group(0), f"## Active Technologies\n{updated}\n\n")
if ptype == 'web' and 'frontend/' not in content:
    struct = re.search(r'## Project Structure\n```\n(.*?)\n```', content, re.DOTALL)
    if struct:
        s = struct.group(1) + "\nfrontend/src/      # Web UI"
        content = re.sub(r'(## Project Structure\n```\n).*?(\n```)', f"\\1{s}\\2", content, flags=re.DOTALL)
cmd = re.search(r'## Commands\n```bash\n(.*?)\n```', content, re.DOTALL)
if cmd:
    block = cmd.group(1)
    if 'Python' in lang:
        block += "\ncd src && pytest && ruff check ."
    elif 'Rust' in lang:
        block += "\ncargo test && cargo clippy"
    elif 'JavaScript' in lang or 'TypeScript' in lang:
        block += "\nnpm test && npm run lint"
    content = re.sub(r'(## Commands\n```bash\n).*?(\n```)', f"\\1{block}\\2", content, flags=re.DOTALL)
content = re.sub(r'Last updated: \d{4}-\d{2}-\d{2}', f"Last updated: {datetime.now().strftime('%Y-%m-%d')}", content)
with open(path, 'w') as f:
    f.write(content)
PY
    cp "$target_file" "$temp_file"
  fi

  mv "$temp_file" "$target_file"
  echo "✅ $agent_name context file updated successfully"
}

case "$AGENT_TYPE" in
  "claude") update_agent_file "$CLAUDE_FILE" "Claude" ;;
  "gemini") update_agent_file "$GEMINI_FILE" "Gemini" ;;
  "copilot") update_agent_file "$COPILOT_FILE" "GitHub Copilot" ;;
  "") update_agent_file "$CLAUDE_FILE" "Claude"; update_agent_file "$GEMINI_FILE" "Gemini" ;;
  *) echo "Unknown agent: $AGENT_TYPE"; exit 1 ;;
esac

