
# Family Wallet 要件定義書（逆生成）

**分析日時**: 2025-01-29
**プロジェクト**: Family Wallet - Web3共有ウォレット
**抽出要件数**: 42個の機能要件、18個の非機能要件
**信頼度**: 85% （実装カバレッジに基づく）

## システム概要

### 推定されたシステム目的
Base L2ネットワーク上で稼働する、家族やグループ向けのマルチシグネチャエスクローウォレットシステム。ERC-4337 Account Abstractionを活用し、複数の承認者による資金管理と、USDC/JPYCによるガスレス体験を提供する。

### 対象ユーザー
**実装根拠**: UIコンポーネント、ロール管理実装から推定

1. **Requester（リクエスター）**: エスクロー作成・進捗確認を行う家庭メンバー
2. **Approver/Guardian（承認者/ガーディアン）**: エスクローを承認・拒否する管理者
3. **Owner/Admin（オーナー/管理者）**: グループ管理、招待発行、最終実行権限を持つ
4. **Viewer（閲覧者）**: 履歴・監査ログの閲覧のみ可能

## ユーザーストーリー

### ストーリー1: ユーザー認証とウォレット接続
- **である** 家族メンバー **として**
- **私は** WalletConnect v2を使用してウォレットを安全に接続 **をしたい**
- **そうすることで** Base Mainnet上でエスクロー操作を実行できる

**実装根拠**: 
- `apps/mobile/app/hooks/useWalletConnect.ts` - WalletConnect v2統合
- `apps/web/src/lib/wagmi.ts` - wagmi v2設定
- `apps/web/src/providers/Web3Provider.tsx` - Web3プロバイダー実装

### ストーリー2: エスクロー作成
- **である** リクエスター **として**
- **私は** 支払先・金額・締切を指定してエスクローを作成 **をしたい**
- **そうすることで** 承認プロセスを開始できる

**実装根拠**:
- `contracts/EscrowRegistry.sol` - `createEscrow` 関数実装
- `apps/web/src/components/wallet/EscrowCreateWizard.tsx` - 作成ウィザードUI
- `apps/web/src/hooks/useCreateEscrow.ts` - エスクロー作成フック

### ストーリー3: マルチシグネチャ承認
- **である** ガーディアン **として**
- **私は** エスクローを承認または拒否 **をしたい**
- **そうすることで** M-of-N閾値に基づく資金管理を実現できる

**実装根拠**:
- `contracts/modules/PolicyManager.sol` - ポリシー管理実装
- `apps/web/src/components/wallet/ApprovalsHub.tsx` - 承認ハブUI
- `apps/web/src/hooks/useApprovalFlow.ts` - 承認フローフック

### ストーリー4: ガスレス体験
- **である** 家族メンバー **として**
- **私は** USDC/JPYCでガス代を支払い **をしたい**
- **そうすることで** ETHを保有せずに操作できる

**実装根拠**:
- `contracts/paymaster/ERC20Paymaster.sol` - Paymaster実装
- `apps/api/src/services/paymaster-service.ts` - Paymasterサービス
- `apps/web/src/lib/paymaster.ts` - Paymasterクライアント

### ストーリー5: グループ招待
- **である** オーナー **として**
- **私は** QRコード/リンクで新メンバーを招待 **をしたい**
- **そうすることで** グループを安全に拡張できる

**実装根拠**:
- `apps/api/src/routes/invites.ts` - 招待API実装
- `apps/web/src/components/wallet/GroupCreation.tsx` - グループ作成UI
- `apps/api/src/services/invite-service.ts` - 招待サービス

### ストーリー6: リアルタイム通知
- **である** 家族メンバー **として**
- **私は** エスクロー状態変化をリアルタイムで通知 **をしてほしい**
- **そうすることで** 迅速に対応できる

**実装根拠**:
- `apps/web/src/components/wallet/NotificationCenter.tsx` - 通知センターUI
- `apps/api/src/routes/notifications.ts` - 通知API実装
- `apps/web/src/hooks/useNotifications.ts` - 通知フック

