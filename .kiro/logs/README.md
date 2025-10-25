# tsumiki コマンドログの運用方針

- 仕様作成コマンド `@kairo-requirements` `@kairo-design` `@kairo-tasks` を実行した際は、結果概要を `.kiro/logs` 配下に Markdown 形式で記録してください。
- ファイル名は `YYYYMMDD-kairo-<command>.md` を推奨します（例: `20250930-kairo-requirements.md`）。
- ログには以下を含めてください。
  - 実行日時と担当者
  - 対象プロジェクト・スコープ
  - 生成/更新された成果物へのリンク（例: `.kiro/specs/<project>/requirements.md`）
  - 主要な意思決定や未解決の論点
  - 次に進むべきコマンドやアクション
- 既存ログを更新する場合は追記で履歴を残し、過去の意思決定を保持します。
- 進捗ログ（例: `*-codex-progress.md`）とは別に保管し、仕様生成と実装進捗を切り分けます。

チームメンバーは `docs/design/figma` や `.kiro/specs` を参照しながら本ガイドラインに沿ってログを残してください。
