# ファミリー共有ウォレット 実装タスクリスト

## 概要

本タスクリストは Base 上のファミリー共有ウォレットを段階的に実装するためのロードマップである。要件定義書/設計書に基づき、tsumiki フレームワークを活用してタスクを順次完了させる。各フェーズでは `@kairo-*` / `@tdd-*` コマンドのログを取得し、レビュー承認を経て次工程に進む。

## 実装フェーズ

### 1. プロジェクト準備
- [ ] 1.1 モノレポ整備とパッケージセットアップ
  - `pnpm` ワークスペースに `apps/web`, `apps/mobile`, `apps/api`, `packages/shared`, `contracts` を登録
  - Biome, tsconfig, lint 設定反映
  - `npm run agents:sync` により tsumiki コマンド同期
- [ ] 1.2 Tsumiki フロー定義
  - `@kairo-requirements` `@kairo-design` `@kairo-tasks` のログを `.kiro/logs` に保存
  - CI で tsumiki コマンド実行確認 (`npm run ai:migrate` 等)

### 2. コントラクト基盤
- [ ] 2.1 Foundry/Hardhat 環境構築
  - `contracts/` に Foundry プロジェクト初期化
  - Prettier/solhint/slither 設定
- [ ] 2.2 EscrowRegistry スケルトン
  - ストレージ構造、イベント、基本関数プロトタイプ定義
  - 初期テスト `forge test` 雛形作成
- [ ] 2.3 PolicyManager/RoleVerifier 下準備
  - Policy/Role 構造体とインターフェース定義
  - Merkle 検証ライブラリ配置
- [ ] 2.4 ERC20Paymaster/GuardianModule スケルトン
  - Paymaster 基本フロー、Guardian 操作の雛形

### 3. コントラクト詳細実装
- [ ] 3.1 EscrowRegistry コアロジック
  - `createEscrow` / `approveRelease` / `release` / `cancel` / `revokeApproval`
  - ポリシー参照・閾値/タイムロック検証
  - テスト: 正常系/閾値不足/タイムロック未経過/Deadline 超過
- [ ] 3.2 PolicyManager 完成
  - Policy 作成/更新/スケジュール/ファイナライズ
  - Guardian 緊急操作/イベント実装
  - テスト: 二段階更新、rolesRoot 更新、閾値保証
- [ ] 3.3 RoleVerifier 実装
  - Merkle 証明検証ロジック
  - テスト: 正当/不正/順序入れ替えケース
- [ ] 3.4 ERC20Paymaster 実装
  - Sponsorship 判定、トークン残高/日次上限/Oracle 連携
  - テスト: 成功/拒否/上限超過、ガスコスト計測
- [ ] 3.5 GuardianModule 実装
  - リカバリフロー、緊急停止、再開
  - テスト: 正常/不正証明/タイムロック検証

### 4. オフチェーン基盤
- [ ] 4.1 Hono API スケルトン
  - ルーティング構造、ミドルウェア、Drizzle 接続
- [ ] 4.2 Supabase/DB スキーマ作成
  - Vault/Member/EscrowSnapshot/Approvals/Notifications テーブル
- [ ] 4.3 サブグラフテンプレート
  - エンティティ/マッピング定義、デプロイスクリプト
- [ ] 4.4 Bundler/Paymaster クライアント共通化
  - `packages/shared` に `AaClient` 実装（permissionless SDK ラップ）
- [ ] 4.5 招待 API 拡張
  - `/vaults/:id/invites` エンドポイント追加（発行/一覧/失効）
  - 招待署名生成・検証を InviteService に実装
  - Drizzle `invites` テーブルと Supabase 連携、E2E テスト

### 5. クライアント基盤
- [ ] 5.1 Web アプリ初期化
  - Next.js + Tailwind/shadcn セットアップ
  - wagmi/WalletConnect/React Query/Zustand 設定
- [ ] 5.2 モバイルアプリ初期化
  - Expo Router, WalletConnect, React Query
  - オフラインストレージ設計
- [ ] 5.3 Shared パッケージ整備
  - 型定義、定数、ABI、ユーティリティ
  - Tsumiki ラッパとドキュメント同期コマンド

### 6. 機能実装（オンチェーン連携）
- [ ] 6.1 エスクロー作成 UI/UX
  - フォーム、テンプレート保存、API 投稿、UserOperation 構築
  - テスト: UI/Hook のユニットテスト
- [ ] 6.2 承認/リリースフロー
  - 承認ボタン → UserOperation 送信 → Bundler 結果反映
  - タイムライン表示、エラーハンドリング
- [ ] 6.3 ポリシー編集 UI
  - 閾値/タイムロック/rolesRoot 更新フロー
  - Guardian 要承認操作の扱い
- [ ] 6.4 モバイル承認体験
  - QR スキャン → WalletConnect セッション → 承認送信
  - Push 通知連携
- [ ] 6.5 解放条件ステップ拡張
  - エスクロー作成ウィザードに SIGNATURE/MULTISIG/TIMELOCK/ORACLE/IOT/MILESTONE/COMPOUND の選択肢を追加
  - 各条件の入力項目とポリシー整合性チェック（警告表示）を実装
  - フロント/バックエンドのバリデーションと型定義を更新