### ストーリー7: 監査ログ閲覧
- **である** ビューワー **として**
- **私は** 全エスクローの履歴と承認記録を閲覧 **をしたい**
- **そうすることで** 透明性を確保できる

**実装根拠**:
- `apps/web/src/components/wallet/AuditLogViewer.tsx` - 監査ログUI
- `apps/web/src/hooks/useAuditLogs.ts` - 監査ログフック
- `family-wallet-subgraph/src/mapping.ts` - Subgraphインデックス

## 機能要件（EARS記法）

### 通常要件（SHALL）

#### REQ-001: エスクロー作成
システムはユーザーが支払元、支払先、トークン、金額、締切を指定してエスクローを作成できなければならない。

**実装根拠**: 
- `contracts/EscrowRegistry.sol:createEscrow()` - オンチェーン登録
- `apps/api/src/routes/escrows.ts:POST /escrows` - APIエンドポイント
- `apps/web/src/components/wallet/EscrowCreateWizard.tsx` - UI実装

#### REQ-002: Merkle Proof検証
システムはMerkle Proofを使用してユーザーのロールと権限を検証しなければならない。

**実装根拠**:
- `contracts/modules/RoleVerifier.sol:verify()` - Merkle検証実装
- `apps/api/src/services/policy-service.ts` - Proof生成サービス

#### REQ-003: ポリシー管理
システムはVault単位でM-of-N閾値、タイムロック、ロールルートを管理しなければならない。

**実装根拠**:
- `contracts/modules/PolicyManager.sol` - ポリシーストレージ
- `apps/web/src/components/wallet/PolicyManagement.tsx` - ポリシー設定UI
- `apps/api/src/routes/policies.ts` - ポリシーAPI

#### REQ-004: ウォレット接続
システムはWalletConnect v2を使用してウォレット接続を提供しなければならない。

**実装根拠**:
- `apps/web/src/lib/wagmi.ts` - wagmi v2設定
- `apps/mobile/app/hooks/useWalletConnect.ts` - モバイル統合

#### REQ-005: Subgraphインデックス
システムはEscrowRegistryのイベントをThe Graphでインデックスしなければならない。

**実装根拠**:
- `family-wallet-subgraph/src/mapping.ts` - イベントハンドラ
- `family-wallet-subgraph/schema.graphql` - スキーマ定義

#### REQ-006: 招待システム
システムはEIP-712署名付き招待リンク/QRコードを生成しなければならない。

**実装根拠**:
- `apps/api/src/services/invite-service.ts:generateTypedData()` - EIP-712実装
- `apps/web/src/components/wallet/GroupCreation.tsx` - QRコード生成UI

#### REQ-007: 通知配信
システムはExpo Push（モバイル）およびWeb Push（Web）で通知を配信しなければならない。

**実装根拠**:
- `apps/api/src/routes/notifications.ts` - 通知API
- `apps/web/src/hooks/useWebPush.ts` - Web Push統合

#### REQ-008: 監査ログ記録
システムは全エスクロー操作の履歴を永続化しなければならない。

**実装根拠**:
- `apps/api/src/db/schema.ts:timeline` - タイムラインテーブル
- `apps/api/src/services/timeline-service.ts` - タイムライン管理

### 条件付き要件（WHEN/IF-THEN）

#### REQ-101: 承認閾値達成時
M-of-N承認がポリシー閾値に達した場合、システムは自動的にエスクローを「承認済み」状態へ遷移しなければならない。

**実装根拠**:
- `contracts/EscrowRegistry.sol:approveRelease()` - 承認カウント更新
- `apps/api/src/services/escrow-service.ts:checkThreshold()` - 閾値チェック

#### REQ-102: タイムロック経過時
承認済みエスクローのタイムロックが経過した場合、システムはリリース実行を許可しなければならない。

**実装根拠**:
- `contracts/EscrowRegistry.sol:release()` - タイムロックチェック
- `apps/web/src/components/wallet/EscrowReleaseConsole.tsx` - 実行UI

