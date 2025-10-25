# Claude エージェント運用指針（このディレクトリ配下に適用）

## 優先適用順
1. 会話の指示（System/Developer/User）
2. ルート `AGENTS.md`
3. 本ファイル（`.claude/AGENTS.md`）
4. 仕様の正本: `.kiro/specs/<project>/{requirements.md,design.md,tasks.md}`
5. AI共通設定の正本: `.ai/{config.yaml,quality-gates.yaml}`（ツール側は生成物）
6. ドラフト仕様: `docs/{specs,design,tasks}`（承認後 `.kiro/specs` に同期）

## 基本方針
- 仕様は `.kiro/specs` を最優先。`docs` はドラフト用。
- `.ai/` を単一ソースとして生成物（`config.generated.yaml` など）を参照。
- コマンド表記は `@kairo-*`, `@tdd-*`, `@rev-*` を用いる。
- MCP はルート `mcp.json` を正とし、`.claude/mcp.json` は同期生成。