- [ ] 6.6 Approvals Hub 機能追加
  - 同期（ライブセッション）/非同期署名タブ、閾値進捗ゲージ、Deadline 表示
  - ライブセッション用 QR/リンク生成、WebSocket/SignalR 仮実装
  - Supabase/サブグラフからの承認更新をリアルタイム反映
- [ ] 6.7 Escrow Release Console 実装
  - Ready/Waiting カード、`release()` 実行、ガード条件ガイド
  - Bundler 結果と Timeline の再取得、失敗時のアラート
  - Playwright/RTL テストでパスを検証

### 7. ガススポンサー & fallback
- [ ] 7.1 Paymaster API 連携
  - `/paymaster/sponsor` 実装、トークン残高チェック
- [ ] 7.2 クライアント fallback UI
  - Sponsor 失敗時に ETH ガス選択肢を提示
- [ ] 7.3 Paymaster モニタリング
  - 失敗率/残高のメトリクス収集

### 8. 可視化・通知
- [ ] 8.1 サブグラフ連携
  - Web/Mobile からのデータ取得、リアルタイム更新
- [ ] 8.2 タイムライン/監査画面
  - 承認履歴、UserOperation ハッシュ、コメント表示
- [ ] 8.3 通知システム
  - Expo Push & Web Push 実装、通知設定管理
- [ ] 8.4 Figma v8.0 ワイヤーフレーム反映
  - `docs/design/figma` v8.0 の Approvals Hub / Group Creation & Invite / Escrow Release Console / Mobile Group Tab を Web & Mobile に実装
  - React Query / Zustand / Expo Hooks による実データ連携、Skeleton/Empty/Error 状態の網羅
  - Web Push / Expo Push 登録フロー、Paymaster fallback、Bundler ステータス表示の UX を仕様どおりに統合
- [ ] 8.5 Approvals Hub UI 精緻化
  - Threshold Progress、Approvals List Item、Live Session Toast を shadcn コンポーネントで再現
  - ライブセッション中の参加者リストと進捗バッジを実装
  - Playwright/Rich Snapshot によるビジュアル回帰テスト
- [ ] 8.6 Group Invite 管理 UI
  - Group Settings に招待一覧/QR 再発行/失効ボタンを追加
  - Invite Card コンポーネントとロール/重みバッジを実装
  - Supabase 連携による履歴ダウンロード・CSV 生成
- [ ] 8.7 モバイル Group Tab & 招待バナー
  - Expo Router に Group タブを追加、Invite Builder・ステータスリストを実装
  - Home タブに招待バナー（件数/CTA）を表示
  - Detox シナリオ（招待受領/失効）を追加

### 9. セキュリティ/監査
- [ ] 9.1 コントラクト監査対応
  - Slither, Echidna, Gas レポート、形式的検証サマリ
- [ ] 9.2 PenTest/バグバウンティ準備
  - ガイドライン作成、報告フロー整備

### 10. QA & テスト
- [ ] 10.1 Foundry テスト拡充
  - カバレッジ 90%+、ガスベンチ最適化
- [ ] 10.2 Web/Mobile テスト
  - RTL, Playwright, Detox のシナリオ整備
- [ ] 10.3 API テスト
  - Hono ルートの統合テスト、Supabase モック
- [ ] 10.4 Tsumiki/TDD レポート
  - `@tdd-*` コマンドログ整備、CI で検証

### 11. デプロイ & 運用
- [ ] 11.1 コントラクトデプロイ
  - Base Mainnet へデプロイ、アドレス保存、Etherscan Verify
- [ ] 11.2 Subgraph デプロイ
  - Base Network でサブグラフ公開、ヘルスチェック
- [ ] 11.3 API デプロイ
  - Cloudflare Workers デプロイ、KV/環境変数設定
- [ ] 11.4 Web/Mobile リリース
  - Vercel デプロイ、Expo OTA 配信、ストア申請準備
- [ ] 11.5 監視/アラート設定
  - Bundler/Paymaster/Supabase/Workers のメトリクスと alert 設定

### 12. ドキュメント & 移行
- [ ] 12.1 README/Runbook 更新
  - 利用統合ガイド、環境変数、手順書
- [ ] 12.2 仕様書同期
  - `.kiro/specs` と `.kiro/logs` の最新化、tsumiki コマンド結果添付
- [ ] 12.3 トレーニング資料
  - ユーザー向け利用ガイド、運用チーム向け SOP

## 更新サマリ (2025-09-29)
- 招待 API と InviteService 実装タスク (4.5) を追加し、EIP-712 招待フローのバックエンド対応を明示。
- 機能実装フェーズに解放条件ステップ、Approvals Hub、Escrow Release Console の新タスク (6.5〜6.7) を追加し、同期/非同期マルチシグの要件を反映。
- 可視化フェーズに Figma v8.0 反映および Web/Mobile 両方の Approvals Hub・Group Invite・招待バナー実装タスク (8.4〜8.7) を追加。