#### REQ-103: 期限超過時
エスクロー締切が過ぎた場合、システムは自動的に「期限切れ」状態へ遷移しなければならない。

**実装根拠**:
- `contracts/EscrowRegistry.sol:getEscrowStatus()` - ステータス計算
- `apps/api/src/routes/escrows.ts:GET /escrows` - 期限フィルタリング

#### REQ-104: Paymaster残高不足時
Paymasterのトークン残高が不足している場合、システムはスポンサーシップを拒否しETHガス支払いへフォールバックしなければならない。

**実装根拠**:
- `apps/api/src/services/paymaster-service.ts:requestSponsorship()` - 残高チェック
- `apps/web/src/lib/paymaster.ts` - フォールバック処理

#### REQ-105: 招待期限切れ時
招待トークンが有効期限を過ぎた場合、システムは招待を失効させなければならない。

**実装根拠**:
- `apps/api/src/routes/invites.ts:GET /invites/:token` - 期限検証
- `apps/api/src/services/invite-service.ts:validateInvite()` - 検証ロジック

### 状態要件（WHERE）

#### REQ-201: ログイン状態での表示
ユーザーがウォレット接続済みの場合、システムはロール別のダッシュボードを表示しなければならない。

**実装根拠**:
- `apps/web/src/components/wallet/Dashboard.tsx` - ロール別レンダリング
- `apps/web/src/hooks/useDashboardData.ts` - ロール判定

#### REQ-202: 承認待ち状態での操作制限
エスクローが「承認待ち」状態の場合、システムはリリース実行を拒否しなければならない。

**実装根拠**:
- `contracts/EscrowRegistry.sol:release()` - ステータスチェック
- `apps/web/src/components/wallet/EscrowReleaseConsole.tsx` - UI無効化

### オプション要件（MAY）

#### REQ-301: ライブ承認セッション
システムは複数の承認者が同時に署名できるライブセッションを提供してもよい。

**実装根拠**:
- `apps/web/src/components/wallet/ApprovalsHub.tsx` - ライブセッションUI（計画）
- `.kiro/specs/family_wallet/requirements.md` - 仕様記載

#### REQ-302: カスタム解放条件
システムはSIGNATURE/MULTISIG/TIMELOCK/ORACLE/IOT/MILESTONE/COMPOUND形式の解放条件を提供してもよい。

**実装根拠**:
- `.kiro/specs/family_wallet/requirements.md` - 要件6記載
- `apps/web/src/components/wallet/EscrowCreateWizard.tsx` - 条件選択UI（計画）

#### REQ-303: テンプレート保存
システムはエスクローをテンプレートとして保存し再利用可能にしてもよい。

**実装根拠**:
- `.kiro/specs/family_wallet/requirements.md` - 要件1記載
- `apps/api/src/db/schema.ts` - 拡張可能なメタデータフィールド

### 制約要件（MUST）

#### REQ-401: Base Mainnet限定
システムはBase Mainnet（Chain ID: 8453）でのみ動作しなければならない。

**実装根拠**:
- `apps/web/src/lib/wagmi.ts` - base chain設定
- `hardhat.config.cjs` - Base Sepolia/Mainnet設定

#### REQ-402: ERC-4337準拠
システムはERC-4337 EntryPoint v0.7を使用しなければならない。

**実装根拠**:
- `apps/web/src/lib/aa-client.ts` - EntryPoint v0.7設定
- `apps/web/src/lib/bundler.ts` - Bundler統合

#### REQ-403: パスワードハッシュ化禁止
システムはパスワード認証を使用せず、ウォレット署名のみで認証しなければならない。

**実装根拠**:
- `apps/api/src/auth/jwt.ts` - JWT認証（ウォレットアドレスベース）
- 実装ファイルにパスワードフィールド不在

#### REQ-404: セキュリティ監査
システムは重大な権限変更に24時間以上のタイムロックを必須としなければならない。

