# Tsumiki × Web3AIVibeCodingKit Integration Guide

## Overview

This comprehensive guide explains how to effectively use the integrated Tsumiki × Web3AIVibeCodingKit framework for AI-driven Web3 development. The framework combines the power of AI-assisted development with specialized Web3 templates and procedures.

## Framework Components

### 🧱 Tsumiki Framework
- **AI-driven TDD commands** for test-driven development
- **Specification generation** with AI assistance
- **Reverse engineering** capabilities for existing codebases
- **Quality assurance** built into the development process

### 🌐 Web3AIVibeCodingKit
- **Comprehensive Web3 templates** for smart contracts and dApps
- **Development procedures** optimized for blockchain development
- **Security-first approach** with built-in best practices
- **End-to-end workflow** from concept to deployment

## Complete Development Workflow

### Phase 1: Project Initialization

#### 1.1 Environment Setup
```bash
# Initialize the integrated framework
./scripts/spec-init.sh
```

### 1.2 Migrate Legacy AI Configs (Optional)

If you have pre-integration AI configuration folders from Tsumiki or Web3AIVibeCodingKit, run the migrator to import and preserve them for reuse.

```bash
# Merge strategy with rename-on-conflict (default)
npm run ai:migrate -- \
  --legacy-tsumiki /abs/path/to/tsumiki \
  --legacy-vibekit /abs/path/to/Web3AIVibeCodingKit \
  --strategy merge \
  --conflict rename
```

Notes:
- Legacy content is copied under `.claude/legacy/{tsumiki|vibekit}/`, `.gemini/legacy/{tsumiki|vibekit}/`, `.kiro/legacy/{tsumiki|vibekit}/`.
- Aggregated indexes are generated at `.claude/INDEX.md`, `.gemini/INDEX.md`, `.kiro/INDEX.md` listing both current and legacy files.
- Use `--strategy mirror` to clear previous `legacy/` before importing.
- Use `--conflict overwrite|skip` to change how collisions are handled (default is `rename` to keep both).