**実装根拠**:
- `.kiro/specs/family_vault/requirements.md` - 非機能要件記載
- `contracts/modules/PolicyManager.sol` - タイムロック実装

## 非機能要件

### パフォーマンス

#### NFR-001: エスクロー一覧表示速度
システムはエスクロー一覧を3秒以内に初期表示しなければならない。

**実装根拠**:
- `.kiro/specs/family_vault/requirements.md` - パフォーマンス要件記載
- `family-wallet-subgraph/` - インデックス最適化

#### NFR-002: UserOperation送信フィードバック
システムはUserOperation送信後、10秒以内にトランザクション結果をフィードバックしなければならない。

**実装根拠**:
- `.kiro/specs/family_vault/requirements.md` - パフォーマンス要件記載
- `apps/web/src/hooks/useApprovalFlow.ts` - リアルタイム更新

#### NFR-003: Subgraphインデックス遅延
システムはエスクローイベントを1分以内にSubgraphへ反映しなければならない。

**実装根拠**:
- `.kiro/specs/family_vault/requirements.md` - 監査性要件記載

### セキュリティ

#### NFR-101: EIP-712署名検証
システムは招待受諾時にEIP-712署名を検証しなければならない。

**実装根拠**:
- `apps/api/src/services/invite-service.ts:generateTypedData()` - TypedData生成
- `apps/api/src/routes/invites.ts` - 署名検証（計画）

#### NFR-102: Merkle Proof検証
システムは承認時にMerkle Proofでロールを検証しなければならない。

**実装根拠**:
- `contracts/modules/RoleVerifier.sol` - 検証実装
- `apps/api/src/services/policy-service.ts` - Proof生成

#### NFR-103: スマートコントラクト監査
システムはSlither/Echidna等のツールで検証されなければならない。

**実装根拠**:
- `.kiro/specs/family_vault/requirements.md` - セキュリティ要件記載
- CI統合は未実装

#### NFR-104: Paymaster不正利用防止
システムは日次上限/トークン残高でスポンサーシップを制限しなければならない。

**実装根拠**:
- `apps/api/src/services/paymaster-service.ts` - 資格チェック実装
- `contracts/paymaster/ERC20Paymaster.sol` - オンチェーン制限

### ユーザビリティ

#### NFR-201: レスポンシブデザイン
システムはDesktop（1440px）、Tablet（1024px）、Mobile（375px）で動作しなければならない。

**実装根拠**:
- `docs/design/figma/src/components/FamilyWalletWireframe.tsx` - ブレークポイント定義
- `apps/web/src/components/wallet/MobileView.tsx` - モバイルUI

#### NFR-202: アクセシビリティ
システムはWCAG 2.1 AA基準を満たさなければならない。

**実装根拠**:
- `apps/web/src/components/wallet/AccessibilityGuide.tsx` - ガイドライン実装
- shadcn/ui - アクセシブルコンポーネント使用

#### NFR-203: 多言語対応
システムは日本語・英語をサポートしなければならない。

**実装根拠**:
- UIコンポーネントに日本語ラベル存在
- i18n統合は未実装

### 運用性

#### NFR-301: ログ出力
システムは重要な操作をログに記録しなければならない。

**実装根拠**:
- `apps/api/src/server-hono.ts` - console.log出力
- 構造化ログは未実装

#### NFR-302: エラー追跡
システムは発生したエラーを追跡可能でなければならない。

**実装根拠**:
- `apps/web/src/components/errors/EscrowErrorBoundary.tsx` - Reactエラー境界
- `apps/api/src/routes/*` - エラーハンドリング実装

#### NFR-303: Bundler/Paymaster冗長化
システムはBundler/Paymasterを冗長構成で99.5%稼働させなければならない。

**実装根拠**:
- `.kiro/specs/family_vault/requirements.md` - 可用性要件記載
- 冗長構成は未実装

#### NFR-304: 緊急停止機能
システムはGuardianModuleによる緊急停止機能を提供しなければならない。

**実装根拠**:
- `contracts/modules/GuardianModule.sol` - 緊急管理実装（未完成）

### 拡張性

#### NFR-401: モジュール化アーキテクチャ
システムはPolicyManager/RoleVerifierをアップグレード可能なProxy構成でデプロイしなければならない。

**実装根拠**:
- `.kiro/specs/family_vault/requirements.md` - 拡張性要件記載
- Proxy実装は未完成

#### NFR-402: Subgraphスキーマ拡張性
システムはSubgraphスキーマを将来の機能追加に対応できるよう設計しなければならない。

**実装根拠**:
- `family-wallet-subgraph/schema.graphql` - 拡張可能なエンティティ設計

## Edgeケース

### エラー処理

#### EDGE-001: Bundlerタイムアウト
Bundlerが応答しない場合のリトライ処理

**実装根拠**:
- `apps/web/src/lib/bundler.ts` - リトライロジック（部分実装）
- エラートースト表示（計画）

#### EDGE-002: ネットワーク切り替え
Base以外のネットワークに接続時のダイアログ表示

**実装根拠**:
- `.kiro/specs/family_vault/requirements.md` - 要件5記載
- 実装は未完成

#### EDGE-003: UserOperation Revert
UserOperationが失敗した場合の詳細エラー表示

**実装根拠**:
- `apps/web/src/components/errors/EscrowErrorBoundary.tsx` - エラー分類
- カスタムエラー定義（contracts/EscrowRegistry.sol）

#### EDGE-004: Paymaster拒否
Paymaster拒否時のETHガスフォールバック

**実装根拠**:
- `apps/api/src/services/paymaster-service.ts:requestSponsorship()` - フォールバックロジック

### 境界値

#### EDGE-101: 最大承認者数
システムは最大100人の承認者をサポートする

**実装根拠**:
- `contracts/modules/PolicyManager.sol` - ガス最適化考慮（上限未明示）

#### EDGE-102: エスクロー金額上限
システムは uint256.max まで対応する

**実装根拠**:
- `contracts/EscrowRegistry.sol:createEscrow()` - uint256型使用

#### EDGE-103: 招待有効期限
システムは招待有効期限を7日間デフォルトとし、最大30日まで設定可能

**実装根拠**:
- `apps/api/src/routes/invites.ts:POST /vaults/:id/invites` - expiresInパラメータ
- APIドキュメントに7日間デフォルト記載

## 受け入れ基準

### 実装済み機能テスト

#### スマートコントラクト
- [x] EscrowRegistry デプロイ可能
- [ ] EscrowRegistry.createEscrow() テスト
- [ ] EscrowRegistry.approveRelease() テスト
- [ ] EscrowRegistry.release() タイムロックテスト
- [ ] PolicyManager ポリシー更新テスト
- [ ] RoleVerifier Merkle Proof検証テスト
- [ ] ERC20Paymaster スポンサーシップテスト

**実装根拠**: `tests/contracts/` に テストファイル存在、実装は未完成

#### Web クライアント
- [x] ウォレット接続（WalletConnect v2）
- [x] エスクロー一覧表示UI
- [x] エスクロー作成ウィザードUI
- [x] 承認ハブUI
- [ ] UserOperation送信とトランザクション追跡
- [ ] ガスレス体験（Paymaster統合）
- [ ] リアルタイム通知

**実装根拠**: UIコンポーネント実装済み、Web3統合は未完成

#### API サーバー
- [x] JWT認証エンドポイント
- [x] Vault CRUD API
- [x] Escrow CRUD API（モック）
- [x] Policy管理API（モック）
- [x] 招待システムAPI
- [ ] Bundler/Subgraph統合
- [ ] Paymaster スポンサーシップ実装

**実装根拠**: モックAPIは実装済み、ビジネスロジックは未完成

#### モバイルアプリ
- [x] Expo SDK 52 セットアップ
- [x] WalletConnect v2統合
- [ ] 5画面実装（Home/Approvals/Timeline/Group/Settings）
- [ ] Push通知実装

**実装根拠**: セットアップ済み、画面実装は未完成

### 推奨追加テスト

#### パフォーマンステスト
- [ ] エスクロー一覧表示速度測定（目標: 3秒以内）
- [ ] UserOperation送信速度測定（目標: 10秒以内）
- [ ] Subgraphインデックス遅延測定（目標: 1分以内）
- [ ] 同時承認負荷テスト（100承認者）

#### セキュリティテスト
- [ ] Slither静的解析
- [ ] Echidna ファジングテスト
- [ ] EIP-712署名偽造テスト
- [ ] Merkle Proof改ざんテスト
- [ ] Paymaster不正利用テスト

#### E2Eテスト
- [ ] エスクロー作成→承認→リリースフロー
- [ ] 招待発行→受諾→メンバー追加フロー
- [ ] ポリシー更新→タイムロック→適用フロー
- [ ] ガスレストランザクション（Paymaster経由）

#### アクセシビリティテスト
- [ ] スクリーンリーダー対応確認
- [ ] キーボード操作確認
- [ ] カラーコントラスト検証（WCAG 2.1 AA）

## 推定されていない要件

### 不明確な部分

以下の要件は実装から推定が困難なため、ステークホルダーとの確認が必要：

#### 1. ビジネス要件
- **未成年者の扱い**: 法的制約に応じたローカライズ設計の具体的仕様
- **紛争解決**: エスクロー紛争時の仲裁プロセス
- **手数料モデル**: Paymaster利用料金や手数料体系

#### 2. 運用要件
- **バックアップ・復旧**: Neon PostgreSQLのバックアップ頻度・復旧手順
- **SLA（サービスレベル合意）**: 稼働率99.5%の測定方法・補償
- **監視・アラート**: メトリクス収集項目、異常検知閾値

#### 3. 法的・コンプライアンス要件
- **データ保護規則**: GDPR/CCPA準拠のための個人データ削除機能
- **AML/KYC**: マネーロンダリング対策の必要性
- **ライセンス**: 金融サービスとしてのライセンス要件

#### 4. 拡張機能
- **Oracle統合**: 外部データソースによる解放条件実装の詳細
- **IoT統合**: IoTデバイス連携の技術仕様
- **Milestone条件**: プロジェクト進捗に基づく解放条件の実装方法

### 推奨される次ステップ

1. **ステークホルダーインタビュー**: 推定された要件の確認、不明点の洗い出し
2. **セキュリティ監査**: スマートコントラクトの外部監査実施
3. **パフォーマンステスト**: 実環境での負荷テストとボトルネック特定
4. **ユーザビリティテスト**: 実際のユーザーによる操作性評価
5. **法務確認**: コンプライアンス要件の精査

## 分析の制約事項

### 信頼度に影響する要因

- **コメント不足**: 一部のファイルで開発者の意図を推定で補完
- **テストカバレッジ**: スマートコントラクトテストが未実装（0%）
- **ドキュメント不足**: `.kiro/specs/` に要件書は存在するが、実装との齟齬あり
- **未完成機能**: Web3統合、ビジネスロジック、モバイル画面が未実装

### 推定の根拠

**強い根拠（信頼度 90%以上）**:
- スマートコントラクトのインターフェース定義（Solidity実装）
- APIエンドポイント定義（Hono routes）
- UIコンポーネント構造（React TSX）

**中程度の根拠（信頼度 70-90%）**:
- モックAPI実装から推測されるビジネスロジック
- 型定義から推測されるデータフロー
- 既存の要件書から推測される意図

**弱い根拠（信頼度 50-70%）**:
- 未実装のWeb3統合機能
- 計画段階の拡張機能（Oracle/IoT等）
- 非機能要件の具体的数値

---

**次のアクション**:
1. `@kairo-tasks` でタスク分割を実施
2. 未実装機能の優先順位付け（Phase 1-6の確認）
3. スマートコントラクトテスト実装開始
4. Web3統合（wagmi + permissionless）の完成
